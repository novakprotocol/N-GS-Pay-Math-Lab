from __future__ import annotations

import unittest

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from pay_math import DATA


class LocalityRateTests(unittest.TestCase):
    def test_2026_locality_rates_include_rest_of_us(self) -> None:
        areas = DATA.locality_rates["by_year"]["2026"]
        self.assertGreaterEqual(len(areas), 58)
        rus = next(area for area in areas if area["code"] == "RUS")
        self.assertEqual(rus["name"], "Rest of U.S.")
        self.assertEqual(rus["percentage"], 17.06)

    def test_2026_locality_rates_have_names_percentages_and_sources(self) -> None:
        for area in DATA.locality_rates["by_year"]["2026"]:
            self.assertTrue(area["code"])
            self.assertTrue(area["name"])
            self.assertGreater(area["percentage"], 0)
            self.assertTrue(area["source_url"].startswith("https://www.opm.gov/"))


if __name__ == "__main__":
    unittest.main()
