from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from pay_math import DATA, build_schedule, official_2026_match_count, wrong_shortcut_mismatch_count


class OfficialTableTests(unittest.TestCase):
    def test_2026_full_table_matches_fixture(self) -> None:
        self.assertEqual(official_2026_match_count(), 150)
        self.assertEqual(build_schedule(2026), DATA.validation["official_2026"])

    def test_2025_2026_fixture_shapes(self) -> None:
        for fixture_name in ("official_2025", "official_2026"):
            fixture = DATA.validation[fixture_name]
            self.assertEqual(len(fixture), 15)
            self.assertTrue(all(len(row) == 10 for row in fixture))

    def test_wrong_shortcut_is_demonstrated(self) -> None:
        self.assertGreater(wrong_shortcut_mismatch_count(), 0)


if __name__ == "__main__":
    unittest.main()
