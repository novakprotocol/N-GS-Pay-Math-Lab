from __future__ import annotations

import json
import unittest
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]


class VaContractSnapshotTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.payload = json.loads((ROOT / "data" / "va-contracts.json").read_text(encoding="utf-8"))

    def test_snapshot_is_official_gov_and_local_static(self) -> None:
        snapshot = self.payload["snapshot"]
        for key in ("source_url", "api_url"):
            host = urlparse(snapshot[key]).hostname or ""
            self.assertTrue(host.endswith(".gov"), snapshot[key])
        self.assertIn("USAspending.gov", self.payload["source_policy"])
        self.assertIn("locally bundled", self.payload["source_policy"])
        self.assertEqual(2024, snapshot["fiscal_year"])
        self.assertEqual("2023-10-01", snapshot["time_period_start"])
        self.assertEqual("2024-09-30", snapshot["time_period_end"])

    def test_county_rows_and_requested_comparison_are_present(self) -> None:
        counties = self.payload["counties"]
        self.assertGreater(len(counties), 1000)
        self.assertGreater(self.payload["snapshot"]["positive_obligated_amount"], 0)
        comparisons = self.payload["comparisons"]
        self.assertEqual("54081", comparisons["beckley_wv_raleigh_county"]["fips"])
        self.assertEqual("55025", comparisons["madison_wi_dane_county"]["fips"])
        self.assertGreaterEqual(comparisons["beckley_wv_raleigh_county"]["obligated_amount"], 0)
        self.assertGreaterEqual(comparisons["madison_wi_dane_county"]["obligated_amount"], 0)


if __name__ == "__main__":
    unittest.main()
