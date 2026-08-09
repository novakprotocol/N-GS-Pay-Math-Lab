from __future__ import annotations

import json
import unittest
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / "data" / "federal-state-pressure.json").read_text(encoding="utf-8"))


def iter_urls(value):
    if isinstance(value, dict):
        for key, item in value.items():
            if key.endswith("url") and isinstance(item, str):
                yield item
            yield from iter_urls(item)
    elif isinstance(value, list):
        for item in value:
            yield from iter_urls(item)


class FederalStatePressureTests(unittest.TestCase):
    def test_uses_only_federal_gov_urls(self) -> None:
        urls = sorted(set(iter_urls(DATA)))
        self.assertGreaterEqual(len(urls), 5)
        for url in urls:
            host = urlparse(url).netloc.lower()
            self.assertTrue(host.endswith(".gov"), url)

    def test_snapshot_counts_are_preserved(self) -> None:
        snapshot = DATA["snapshot"]
        self.assertEqual(snapshot["row_count"], 1_953_300)
        self.assertEqual(snapshot["state_count"], 51)
        self.assertEqual(snapshot["va_gdx_fy24_state_rows_joined"], 51)
        self.assertEqual(snapshot["va_facility_columns_fy25"], 140)
        self.assertEqual(snapshot["resident_population_states_joined"], 51)
        self.assertEqual(snapshot["veteran_population_states_joined"], 50)
        self.assertEqual(snapshot["va_facility_state_rows_joined"], 51)
        self.assertEqual(snapshot["state_assigned_pay_redacted_rows"], 6_419)
        self.assertEqual(snapshot["opm_all_pay_redacted_rows"], 890_827)

    def test_dc_density_and_high_grade_flags_remain_visible(self) -> None:
        dc = next(row for row in DATA["states"] if row["state_abbr"] == "DC")
        self.assertEqual(dc["employee_count"], 96_552)
        self.assertGreater(dc["total_visible_adjusted_basic_pay"], 14_000_000_000)
        self.assertEqual(dc["employees_per_land_sq_mi_rank"], 1)
        self.assertEqual(dc["high_grade_ses_share_rank"], 1)
        codes = {flag["code"] for flag in dc["audit_flags"]}
        self.assertIn("dense_high_grade_overlap", codes)
        self.assertIn("va_medical_density", codes)

    def test_va_gdx_fy24_state_expenditure_context(self) -> None:
        ca = next(row for row in DATA["states"] if row["state_abbr"] == "CA")
        tx = next(row for row in DATA["states"] if row["state_abbr"] == "TX")
        fl = next(row for row in DATA["states"] if row["state_abbr"] == "FL")
        self.assertGreater(ca["va_gdx_fy24"]["medical_care"], 10_000_000_000)
        self.assertGreater(tx["va_gdx_fy24"]["total_va_expenditure"], 30_000_000_000)
        self.assertEqual(fl["va_medical_care_rank"], 3)
        self.assertIn("top_va_medical_care", {flag["code"] for flag in fl["audit_flags"]})


    def test_population_veteran_and_facility_denominators_are_loaded(self) -> None:
        ca = next(row for row in DATA["states"] if row["state_abbr"] == "CA")
        tx = next(row for row in DATA["states"] if row["state_abbr"] == "TX")
        fl = next(row for row in DATA["states"] if row["state_abbr"] == "FL")
        self.assertGreater(ca["resident_population_2025"], 39_000_000)
        self.assertGreater(tx["veteran_population_fy2026"], 1_500_000)
        self.assertGreater(fl["va_facilities_fy2024"]["total_facilities"], 100)
        self.assertGreater(fl["va_gdx_fy24"]["medical_care_per_veteran"], 7_000)
        self.assertGreater(tx["va_facilities_fy2024"]["veterans_per_facility"], 10_000)

    def test_denominator_pressure_flags_are_review_screens(self) -> None:
        dc = next(row for row in DATA["states"] if row["state_abbr"] == "DC")
        wy = next(row for row in DATA["states"] if row["state_abbr"] == "WY")
        codes = {flag["code"] for flag in dc["audit_flags"]}
        self.assertIn("payroll_outpaces_population", codes)
        self.assertIn("multi_denominator_pressure", codes)
        self.assertEqual(dc["outlier_pressure_score_rank"], 1)
        self.assertIn("facility_concentration", {flag["code"] for flag in wy["audit_flags"]})

    def test_facility_patient_data_is_non_additive_and_complete(self) -> None:
        facility_data = DATA["va_facility_patient_data"]
        facilities = facility_data["facilities"]
        self.assertEqual(facility_data["facility_column_count"], 140)
        self.assertEqual(len(facilities), 140)
        self.assertIn("does not publish a single total", " ".join(facility_data["limitations"]))
        top = facilities[0]
        self.assertEqual(top["facility_label"], "(V08) (573) Gainesville, FL HCS")
        self.assertGreater(top["largest_single_procedure_unique_patients"], 100_000)
        self.assertGreater(top["office_outpatient_visit_99214_unique_patients"], 100_000)

    def test_data_does_not_claim_crime_or_wrongdoing(self) -> None:
        text = json.dumps(DATA).lower()
        self.assertNotIn("criminal", text)
        self.assertNotIn("impropriety", text)
        self.assertIn("not allegations", text)


if __name__ == "__main__":
    unittest.main()