"""CLI entry point. `python -m scanner --help`"""
from __future__ import annotations

import argparse
import json
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Iterable, List

from scanner import signals as sig
from scanner.render import render_table
from scanner.universe import DEFAULT_CRYPTO, DEFAULT_STOCKS


def _split(s: str) -> List[str]:
    return [p.strip().upper() for p in s.split(",") if p.strip()]


def _parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="python -m scanner",
        description="Stock + crypto breakout scanner for quick scalps.",
    )
    p.add_argument("--asset", choices=["stocks", "crypto", "both"], default="both")
    p.add_argument("--tickers", help="Comma-separated stock tickers (override default list)")
    p.add_argument("--symbols", help="Comma-separated crypto symbols, e.g. BTCUSDT,ETHUSDT")
    p.add_argument("--interval", default="5m",
                   help="Bar interval: 1m, 5m, 15m, 30m, 1h, 1d (default 5m)")
    p.add_argument("--lookback", type=int, default=20,
                   help="Donchian + volume lookback window (default 20)")
    p.add_argument("--vol-mult", type=float, default=1.8,
                   help="Volume surge multiplier vs avg (default 1.8)")
    p.add_argument("--min-score", type=int, default=50,
                   help="Filter out signals below this score (default 50)")
    p.add_argument("--top", type=int, default=20, help="Max rows to print")
    p.add_argument("--min-dollar-vol", type=float, default=0.0,
                   help="Skip names with avg per-bar dollar volume below this")
    p.add_argument("--watch", type=int, default=0, metavar="SECONDS",
                   help="Re-run every N seconds (0 = single run)")
    p.add_argument("--json", action="store_true", help="Emit JSON instead of a table")
    p.add_argument("--demo", action="store_true",
                   help="Use synthetic bars (no network). Useful for previews and tests.")
    p.add_argument("--workers", type=int, default=8, help="Parallel fetch workers")
    p.add_argument("--quiet", action="store_true", help="Suppress fetch errors")
    return p


def _resolve_symbols(args) -> tuple[list[str], list[str]]:
    stocks: list[str] = []
    crypto: list[str] = []
    if args.asset in ("stocks", "both"):
        stocks = _split(args.tickers) if args.tickers else list(DEFAULT_STOCKS)
    if args.asset in ("crypto", "both"):
        crypto = _split(args.symbols) if args.symbols else list(DEFAULT_CRYPTO)
    return stocks, crypto


def _fetch_one(asset: str, symbol: str, interval: str):
    if asset == "stock":
        from scanner.sources import stocks as src
        return src.fetch(symbol, interval=interval)
    from scanner.sources import crypto as src
    return src.fetch(symbol, interval=interval)


def _gather(stocks: list[str], crypto: list[str], interval: str, workers: int, quiet: bool) -> Iterable[sig.Bars]:
    jobs = [("stock", s) for s in stocks] + [("crypto", s) for s in crypto]
    if not jobs:
        return []
    out: list[sig.Bars] = []
    with ThreadPoolExecutor(max_workers=max(1, workers)) as ex:
        futs = {ex.submit(_fetch_one, asset, sym, interval): (asset, sym) for asset, sym in jobs}
        for f in as_completed(futs):
            asset, sym = futs[f]
            try:
                out.append(f.result())
            except Exception as e:
                if not quiet:
                    print(f"[warn] {asset} {sym}: {e}", file=sys.stderr)
    return out


def _scan_once(args) -> list[sig.Signal]:
    if args.demo:
        from scanner.sources.fixture import demo_universe
        bars_iter = demo_universe(args.interval)
    else:
        stocks, crypto = _resolve_symbols(args)
        bars_iter = _gather(stocks, crypto, args.interval, args.workers, args.quiet)

    signals: list[sig.Signal] = []
    for bars in bars_iter:
        try:
            s = sig.evaluate(
                bars,
                lookback=args.lookback,
                vol_mult=args.vol_mult,
                min_dollar_vol=args.min_dollar_vol,
            )
            if s is not None:
                signals.append(s)
        except Exception as e:
            if not args.quiet:
                print(f"[warn] evaluate {bars.symbol}: {e}", file=sys.stderr)

    sig.apply_cohort_echo(signals)
    signals = [s for s in signals if s.score >= args.min_score]
    signals.sort(key=lambda x: (x.score, x.dollar_volume), reverse=True)
    return signals[: args.top]


def main(argv: list[str] | None = None) -> int:
    args = _parser().parse_args(argv)

    def emit(signals: list[sig.Signal]) -> None:
        if args.json:
            print(json.dumps([s.to_dict() for s in signals], indent=2, default=str))
        else:
            print(render_table(signals))

    if args.watch <= 0:
        emit(_scan_once(args))
        return 0

    seen: dict[str, int] = {}
    try:
        while True:
            signals = _scan_once(args)
            stamp = time.strftime("%H:%M:%S")
            new_count = sum(1 for s in signals if s.symbol not in seen)
            print(f"\n[{stamp}] {len(signals)} hit(s), {new_count} new since last scan")
            for s in signals:
                seen[s.symbol] = s.score
            emit(signals)
            time.sleep(args.watch)
    except KeyboardInterrupt:
        return 0
