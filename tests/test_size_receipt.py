from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))


class SizeReceiptTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        path = ROOT / "evidence" / "size-comparison.json"
        if not path.exists():
            raise unittest.SkipTest("size receipt has not been generated")
        cls.receipt = json.loads(path.read_text(encoding="utf-8"))

    def test_core_and_complete_totals_present(self) -> None:
        self.assertGreater(self.receipt["calculation_package_without_brand_imagery"], 0)
        self.assertGreater(self.receipt["complete_deployed_package_with_brand_imagery"], 0)

    def test_static_alternative_counts(self) -> None:
        by_id = {item["id"]: item for item in self.receipt["measurements"]}
        self.assertEqual(by_id["annual_csv_tables"]["file_count"], 50)
        self.assertEqual(by_id["annual_json_tables"]["file_count"], 50)
        self.assertEqual(by_id["annual_html_tables"]["file_count"], 50)
        self.assertEqual(by_id["combined_static_json"]["represented_pay_cells"], 7500)
        self.assertEqual(by_id["combined_static_html"]["represented_pay_cells"], 7500)

    def test_ratios_are_computed(self) -> None:
        item = {row["id"]: row for row in self.receipt["measurements"]}["annual_csv_tables"]
        expected = item["raw_bytes"] / self.receipt["formula_artifact_bytes"]
        self.assertAlmostEqual(item["static_to_formula_multiple"], expected)

    def test_pdf_status_is_not_fabricated(self) -> None:
        pdf = {row["id"]: row for row in self.receipt["measurements"]}["printable_pdfs"]
        if pdf["raw_bytes"] is None:
            self.assertIn("unavailable", pdf["notes"])
        else:
            self.assertEqual(pdf["file_count"], 50)


if __name__ == "__main__":
    unittest.main()
