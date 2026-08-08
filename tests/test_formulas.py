from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from pay_math import build_schedule, calculation_record, compute_pay, schedule_cell_count, years


class FormulaTests(unittest.TestCase):
    def test_all_years_and_cells_build(self) -> None:
        self.assertEqual(len(years()), 50)
        self.assertEqual(schedule_cell_count(), 7500)
        for year in years():
            schedule = build_schedule(year)
            self.assertEqual(len(schedule), 15)
            self.assertTrue(all(len(row) == 10 for row in schedule))

    def test_required_2026_gs12_step10_proof(self) -> None:
        result = compute_pay(2026, 12, 10, 17.06, 197200, True)
        self.assertEqual(result["base"], 99404)
        self.assertEqual(result["annual"], 116362)
        self.assertEqual(result["hourly"], 55.76)
        self.assertEqual(result["biweekly"], 4460.8)

    def test_download_record_shape(self) -> None:
        record = calculation_record(2026, 12, 10, 17.06, 197200, True)
        self.assertEqual(record["formula_version"], "n-gs-pay-math-lab-v0.01")
        self.assertEqual(record["rounding_mode"], "half-up")
        self.assertIn("intermediate_values", record)
        self.assertEqual(record["validation_status"], "matches-2026-official-fixture")


if __name__ == "__main__":
    unittest.main()

