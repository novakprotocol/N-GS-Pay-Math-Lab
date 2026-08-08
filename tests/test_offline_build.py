from __future__ import annotations

import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class OfflineBuildTests(unittest.TestCase):
    def test_offline_file_embeds_required_assets(self) -> None:
        path = ROOT / "site" / "offline" / "N-GS-Pay-Math-Lab-1977-2026.html"
        self.assertTrue(path.exists())
        text = path.read_text(encoding="utf-8")
        self.assertIn("window.NGSPayData", text)
        self.assertIn("data:image/png;base64", text)
        self.assertNotRegex(text, re.compile(r"<script src=", re.I))
        self.assertNotRegex(text, re.compile(r"<link rel=\"stylesheet\"", re.I))

    def test_module_nested_path_exists(self) -> None:
        self.assertTrue((ROOT / "site" / "module" / "index.html").exists())


if __name__ == "__main__":
    unittest.main()
