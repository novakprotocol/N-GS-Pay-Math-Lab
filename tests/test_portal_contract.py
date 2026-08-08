from __future__ import annotations

import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class PortalContractTests(unittest.TestCase):
    def test_public_contract_semantics(self) -> None:
        contract = json.loads((ROOT / ".itops" / "portal.json").read_text(encoding="utf-8"))["portal"]
        self.assertTrue(contract["enabled"])
        self.assertEqual(contract["module_id"], "gs-pay-math-lab")
        self.assertEqual(contract["area"], "technical-tools")
        self.assertEqual(contract["visibility"], "public")
        self.assertEqual(contract["stable_anchor"], "module-gs-pay-math-lab")

    def test_private_fixture_would_be_included(self) -> None:
        fixture = json.loads((ROOT / "integration" / "portal-private-target-fixture.json").read_text(encoding="utf-8"))
        self.assertEqual(fixture["repository"]["visibility"], "private")
        self.assertEqual(fixture["expected_private_only_result"], "included")

    def test_public_record_remains_excluded_by_private_only_rule(self) -> None:
        contract = json.loads((ROOT / ".itops" / "portal.json").read_text(encoding="utf-8"))["portal"]
        self.assertEqual(contract["private_only_policy"]["production_ingestion"], "exclude-when-repository-is-not-private")


if __name__ == "__main__":
    unittest.main()
