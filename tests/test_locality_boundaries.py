from __future__ import annotations

import json
import unittest
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
BOUNDARY_FILE = ROOT / "data" / "locality-boundaries.json"


class LocalityBoundaryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.payload = json.loads(BOUNDARY_FILE.read_text(encoding="utf-8-sig"))
        cls.counties = {county["fips"]: county for county in cls.payload["counties"]}

    def test_boundary_payload_has_all_joined_counties(self) -> None:
        self.assertEqual(2025, self.payload["boundary_year"])
        self.assertEqual(2026, self.payload["locality_year"])
        self.assertEqual(3222, self.payload["county_count"])
        self.assertEqual(3222, len(self.payload["counties"]))

    def test_known_counties_have_polygon_geometry(self) -> None:
        for fips, locality_code in {
            "48201": "HOU",
            "06037": "LA",
            "01001": "RUS",
            "02020": "AK",
            "15003": "HI",
            "72127": "RUS",
        }.items():
            with self.subTest(fips=fips):
                county = self.counties[fips]
                self.assertEqual(locality_code, county["locality_code"])
                self.assertGreaterEqual(len(county["rings"]), 1)
                self.assertGreaterEqual(sum(len(ring) for ring in county["rings"]), 3)
                self.assertEqual(4, len(county["bbox"]))

    def test_boundary_sources_are_federal_dot_gov(self) -> None:
        for key in ("census_boundary_source_url", "opm_locality_source_url"):
            url = self.payload[key]
            host = (urlparse(url).hostname or "").lower()
            self.assertTrue(host.endswith(".gov"), f"{key} is not federal .gov: {url}")


if __name__ == "__main__":
    unittest.main()
