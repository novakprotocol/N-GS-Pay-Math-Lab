from __future__ import annotations

import json
import unittest
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / "data" / "federal-agency-pressure.json").read_text(encoding="utf-8"))


class FederalAgencyPressureTests(unittest.TestCase):
    def test_uses_gov_sources(self) -> None:
        for key in ("source_url", "api_download_url"):
            url = DATA["snapshot"][key]
            host = urlparse(url).netloc.lower()
            self.assertTrue(host.endswith(".gov"), url)

    def test_visible_opm_audit_counts_are_preserved(self) -> None:
        snapshot = DATA["snapshot"]
        self.assertEqual(snapshot["row_count"], 1_953_300)
        self.assertEqual(snapshot["pay_visible_rows"], 1_062_473)
        self.assertEqual(snapshot["pay_redacted_rows"], 890_827)
        self.assertEqual(snapshot["agency_count"], 126)
        self.assertEqual(snapshot["component_count"], 488)

    def test_va_is_largest_visible_agency_payroll(self) -> None:
        va = next(row for row in DATA["agencies"] if row["agency_code"] == "VA")
        self.assertEqual(va["employee_count"], 445_351)
        self.assertGreater(va["total_visible_adjusted_basic_pay"], 50_000_000_000)
        self.assertAlmostEqual(va["high_grade_ses_share"], 0.104001, places=6)
        self.assertEqual(va["ses_count"], 348)

    def test_fbi_is_a_doj_component_with_high_grade_concentration(self) -> None:
        fbi = next(row for row in DATA["components"] if row["agency_subelement_code"] == "DJ02")
        self.assertEqual(fbi["agency_code"], "DJ")
        self.assertEqual(fbi["agency_subelement_name"], "FEDERAL BUREAU OF INVESTIGATION")
        self.assertEqual(fbi["employee_count"], 35_334)
        self.assertGreater(fbi["high_grade_ses_share"], 0.52)
        self.assertEqual(fbi["ses_count"], 285)

    def test_dol_agency_row_is_available(self) -> None:
        dol = next(row for row in DATA["agencies"] if row["agency_code"] == "DL")
        self.assertEqual(dol["agency_name"], "DEPARTMENT OF LABOR")
        self.assertEqual(dol["employee_count"], 11_041)
        self.assertGreater(dol["high_grade_ses_share"], 0.48)
        self.assertEqual(dol["ses_count"], 142)


if __name__ == "__main__":
    unittest.main()