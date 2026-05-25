"""Pure-Python technical indicators. No numpy/pandas dependency.

All functions accept plain lists of floats and return lists of the same
length, with `None` placeholders where the indicator is not yet defined
(warmup period). Keeping length aligned makes downstream zipping trivial.
"""
from __future__ import annotations

from typing import List, Optional, Sequence, Tuple

Num = Optional[float]


def sma(values: Sequence[float], n: int) -> List[Num]:
    out: List[Num] = [None] * len(values)
    if n <= 0 or len(values) < n:
        return out
    s = sum(values[:n])
    out[n - 1] = s / n
    for i in range(n, len(values)):
        s += values[i] - values[i - n]
        out[i] = s / n
    return out


def ema(values: Sequence[float], n: int) -> List[Num]:
    out: List[Num] = [None] * len(values)
    if n <= 0 or len(values) < n:
        return out
    k = 2.0 / (n + 1)
    seed = sum(values[:n]) / n
    out[n - 1] = seed
    prev = seed
    for i in range(n, len(values)):
        prev = (values[i] - prev) * k + prev
        out[i] = prev
    return out


def rsi(closes: Sequence[float], n: int = 14) -> List[Num]:
    out: List[Num] = [None] * len(closes)
    if len(closes) <= n:
        return out
    gains = 0.0
    losses = 0.0
    for i in range(1, n + 1):
        d = closes[i] - closes[i - 1]
        if d >= 0:
            gains += d
        else:
            losses -= d
    avg_g = gains / n
    avg_l = losses / n
    out[n] = 100.0 if avg_l == 0 else 100.0 - 100.0 / (1.0 + avg_g / avg_l)
    for i in range(n + 1, len(closes)):
        d = closes[i] - closes[i - 1]
        g = d if d > 0 else 0.0
        l = -d if d < 0 else 0.0
        avg_g = (avg_g * (n - 1) + g) / n
        avg_l = (avg_l * (n - 1) + l) / n
        out[i] = 100.0 if avg_l == 0 else 100.0 - 100.0 / (1.0 + avg_g / avg_l)
    return out


def true_range(highs: Sequence[float], lows: Sequence[float], closes: Sequence[float]) -> List[Num]:
    out: List[Num] = [None] * len(closes)
    for i in range(len(closes)):
        if i == 0:
            out[i] = highs[i] - lows[i]
        else:
            pc = closes[i - 1]
            out[i] = max(highs[i] - lows[i], abs(highs[i] - pc), abs(lows[i] - pc))
    return out


def atr(highs: Sequence[float], lows: Sequence[float], closes: Sequence[float], n: int = 14) -> List[Num]:
    tr = true_range(highs, lows, closes)
    out: List[Num] = [None] * len(closes)
    if len(closes) < n:
        return out
    seed = sum(tr[:n]) / n  # type: ignore[arg-type]
    out[n - 1] = seed
    prev = seed
    for i in range(n, len(closes)):
        prev = (prev * (n - 1) + tr[i]) / n  # type: ignore[operator]
        out[i] = prev
    return out


def vwap(highs: Sequence[float], lows: Sequence[float], closes: Sequence[float], volumes: Sequence[float]) -> List[Num]:
    out: List[Num] = [None] * len(closes)
    cum_pv = 0.0
    cum_v = 0.0
    for i in range(len(closes)):
        tp = (highs[i] + lows[i] + closes[i]) / 3.0
        cum_pv += tp * volumes[i]
        cum_v += volumes[i]
        out[i] = cum_pv / cum_v if cum_v > 0 else None
    return out


def donchian(highs: Sequence[float], lows: Sequence[float], n: int) -> Tuple[List[Num], List[Num]]:
    """Returns (upper, lower) where upper[i] is max(highs[i-n+1..i])."""
    upper: List[Num] = [None] * len(highs)
    lower: List[Num] = [None] * len(lows)
    if n <= 0:
        return upper, lower
    for i in range(n - 1, len(highs)):
        upper[i] = max(highs[i - n + 1 : i + 1])
        lower[i] = min(lows[i - n + 1 : i + 1])
    return upper, lower


def rolling_mean(values: Sequence[float], n: int) -> List[Num]:
    return sma(values, n)


def pct_change(values: Sequence[float], n: int = 1) -> List[Num]:
    out: List[Num] = [None] * len(values)
    for i in range(n, len(values)):
        prev = values[i - n]
        if prev:
            out[i] = (values[i] - prev) / prev
    return out


def slope(values: Sequence[Num], n: int) -> Num:
    """Slope per bar of the last n values via least-squares. Returns None if window is incomplete."""
    if len(values) < n:
        return None
    window = values[-n:]
    if any(v is None for v in window):
        return None
    ys: List[float] = [float(v) for v in window]  # type: ignore[arg-type]
    xs = list(range(n))
    mean_x = sum(xs) / n
    mean_y = sum(ys) / n
    num = sum((xs[i] - mean_x) * (ys[i] - mean_y) for i in range(n))
    den = sum((xs[i] - mean_x) ** 2 for i in range(n))
    if den == 0:
        return None
    return num / den
