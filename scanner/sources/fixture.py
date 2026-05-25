"""Synthetic OHLCV bars for offline demos and tests.

Deterministic given a seed. Generates a base ranging period, a compression,
then a breakout pattern with a volume surge — exactly what the scanner is
designed to flag — so `--demo` produces visible hits.
"""
from __future__ import annotations

import math
import random
from typing import List

from scanner.signals import Bars


def _bar_ms(interval: str) -> int:
    return {
        "1m": 60_000, "5m": 300_000, "15m": 900_000, "30m": 1_800_000,
        "1h": 3_600_000, "1d": 86_400_000,
    }.get(interval, 300_000)


def make_bars(
    symbol: str,
    asset: str,
    interval: str = "5m",
    n: int = 200,
    start_price: float = 100.0,
    breakout: bool = True,
    seed: int = 0,
) -> Bars:
    rng = random.Random(hash((symbol, seed)) & 0xFFFFFFFF)
    bar = _bar_ms(interval)
    base_t = 1_700_000_000_000

    closes: List[float] = []
    highs: List[float] = []
    lows: List[float] = []
    opens: List[float] = []
    vols: List[float] = []
    ts: List[int] = []

    price = start_price
    for i in range(n):
        if i < n - 30:
            drift = math.sin(i / 9.0) * 0.001
            noise = rng.gauss(0, 0.0035)
            ret = drift + noise
            vol_base = 1000 + rng.uniform(-200, 200)
        elif i < n - 5:
            ret = rng.gauss(0, 0.0012)
            vol_base = 800 + rng.uniform(-150, 150)
        else:
            if breakout:
                ret = rng.gauss(0.006, 0.003)
                vol_base = 3500 + rng.uniform(-300, 800)
            else:
                ret = rng.gauss(0, 0.003)
                vol_base = 1100 + rng.uniform(-200, 200)
        o = price
        price = max(0.01, price * (1 + ret))
        c = price
        spread = abs(c - o) + price * abs(rng.gauss(0, 0.0015))
        h = max(o, c) + spread * 0.5
        l = min(o, c) - spread * 0.5
        opens.append(round(o, 4))
        closes.append(round(c, 4))
        highs.append(round(h, 4))
        lows.append(round(l, 4))
        vols.append(round(max(1, vol_base), 2))
        ts.append(base_t + i * bar)

    return Bars(
        symbol=symbol,
        asset=asset,
        interval=interval,
        ts=ts,
        open=opens,
        high=highs,
        low=lows,
        close=closes,
        volume=vols,
    )


def demo_universe(interval: str = "5m"):
    yield make_bars("NVDA", "stock", interval, breakout=True, seed=1, start_price=950)
    yield make_bars("AMD", "stock", interval, breakout=True, seed=2, start_price=170)
    yield make_bars("AAPL", "stock", interval, breakout=False, seed=3, start_price=210)
    yield make_bars("META", "stock", interval, breakout=True, seed=4, start_price=520)
    yield make_bars("TSLA", "stock", interval, breakout=False, seed=5, start_price=240)
    yield make_bars("BTCUSDT", "crypto", interval, breakout=True, seed=6, start_price=67000)
    yield make_bars("ETHUSDT", "crypto", interval, breakout=True, seed=7, start_price=3500)
    yield make_bars("SOLUSDT", "crypto", interval, breakout=True, seed=8, start_price=170)
    yield make_bars("DOGEUSDT", "crypto", interval, breakout=False, seed=9, start_price=0.16)
    yield make_bars("XRPUSDT", "crypto", interval, breakout=False, seed=10, start_price=0.62)
