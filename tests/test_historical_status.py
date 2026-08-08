from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from pay_math import DATA, derive_from_anchor


class HistoricalStatusTests(unittest.TestCase):
    def test_required_status_labels_present(self) -> None:
        labels = set(DATA.checkpoints["status_labels"])
        self.assertIn("Official table", labels)
        self.assertIn("Official checkpoint", labels)
        self.assertIn("Formula reconstruction", labels)
        self.assertIn("Reverse calculation", labels)
        self.assertIn("User-entered scenario", labels)

    def test_low_grade_special_handling(self) -> None:
        detail = derive_from_anchor(1977, 1, 1)
        self.assertTrue(detail["lowGrade"])
        self.assertEqual(detail["status"], "Reverse calculation")

    def test_reconstruction_not_labeled_official(self) -> None:
        detail = derive_from_anchor(1980, 12, 10)
        self.assertEqual(detail["status"], "Formula reconstruction")
        self.assertNotEqual(detail["statusClass"], "exact")


if __name__ == "__main__":
    unittest.main()
