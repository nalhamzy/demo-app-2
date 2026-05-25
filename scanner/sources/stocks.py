"""Yahoo Finance public chart endpoint. No API key required.

We send a browser User-Agent because the endpoint 403s otherwise.
Yahoo intervals: 1m,2m,5m,15m,30m,60m,90m,1h,1d. Note `1h` ~= `60m`.
"""
from __future__ import annotations

from typing import List

import requests

from scanner.signals import Bars

_INTERVAL_MAP = {
    "1m": ("1m", "1d"),
    "2m": ("2m", "5d"),
    "5m": ("5m", "5d"),
    "15m": ("15m", "5d"),
    "30m": ("30m", "1mo"),
    "1h": ("60m", "1mo"),
    "1d": ("1d", "6mo"),
}

_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"


def fetch(ticker: str, interval: str = "5m", timeout: float = 8.0) -> Bars:
    spec = _INTERVAL_MAP.get(interval)
    if spec is None:
        raise ValueError(f"Unsupported interval for stocks: {interval}")
    iv, rng = spec
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker.upper()}"
    r = requests.get(
        url,
        params={"interval": iv, "range": rng, "includePrePost": "false"},
        timeout=timeout,
        headers={"User-Agent": _UA, "Accept": "application/json"},
    )
    r.raise_for_status()
    return _parse(ticker, interval, r.json())


def _parse(ticker: str, interval: str, data: dict) -> Bars:
    result = data.get("chart", {}).get("result")
    if not result:
        raise RuntimeError(f"Yahoo returned no result for {ticker}: {data.get('chart', {}).get('error')}")
    res = result[0]
    ts: List[int] = [int(t) * 1000 for t in res.get("timestamp", [])]
    quote = res["indicators"]["quote"][0]
    o = quote.get("open", [])
    h = quote.get("high", [])
    l = quote.get("low", [])
    c = quote.get("close", [])
    v = quote.get("volume", [])

    cleaned = [
        (ts[i], o[i], h[i], l[i], c[i], v[i] or 0)
        for i in range(len(ts))
        if None not in (o[i], h[i], l[i], c[i])
    ]
    if not cleaned:
        raise RuntimeError(f"Yahoo returned only null bars for {ticker}")

    return Bars(
        symbol=ticker.upper(),
        asset="stock",
        interval=interval,
        ts=[r[0] for r in cleaned],
        open=[float(r[1]) for r in cleaned],
        high=[float(r[2]) for r in cleaned],
        low=[float(r[3]) for r in cleaned],
        close=[float(r[4]) for r in cleaned],
        volume=[float(r[5]) for r in cleaned],
    )
