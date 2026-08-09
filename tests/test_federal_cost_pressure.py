from __future__ import annotations

import json
import unittest
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / "data" / "federal-cost-pressure.json").read_text(encoding="utf-8"))


class FederalCostPressureTests(unittest.TestCase):
    def test_uses_gov_sources(self) -> None:
        for key in ("source_url", "api_download_url"):
            url = DATA["snapshot"][key]
            host = urlparse(url).netloc.lower()
            self.assertTrue(host.endswith(".gov"), url)

    def test_visible_opm_audit_counts_are_preserved(self) -> None:
        snapshot = DATA["snapshot"]
        self.assertEqual(snapshot["row_count"], 1_953_300)
        self.assertEqual(snapshot["visible_named_locality_rows"], 1_068_599)
        self.assertEqual(snapshot["redacted_locality_rows"], 883_756)
        self.assertEqual(snapshot["pay_redacted_rows"], 890_827)

    def test_flags_dc_high_grade_concentration(self) -> None:
        areas = DATA["areas"]
        dc = next(area for area in areas if area["salary_table_code"] == "DCB")
        rus = next(area for area in areas if area["salary_table_code"] == "RUS")
        self.assertGreater(rus["total_visible_adjusted_basic_pay"], dc["total_visible_adjusted_basic_pay"])
        self.assertGreater(dc["high_grade_ses_share"], 0.53)
        self.assertEqual(dc["ses_count"], 3_674)
        self.assertGreater(dc["high_grade_ses_visible_payroll"], 17_000_000_000)

    def test_area_rows_have_salary_table_mapping(self) -> None:
        missing = [area["opm_fwd_locality_code"] for area in DATA["areas"] if not area["salary_table_code"] and area["opm_fwd_locality_code"] != "ZZ"]
        self.assertEqual(missing, [])


if __name__ == "__main__":
    unittest.main()
