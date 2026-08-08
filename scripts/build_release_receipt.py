from __future__ import annotations

import asyncio
import json
import os
from pathlib import Path
from typing import Any

from pay_math import validation_receipt
from receipt_utils import ROOT, STABLE_TIMESTAMP, file_record, get_commit_sha, sha256_file, tree_size, write_json


def input_receipt() -> dict[str, Any]:
    downloads = Path.home() / "Downloads"
    desktop = Path.home() / "Desktop"
    requested_portal = downloads / "index(20260808-155724)(1).html"
    available_portal = downloads / "index(20260808-155724).html"
    payload = {
        "generated_at": STABLE_TIMESTAMP,
        "inputs": [
            file_record(downloads / "gs-pay-math-lab-1977-2026.html", "Existing working pay-lab implementation"),
            file_record(requested_portal, "Requested portal visual reference"),
            file_record(available_portal, "Available portal visual reference fallback"),
            file_record(desktop / "Transparent N.png", "Public N-brand source image"),
            file_record(desktop / "va-vision_t.png", "Future private VA-VISION image supplied by user"),
        ],
        "notes": [
            "The exact requested portal file index(20260808-155724)(1).html was not present when inspected.",
            "The available file index(20260808-155724).html was used only as a visual reference and was not copied into the public site.",
            "The VA-VISION image is recorded as future private input only and is not deployed in the public N site."
        ],
    }
    write_json(ROOT / "evidence" / "input-receipt.json", payload)
    return payload


def site_artifacts() -> list[dict[str, Any]]:
    site = ROOT / "site"
    artifacts = []
    for path in sorted(site.rglob("*")):
        if path.is_file():
            artifacts.append(
                {
                    "path": path.relative_to(ROOT).as_posix(),
                    "byte_count": path.stat().st_size,
                    "sha256": sha256_file(path),
                }
            )
    return artifacts


def find_chrome() -> Path | None:
    candidates = [
        Path("C:/Program Files/Google/Chrome/Application/chrome.exe"),
        Path("C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"),
        Path("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"),
    ]
    for path in candidates:
        if path.exists():
            return path
    return None


async def capture_screenshots() -> dict[str, Any]:
    if os.environ.get("NGS_ENABLE_BROWSER_EVIDENCE") != "1":
        return {"status": "unavailable", "reason": "browser screenshot evidence disabled; set NGS_ENABLE_BROWSER_EVIDENCE=1 to capture screenshots"}
    try:
        from playwright.async_api import async_playwright
    except Exception as exc:
        return {"status": "unavailable", "reason": f"playwright import failed: {exc}"}
    chrome = find_chrome()
    if not chrome:
        return {"status": "unavailable", "reason": "no verified browser executable found"}

    site_index = (ROOT / "site" / "index.html").resolve().as_uri()
    module_index = (ROOT / "site" / "module" / "index.html").resolve().as_uri()
    evidence = ROOT / "evidence"
    checks: dict[str, Any] = {"status": "generated", "browser": str(chrome), "viewports": []}
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(executable_path=str(chrome), headless=True)
        for name, url, width, height, out_name in [
            ("desktop", site_index, 1440, 1000, "desktop-preview.png"),
            ("mobile", site_index, 390, 900, "mobile-preview.png"),
            ("module", module_index, 1180, 900, "module-preview.png"),
        ]:
            page = await browser.new_page(viewport={"width": width, "height": height}, device_scale_factor=1)
            console_errors: list[str] = []
            page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
            await page.goto(url, wait_until="load")
            await page.wait_for_timeout(500)
            overflow = await page.evaluate("document.documentElement.scrollWidth > window.innerWidth")
            await page.screenshot(path=str(evidence / out_name), full_page=True)
            checks["viewports"].append(
                {
                    "name": name,
                    "width": width,
                    "height": height,
                    "screenshot": f"evidence/{out_name}",
                    "document_horizontal_overflow": bool(overflow),
                    "console_errors": console_errors,
                }
            )
            await page.close()
        await browser.close()
    return checks


def portal_receipt() -> dict[str, Any]:
    payload = {
        "generated_at": STABLE_TIMESTAMP,
        "status": "local-proof-blocked",
        "reason": "A portable contract and private-target fixture are provided. Full central Portal build proof requires selecting the intended local Portal checkout and applying its exact current schema without mutating GHE.",
        "public_record_private_only_behavior": "public fixture is marked public and must remain excluded by production private-only logic",
        "module_id": "gs-pay-math-lab",
        "stable_anchor": "module-gs-pay-math-lab",
        "ghe_mutation": "none",
    }
    write_json(ROOT / "evidence" / "portal-integration-receipt.json", payload)
    return payload


async def main_async() -> None:
    input_payload = input_receipt()
    validation_payload = validation_receipt()
    write_json(ROOT / "evidence" / "calculation-validation.json", validation_payload)
    browser_payload = await capture_screenshots()
    portal_payload = portal_receipt()
    size_path = ROOT / "evidence" / "size-comparison.json"
    size_payload = json.loads(size_path.read_text(encoding="utf-8")) if size_path.exists() else {"status": "missing"}
    release = {
        "generated_at": STABLE_TIMESTAMP,
        "build_id": "n-gs-pay-math-lab-v0.01",
        "commit_sha": get_commit_sha(ROOT),
        "repository_worktree_bytes_excluding_git": tree_size(ROOT, exclude_names={".git", ".tmp-size-lab"}),
        "deployed_site_bytes": tree_size(ROOT / "site", exclude_names=set()),
        "single_file_offline_bytes": (ROOT / "site" / "offline" / "N-GS-Pay-Math-Lab-1977-2026.html").stat().st_size,
        "input_receipt": input_payload,
        "calculation_validation": validation_payload,
        "size_summary": size_payload,
        "release_artifacts": site_artifacts(),
        "browser_checks": browser_payload,
        "portal_integration": portal_payload,
        "ghe_mutation": "none",
    }
    write_json(ROOT / "evidence" / "release-receipt.json", release)
    site_evidence = ROOT / "site" / "evidence"
    site_evidence.mkdir(parents=True, exist_ok=True)
    write_json(site_evidence / "release-receipt.json", release)
    write_json(site_evidence / "calculation-validation.json", validation_payload)
    print("release receipt written")


def main() -> None:
    asyncio.run(main_async())


if __name__ == "__main__":
    main()
