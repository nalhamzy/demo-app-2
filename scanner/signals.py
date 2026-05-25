"""Breakout / scalp signal scoring.

Inputs: a `Bars` dataclass with aligned OHLCV lists.
Output: a `Signal` with composite score (0-100), reasons, classified setup
name, and a concrete scalp plan (entry/stop/T1/T2/RR).

The scoring weights are deliberately additive and capped so that a hit
needs *multiple* confirmations to score well — single-rule fires are
unreliable for scalping.
"""
from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import List, Optional, Sequence

from scanner import indicators as ind


@dataclass
class Bars:
    symbol: str
    asset: str  # "stock" | "crypto"
    interval: str  # e.g. "5m"
    ts: List[int]  # epoch ms per bar
    open: List[float]
    high: List[float]
    low: List[float]
    close: List[float]
    volume: List[float]

    def __len__(self) -> int:
        return len(self.close)


@dataclass
class ScalpPlan:
    entry: float
    stop: float
    t1: float
    t2: float
    risk: float
    rr1: float
    rr2: float


@dataclass
class Signal:
    symbol: str
    asset: str
    interval: str
    price: float
    change_pct: float
    score: int
    setup: str
    reasons: List[str] = field(default_factory=list)
    rule_hits: List[str] = field(default_factory=list)
    plan: Optional[ScalpPlan] = None
    dollar_volume: float = 0.0
    fresh_bars_ago: int = 0  # how many bars since the breakout trigger
    cohort_bonus: int = 0

    def to_dict(self) -> dict:
        d = asdict(self)
        return d


# ---- individual rules -------------------------------------------------------

def _rule_donchian_break(bars: Bars, lookback: int) -> tuple[bool, str, int, int]:
    """Close above the prior N-bar high (excluding current bar)."""
    if len(bars) < lookback + 2:
        return False, "", 0, -1
    prior_high = max(bars.high[-lookback - 1 : -1])
    if bars.close[-1] > prior_high:
        margin = (bars.close[-1] - prior_high) / prior_high * 100
        return True, f"Donchian break +{margin:.2f}% above {lookback}-bar high", 28, 0
    if len(bars) >= lookback + 3 and bars.close[-2] > max(bars.high[-lookback - 2 : -2]):
        return True, f"Donchian break on prior bar", 18, 1
    return False, "", 0, -1


def _rule_volume_surge(bars: Bars, lookback: int, mult: float) -> tuple[bool, str, int]:
    if len(bars) < lookback + 1:
        return False, "", 0
    avg = sum(bars.volume[-lookback - 1 : -1]) / lookback
    if avg <= 0:
        return False, "", 0
    ratio = bars.volume[-1] / avg
    if ratio >= mult:
        contrib = min(22, int(8 + (ratio - mult) * 6))
        return True, f"Volume surge x{ratio:.1f} vs {lookback}-bar avg", contrib
    if ratio >= mult * 0.7:
        return True, f"Volume warming x{ratio:.1f}", 6
    return False, "", 0


def _rule_ema_stack(bars: Bars) -> tuple[bool, str, int]:
    ema9 = ind.ema(bars.close, 9)
    ema21 = ind.ema(bars.close, 21)
    ema50 = ind.ema(bars.close, 50)
    if ema9[-1] is None or ema21[-1] is None or ema50[-1] is None:
        return False, "", 0
    if ema9[-1] > ema21[-1] > ema50[-1]:
        s = ind.slope(ema9, 5)
        if s is not None and s > 0:
            return True, "EMA stack 9>21>50, rising", 18
        return True, "EMA stack 9>21>50", 12
    return False, "", 0


