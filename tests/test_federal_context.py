from __future__ import annotations

import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONTEXT_PATH = ROOT / "data" / "federal-context.json"


class FederalContextTests(unittest.TestCase):
    def setUp(self) -> None:
        self.payload = json.loads(CONTEXT_PATH.read_text(encoding="utf-8-sig"))

    def test_context_covers_all_pay_years(self) -> None:
        years = range(1977, 2027)
        administrations = self.payload["administrations"]
        missing = []
        for year in years:
            if not any(item["start_year"] <= year <= item["end_year"] for item in administrations):
                missing.append(year)
        self.assertEqual([], missing)

    def test_market_proxy_has_expected_federal_coverage(self) -> None:
        values = self.payload["market_proxy_by_year"]
        periods = self.payload["market_proxy_period_by_year"]
        self.assertEqual("LM153064105.Q", self.payload["market_proxy_series"])
        self.assertEqual(2025, self.payload["market_proxy_latest_complete_year"])
        self.assertGreater(values["1977"], 0)
        self.assertGreater(values["2026"], 0)
        self.assertEqual("2026:Q1", periods["2026"])

    def test_policy_explains_dow_exclusion(self) -> None:
        policy = self.payload["source_policy"].lower()
        warning = self.payload["notes"]["stock_market_warning"].lower()
        self.assertIn("dow jones", policy)
        self.assertIn("federal reserve z.1", warning)

    def test_conflict_context_is_federal_va_sourced(self) -> None:
        labels = {item["label"] for item in self.payload["conflict_eras"]}
        self.assertIn("Global War on Terror", labels)
        self.assertIn("War in Iraq", labels)


if __name__ == "__main__":
    unittest.main()