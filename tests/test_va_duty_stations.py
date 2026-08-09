from __future__ import annotations

import json
import unittest
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
PAYLOAD = json.loads((ROOT / "data" / "va-duty-stations.json").read_text(encoding="utf-8-sig"))


def by_id(location_id: str) -> dict:
    for location in PAYLOAD["locations"]:
        if location["id"] == location_id:
            return location
    raise AssertionError(f"missing location {location_id}")


def walk_values(value):
    if isinstance(value, dict):
        for item in value.values():
            yield from walk_values(item)
    elif isinstance(value, list):
        for item in value:
            yield from walk_values(item)
    else:
        yield value


class VaDutyStationTests(unittest.TestCase):
    def test_sources_are_federal_dot_gov(self) -> None:
        bad_urls: list[str] = []
        for value in walk_values(PAYLOAD):
            if not isinstance(value, str) or not value.startswith(("http://", "https://")):
                continue
            host = (urlparse(value).hostname or "").lower()
            if not host.endswith(".gov"):
                bad_urls.append(value)
        self.assertEqual([], bad_urls)

    def test_required_remote_posts_are_present(self) -> None:
        self.assertEqual("foreign_base", by_id("ph-manila-va-clinic")["pay_model"])
        self.assertEqual("rus_territory", by_id("vi-saint-croix")["pay_model"])
        self.assertEqual(6, by_id("vi-saint-croix")["opm_visible_employee_count"])
        self.assertIsNone(by_id("ph-manila-va-clinic")["opm_visible_employee_count"])

    def test_opm_aggregate_counts_are_preserved(self) -> None:
        snapshot = PAYLOAD["snapshot"]
        self.assertEqual(1953300, snapshot["row_count"])
        self.assertEqual(445351, snapshot["va_employee_rows"])
        self.assertEqual(5834, snapshot["redacted_va_rows"])
        self.assertEqual(4552, by_id("pr-visible")["opm_visible_employee_count"])
        self.assertEqual(99, by_id("gu-visible")["opm_visible_employee_count"])

    def test_pay_models_have_opm_rules(self) -> None:
        rules = PAYLOAD["pay_rules"]
        self.assertEqual(0, rules["foreign_base"]["locality_percent_2026"])
        self.assertEqual(17.06, rules["rus_territory"]["locality_percent_2026"])
        self.assertEqual(32.36, rules["alaska"]["locality_percent_2026"])
        self.assertEqual(22.21, rules["hawaii"]["locality_percent_2026"])


if __name__ == "__main__":
    unittest.main()
