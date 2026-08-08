from __future__ import annotations

import json
import unittest
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
FORBIDDEN_SOURCE_TEXT = (
    "taxfoundation",
    "minneapolisfed.org",
    "federal reserve bank of minneapolis",
)


def walk_values(value):
    if isinstance(value, dict):
        for item in value.values():
            yield from walk_values(item)
    elif isinstance(value, list):
        for item in value:
            yield from walk_values(item)
    else:
        yield value


class SourcePolicyTests(unittest.TestCase):
    def test_data_urls_are_federal_dot_gov(self) -> None:
        bad_urls: list[str] = []
        for path in DATA_DIR.glob("*.json"):
            payload = json.loads(path.read_text(encoding="utf-8-sig"))
            for value in walk_values(payload):
                if not isinstance(value, str) or not value.startswith(("http://", "https://")):
                    continue
                host = (urlparse(value).hostname or "").lower()
                if not host.endswith(".gov"):
                    bad_urls.append(f"{path.relative_to(ROOT)}: {value}")
        self.assertEqual([], bad_urls)

    def test_removed_non_gov_source_names_stay_out_of_data(self) -> None:
        findings: list[str] = []
        for path in DATA_DIR.glob("*.json"):
            lowered = path.read_text(encoding="utf-8-sig").lower()
            for needle in FORBIDDEN_SOURCE_TEXT:
                if needle in lowered:
                    findings.append(f"{path.relative_to(ROOT)} contains {needle}")
        self.assertEqual([], findings)


if __name__ == "__main__":
    unittest.main()
