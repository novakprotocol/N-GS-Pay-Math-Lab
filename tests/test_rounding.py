from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from pay_math import hourly_divisor, round_half_up


class RoundingTests(unittest.TestCase):
    def test_half_up_whole_dollar(self) -> None:
        self.assertEqual(round_half_up(1.5), 2)
        self.assertEqual(round_half_up(1.49), 1)
        self.assertEqual(round_half_up(2.5), 3)

    def test_cent_rounding(self) -> None:
        self.assertEqual(round_half_up(1.005, 2), 1.01)
        self.assertEqual(round_half_up(55.744, 2), 55.74)
        self.assertEqual(round_half_up(55.745, 2), 55.75)

    def test_historical_divisor_boundary(self) -> None:
        self.assertEqual(hourly_divisor(1983), 2080)
        self.assertEqual(hourly_divisor(1984), 2087)


if __name__ == "__main__":
    unittest.main()
