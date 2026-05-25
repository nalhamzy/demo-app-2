import math
import unittest

from scanner import indicators as ind


class TestIndicators(unittest.TestCase):
    def test_sma_basic(self):
        out = ind.sma([1, 2, 3, 4, 5], 3)
        self.assertEqual(out, [None, None, 2.0, 3.0, 4.0])

    def test_ema_seed_and_progression(self):
        out = ind.ema([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3)
        self.assertIsNone(out[1])
        self.assertAlmostEqual(out[2], 2.0)
        for i in range(3, len(out)):
            self.assertGreater(out[i], out[i - 1])

    def test_rsi_all_up_is_100(self):
        out = ind.rsi(list(range(1, 30)), 14)
        self.assertAlmostEqual(out[-1], 100.0)

    def test_rsi_all_down_is_0(self):
        out = ind.rsi(list(range(30, 1, -1)), 14)
        self.assertAlmostEqual(out[-1], 0.0)

    def test_atr_positive_and_finite(self):
        highs = [10 + i * 0.5 for i in range(50)]
        lows = [9 + i * 0.5 for i in range(50)]
        closes = [9.5 + i * 0.5 for i in range(50)]
        a = ind.atr(highs, lows, closes, 14)
        self.assertIsNotNone(a[-1])
        self.assertGreater(a[-1], 0)
        self.assertTrue(math.isfinite(a[-1]))

    def test_donchian_window(self):
        h = [1, 2, 3, 4, 5, 4, 3]
        l = [0, 1, 2, 3, 4, 3, 2]
        upper, lower = ind.donchian(h, l, 3)
        self.assertEqual(upper[2], 3)
        self.assertEqual(upper[4], 5)
        self.assertEqual(lower[2], 0)
        self.assertEqual(lower[5], 3)

    def test_vwap_monotone_in_uptrend(self):
        h = [1, 2, 3, 4, 5]
        l = [1, 2, 3, 4, 5]
        c = [1, 2, 3, 4, 5]
        v = [10] * 5
        out = ind.vwap(h, l, c, v)
        for i in range(1, 5):
            self.assertGreaterEqual(out[i], out[i - 1])


if __name__ == "__main__":
    unittest.main()
