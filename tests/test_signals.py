import unittest

from scanner import signals as sig
from scanner.sources.fixture import make_bars


class TestSignals(unittest.TestCase):
    def test_breakout_bar_scores_high(self):
        bars = make_bars("FOO", "stock", "5m", n=200, breakout=True, seed=1)
        s = sig.evaluate(bars, lookback=20, vol_mult=1.8)
        self.assertIsNotNone(s)
        self.assertGreaterEqual(s.score, 50)
        self.assertIn("donchian", s.rule_hits)
        self.assertIsNotNone(s.plan)
        self.assertLess(s.plan.stop, s.plan.entry)
        self.assertGreater(s.plan.t1, s.plan.entry)
        self.assertGreater(s.plan.t2, s.plan.t1)

    def test_quiet_market_returns_none_or_low(self):
        bars = make_bars("BAR", "stock", "5m", n=200, breakout=False, seed=42)
        s = sig.evaluate(bars, lookback=20, vol_mult=2.5)
        if s is not None:
            self.assertLess(s.score, 65)

    def test_cohort_echo_boosts_concurrent_breakouts(self):
        sigs = []
        for i in range(12):
            b = make_bars(f"SYM{i}", "crypto", "5m", n=200, breakout=True, seed=100 + i)
            s = sig.evaluate(b, lookback=20, vol_mult=1.8)
            if s is not None:
                sigs.append(s)
        before = {s.symbol: s.score for s in sigs}
        sig.apply_cohort_echo(sigs)
        boosted = [s for s in sigs if s.cohort_bonus > 0]
        self.assertGreater(len(boosted), 0)
        for s in boosted:
            self.assertGreater(s.score, before[s.symbol])


if __name__ == "__main__":
    unittest.main()
