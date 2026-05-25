"""Terminal output. ANSI colors when stdout is a TTY and NO_COLOR is unset."""
from __future__ import annotations

import os
import sys
from typing import Iterable, List

from scanner.signals import Signal


def _use_color() -> bool:
    if os.environ.get("NO_COLOR"):
        return False
    return sys.stdout.isatty()


_RESET = "\033[0m"
_BOLD = "\033[1m"
_DIM = "\033[2m"
_RED = "\033[31m"
_GREEN = "\033[32m"
_YELLOW = "\033[33m"
_CYAN = "\033[36m"
_MAGENTA = "\033[35m"


def _c(s: str, code: str) -> str:
    return f"{code}{s}{_RESET}" if _use_color() else s


def _score_color(score: int) -> str:
    if score >= 80:
        return _GREEN + _BOLD
    if score >= 65:
        return _GREEN
    if score >= 50:
        return _YELLOW
    return _DIM


def _fmt_price(p: float) -> str:
    if p >= 1000:
        return f"{p:,.2f}"
    if p >= 1:
        return f"{p:,.3f}"
    return f"{p:,.6f}"


def _fmt_vol(v: float) -> str:
    for suf, div in (("B", 1e9), ("M", 1e6), ("K", 1e3)):
        if v >= div:
            return f"${v/div:.1f}{suf}"
    return f"${v:.0f}"


def render_table(signals: Iterable[Signal]) -> str:
    rows = list(signals)
    if not rows:
        return _c("No setups passing filters.", _DIM)

    header = [
        _c(f"{'SYMBOL':<10}", _BOLD),
        _c(f"{'CLASS':<6}", _BOLD),
        _c(f"{'PRICE':>12}", _BOLD),
        _c(f"{'CHG%':>7}", _BOLD),
        _c(f"{'SCORE':>5}", _BOLD),
        _c(f"{'SETUP':<26}", _BOLD),
        _c(f"{'ENTRY':>10}", _BOLD),
        _c(f"{'STOP':>10}", _BOLD),
        _c(f"{'T1':>10}", _BOLD),
        _c(f"{'T2':>10}", _BOLD),
        _c(f"{'RR':>5}", _BOLD),
        _c(f"{'$VOL':>8}", _BOLD),
        _c(f"{'FRESH':>5}", _BOLD),
    ]
    lines: List[str] = [" ".join(header)]

    for s in rows:
        plan = s.plan
        chg = s.change_pct
        chg_col = _GREEN if chg >= 0 else _RED
        cells = [
            f"{s.symbol:<10}",
            f"{s.asset[:6]:<6}",
            f"{_fmt_price(s.price):>12}",
            _c(f"{chg:+6.2f}%", chg_col),
            _c(f"{s.score:>5}", _score_color(s.score)),
            _c(f"{s.setup:<26}", _CYAN),
            f"{_fmt_price(plan.entry):>10}" if plan else f"{'-':>10}",
            f"{_fmt_price(plan.stop):>10}" if plan else f"{'-':>10}",
            f"{_fmt_price(plan.t1):>10}" if plan else f"{'-':>10}",
            f"{_fmt_price(plan.t2):>10}" if plan else f"{'-':>10}",
            f"{plan.rr1:>4}:1" if plan else f"{'-':>5}",
            f"{_fmt_vol(s.dollar_volume):>8}",
            _c(f"{s.fresh_bars_ago:>5}", _GREEN if s.fresh_bars_ago == 0 else _DIM),
        ]
        lines.append(" ".join(cells))

    lines.append("")
    lines.append(_c("Reasons (top 5):", _BOLD))
    for s in rows[:5]:
        bullet = "  " + _c(f"{s.symbol}", _MAGENTA) + _c(f"  [{s.setup}]  ", _CYAN)
        lines.append(bullet + "; ".join(s.reasons))
    return "\n".join(lines)
