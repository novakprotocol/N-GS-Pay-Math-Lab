from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

from pay_math import DATA, build_schedule, calculation_record, compute_pay, derive_from_anchor, validation_receipt, years
from receipt_utils import ROOT, write_json


DEPLOYED_TEXT_EXTENSIONS = {".html", ".css", ".js", ".json", ".txt"}
SECRET_PATTERNS = [
    re.compile(r"ghp_[A-Za-z0-9_]{20,}"),
    re.compile(r"github_pat_[A-Za-z0-9_]{20,}"),
    re.compile(r"-----BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY-----"),
]
FORBIDDEN_DATA_SOURCE_TEXT = (
    "taxfoundation",
    "minneapolisfed.org",
    "federal reserve bank of minneapolis",
)


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def walk_json_values(value):
    if isinstance(value, dict):
        for item in value.values():
            yield from walk_json_values(item)
    elif isinstance(value, list):
        for item in value:
            yield from walk_json_values(item)
    else:
        yield value


def data_source_policy_findings() -> list[str]:
    findings: list[str] = []
    for path in (ROOT / "data").glob("*.json"):
        text = path.read_text(encoding="utf-8-sig")
        lowered = text.lower()
        for needle in FORBIDDEN_DATA_SOURCE_TEXT:
            if needle in lowered:
                findings.append(f"removed non-gov source text in {path.relative_to(ROOT)}: {needle}")
        payload = json.loads(text)
        for value in walk_json_values(payload):
            if not isinstance(value, str) or not value.startswith(("http://", "https://")):
                continue
            host = (urlparse(value).hostname or "").lower()
            if not host.endswith(".gov"):
                findings.append(f"non-.gov data source URL in {path.relative_to(ROOT)}: {value}")
    return findings


def scan_site_text() -> list[str]:
    findings: list[str] = []
    site = ROOT / "site"
    if not site.exists():
        return ["site directory is missing"]
    for path in site.rglob("*"):
        if path.is_file() and path.suffix.lower() in DEPLOYED_TEXT_EXTENSIONS:
            text = path.read_text(encoding="utf-8", errors="ignore")
            for pattern in SECRET_PATTERNS:
                if pattern.search(text):
                    findings.append(f"secret-like token in {path.relative_to(ROOT)}")
            lowered = text.lower()
            if "va.ghe.com" in lowered:
                findings.append(f"private host leak in {path.relative_to(ROOT)}")
            if path.suffix.lower() in {".html", ".css", ".js"}:
                if re.search(r"(?:src|href)=['\"]https?://", text, re.IGNORECASE) or "cdn." in lowered:
                    findings.append(f"external runtime reference in {path.relative_to(ROOT)}")
    return findings


def local_links_resolve() -> list[str]:
    site = ROOT / "site"
    findings: list[str] = []
    href_pattern = re.compile(r"""(?:href|src)=["']([^"']+)["']""")
    for html in [site / "index.html", site / "module" / "index.html"]:
        text = html.read_text(encoding="utf-8")
        base = html.parent
        for target in href_pattern.findall(text):
            if target.startswith(("#", "http:", "https:", "mailto:", "data:")):
                continue
            clean = target.split("#", 1)[0].split("?", 1)[0]
            if not clean:
                continue
            if not (base / clean).resolve().exists():
                findings.append(f"{html.relative_to(ROOT)} points to missing {target}")
    return findings


def main() -> None:
    receipt = validation_receipt(DATA)
    write_json(ROOT / "evidence" / "calculation-validation.json", receipt)

    assert_true(receipt["annual_schedule_count"] == 50, "expected 50 schedule years")
    assert_true(receipt["total_cells"] == 7500, "expected 7,500 cells")
    assert_true(all(count == 150 for count in receipt["cell_counts"].values()), "each annual schedule must have 150 cells")
    assert_true(receipt["all_values_numeric_nonnegative"], "pay values must be numeric and nonnegative")
    assert_true(receipt["steps_nondecreasing"], "steps must be nondecreasing")
    assert_true(receipt["official_2026_matches"] == 150, "2026 fixture must match all cells")
    assert_true(receipt["wrong_shortcut_mismatches"] > 0, "shortcut audit must demonstrate failures")
    assert_true(compute_pay(2026, 12, 10)["base"] == 99404, "2026 GS-12 Step 10 base proof failed")
    assert_true(compute_pay(2026, 12, 10, 17.06, 197200, True)["annual"] == 116362, "2026 RUS annual proof failed")
    assert_true(compute_pay(2026, 12, 10, 17.06, 197200, True)["hourly"] == 55.76, "2026 RUS hourly proof failed")
    assert_true(derive_from_anchor(1977, 1, 1)["status"] == "Reverse calculation", "low-grade special status missing")

    for year in years():
        schedule = build_schedule(year)
        for row in schedule:
            assert_true(len(row) == 10, f"schedule row width failed for {year}")

    status_labels = set(DATA.checkpoints["status_labels"])
    for label in ("Official table", "Official checkpoint", "Formula reconstruction", "Reverse calculation", "User-entered scenario"):
        assert_true(label in status_labels, f"missing status label {label}")
    assert_true(calculation_record(2026, 12, 10)["classification"] != "Formula reconstruction", "official fixture mislabeled")

    data_source_findings = data_source_policy_findings()
    site_findings = scan_site_text()
    link_findings = local_links_resolve()
    if data_source_findings or site_findings or link_findings:
        raise AssertionError(json.dumps({"data_source_findings": data_source_findings, "site_findings": site_findings, "link_findings": link_findings}, indent=2))

    print("validation passed: 50 years, 7,500 cells, 150/150 official 2026 cells")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"validation failed: {exc}", file=sys.stderr)
        raise
