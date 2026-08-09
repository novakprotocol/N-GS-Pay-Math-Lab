from __future__ import annotations

import json
import unittest
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / "data" / "locality-definitions.json"


class LocalityDefinitionsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.payload = json.loads(DATA_FILE.read_text(encoding="utf-8-sig"))
        cls.counties = {county["fips"]: county for county in cls.payload["counties"]}
        cls.areas = {area["code"]: area for area in cls.payload["areas"]}

    def test_county_mapper_has_expected_official_scope(self) -> None:
        self.assertEqual(2026, self.payload["year"])
        self.assertGreaterEqual(len(self.payload["areas"]), 58)
        self.assertEqual(3222, len(self.payload["counties"]), "Census county/county-equivalent point count changed")
        self.assertEqual(947, sum(1 for county in self.payload["counties"] if county["locality_code"] != "RUS"))

    def test_known_counties_map_to_opm_locality_codes(self) -> None:
        samples = {
            "48201": ("Harris County", "TX", "HOU", 35.0),
            "06037": ("Los Angeles County", "CA", "LA", 36.47),
            "01001": ("Autauga County", "AL", "RUS", 17.06),
            "02020": ("Anchorage Municipality", "AK", "AK", 32.36),
        }
        for fips, (name, state, code, percent) in samples.items():
            with self.subTest(fips=fips):
                county = self.counties[fips]
                self.assertEqual(name, county["name"])
                self.assertEqual(state, county["state_abbr"])
                self.assertEqual(code, county["locality_code"])
                self.assertAlmostEqual(percent, float(county["locality_percent"]), places=2)
                self.assertIn(code, self.areas)

    def test_locality_definition_sources_are_federal_dot_gov(self) -> None:
        for key in ("opm_source_url", "census_gazetteer_source_url"):
            url = self.payload[key]
            host = (urlparse(url).hostname or "").lower()
            self.assertTrue(host.endswith(".gov"), f"{key} is not federal .gov: {url}")


if __name__ == "__main__":
    unittest.main()
