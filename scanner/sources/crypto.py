"""Binance public REST fetcher. No API key required.

Endpoint: GET /api/v3/klines
"""
from __future__ import annotations

from typing import List

import requests

from scanner.signals import Bars

_HOSTS = ["https://api.binance.com", "https://data-api.binance.vision"]

_INTERVAL_MAP = {
    "1m": "1m", "3m": "3m", "5m": "5m", "15m": "15m", "30m": "30m",
    "1h": "1h", "2h": "2h", "4h": "4h", "1d": "1d",
}


def fetch(symbol: str, interval: str = "5m", limit: int = 200, timeout: float = 8.0) -> Bars:
    iv = _INTERVAL_MAP.get(interval)
    if iv is None:
        raise ValueError(f"Unsupported interval for crypto: {interval}")
    last_err: Exception | None = None
    for host in _HOSTS:
        try:
            r = requests.get(
                f"{host}/api/v3/klines",
                params={"symbol": symbol.upper(), "interval": iv, "limit": limit},
                timeout=timeout,
                headers={"User-Agent": "scanner/0.1"},
            )
            r.raise_for_status()
            rows = r.json()
            return _parse(symbol, interval, rows)
        except Exception as e:
            last_err = e
    raise RuntimeError(f"Binance fetch failed for {symbol}: {last_err}")


def _parse(symbol: str, interval: str, rows: list) -> Bars:
    ts: List[int] = []
    o: List[float] = []
    h: List[float] = []
    l: List[float] = []
    c: List[float] = []
    v: List[float] = []
    for row in rows:
        ts.append(int(row[0]))
        o.append(float(row[1]))
        h.append(float(row[2]))
        l.append(float(row[3]))
        c.append(float(row[4]))
        v.append(float(row[5]))
    return Bars(
        symbol=symbol.upper(),
        asset="crypto",
        interval=interval,
        ts=ts,
        open=o,
        high=h,
        low=l,
        close=c,
        volume=v,
    )