def _rule_atr_expansion(bars: Bars, n: int = 14) -> tuple[bool, str, int]:
    a = ind.atr(bars.high, bars.low, bars.close, n)
    if a[-1] is None or len(a) < n + 10:
        return False, "", 0
    recent = a[-1]
    base_window = [x for x in a[-n - 10 : -1] if x is not None]
    if not base_window:
        return False, "", 0
    base_window.sort()
    median = base_window[len(base_window) // 2]
    if median == 0:
        return False, "", 0
    ratio = recent / median  # type: ignore[operator]
    if ratio >= 1.5:
        return True, f"ATR expansion x{ratio:.2f}", 12
    if ratio >= 1.2:
        return True, f"ATR firming x{ratio:.2f}", 6
    return False, "", 0


def _rule_vwap_reclaim(bars: Bars) -> tuple[bool, str, int]:
    """Only meaningful intraday — VWAP is session-cumulative."""
    if bars.interval not in {"1m", "5m", "15m", "30m", "1h"}:
        return False, "", 0
    v = ind.vwap(bars.high, bars.low, bars.close, bars.volume)
    if v[-1] is None or v[-2] is None:
        return False, "", 0
    if bars.close[-1] > v[-1] and bars.close[-2] <= v[-2]:  # type: ignore[operator]
        return True, "VWAP reclaim", 10
    if bars.close[-1] > v[-1]:  # type: ignore[operator]
        return True, "Holding above VWAP", 5
    return False, "", 0


def _rule_rsi_sweetspot(bars: Bars) -> tuple[bool, str, int]:
    r = ind.rsi(bars.close, 14)
    if r[-1] is None:
        return False, "", 0
    val = r[-1]
    if 55 <= val <= 72:  # type: ignore[operator]
        return True, f"RSI {val:.0f} in trend-go zone", 10
    if val > 78:  # type: ignore[operator]
        return True, f"RSI {val:.0f} stretched", -8
    return False, "", 0


# ---- setup classifier -------------------------------------------------------

def _classify(hits: List[str]) -> str:
    s = set(hits)
    has_break = "donchian" in s
    has_vol = "volume" in s
    has_stack = "ema_stack" in s
    has_atr = "atr_expansion" in s
    has_vwap = "vwap" in s
    if has_break and has_vol and has_atr:
        return "Range Break + Vol Surge"
    if has_break and has_vol:
        return "Volume Breakout"
    if has_break and has_stack:
        return "Trend Continuation Pop"
    if has_break:
        return "Clean Breakout"
    if has_vwap and has_stack:
        return "VWAP Reclaim Trend"
    if has_vwap and has_vol:
        return "VWAP Reclaim + Volume"
    if has_stack and has_atr:
        return "Momentum Expansion"
    if has_stack:
        return "Trend Pullback"
    return "Watchlist"


# ---- plan builder -----------------------------------------------------------

def _build_plan(bars: Bars) -> Optional[ScalpPlan]:
    a = ind.atr(bars.high, bars.low, bars.close, 14)
    if a[-1] is None:
        return None
    atr_v = float(a[-1])  # type: ignore[arg-type]
    entry = bars.close[-1]
    bar_low = bars.low[-1]
    stop = min(bar_low, entry - atr_v)
    risk = entry - stop
    if risk <= 0:
        return None
    t1 = entry + atr_v
    t2 = entry + 2 * atr_v
    return ScalpPlan(
        entry=round(entry, 6),
        stop=round(stop, 6),
        t1=round(t1, 6),
        t2=round(t2, 6),
        risk=round(risk, 6),
        rr1=round((t1 - entry) / risk, 2),
        rr2=round((t2 - entry) / risk, 2),
    )


# ---- main entry -------------------------------------------------------------

def evaluate(
    bars: Bars,
    *,
    lookback: int = 20,
    vol_mult: float = 1.8,
    min_dollar_vol: float = 0.0,
) -> Optional[Signal]:
    if len(bars) < max(lookback + 3, 55):
        return None

    avg_dv = sum(bars.close[-20:][i] * bars.volume[-20:][i] for i in range(20)) / 20
    if avg_dv < min_dollar_vol:
        return None

    reasons: List[str] = []
    hits: List[str] = []
    score = 0
    fresh = -1

    ok, msg, contrib, age = _rule_donchian_break(bars, lookback)
    if ok:
        reasons.append(msg)
        hits.append("donchian")
        score += contrib
        fresh = age

    ok, msg, contrib = _rule_volume_surge(bars, lookback, vol_mult)
    if ok:
        reasons.append(msg)
        hits.append("volume")
        score += contrib

    ok, msg, contrib = _rule_ema_stack(bars)
    if ok:
        reasons.append(msg)
        hits.append("ema_stack")
        score += contrib

    ok, msg, contrib = _rule_atr_expansion(bars)
    if ok:
        reasons.append(msg)
        hits.append("atr_expansion")
        score += contrib

    ok, msg, contrib = _rule_vwap_reclaim(bars)
    if ok:
        reasons.append(msg)
        hits.append("vwap")
        score += contrib

    ok, msg, contrib = _rule_rsi_sweetspot(bars)
    if ok:
        reasons.append(msg)
        score += contrib

    if not hits:
        return None

    score = max(0, min(100, score))
    price = bars.close[-1]
    prev = bars.close[-2] if len(bars) >= 2 else price
    change_pct = (price - prev) / prev * 100 if prev else 0.0

    return Signal(
        symbol=bars.symbol,
        asset=bars.asset,
        interval=bars.interval,
        price=price,
        change_pct=change_pct,
        score=score,
        setup=_classify(hits),
        reasons=reasons,
        rule_hits=hits,
        plan=_build_plan(bars),
        dollar_volume=avg_dv,
        fresh_bars_ago=max(fresh, 0),
    )


def apply_cohort_echo(signals: List[Signal]) -> None:
    """Boost score when multiple symbols of the same asset class are firing
    a Donchian break at the same time — a basket-wide impulse is a stronger
    signal than a lone one. Mutates in place."""
    by_asset: dict[str, int] = {}
    for s in signals:
        if "donchian" in s.rule_hits and s.fresh_bars_ago == 0:
            by_asset[s.asset] = by_asset.get(s.asset, 0) + 1
    for s in signals:
        n = by_asset.get(s.asset, 0)
        if "donchian" in s.rule_hits and s.fresh_bars_ago == 0 and n >= 3:
            bonus = min(10, 2 + n)
            s.cohort_bonus = bonus
            s.score = min(100, s.score + bonus)
            s.reasons.append(f"Cohort echo: {n} {s.asset}s breaking together (+{bonus})")
