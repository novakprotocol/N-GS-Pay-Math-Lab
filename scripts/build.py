from __future__ import annotations

import json
import os
import shutil
from pathlib import Path
from typing import Any

from receipt_utils import ROOT, b64_data_uri, get_commit_sha, read_json


ALLOWLIST_EXTENSIONS = {".html", ".css", ".js", ".json", ".png", ".webp", ".svg", ".ico", ".txt"}
BUILD_ID = "n-gs-pay-math-lab-v0.01"


def require_relative(path_text: str) -> Path:
    path = Path(path_text)
    if path.is_absolute() or ".." in path.parts:
        raise ValueError(f"path must stay inside repository: {path_text}")
    return path


def clean_site(site: Path) -> None:
    if site.exists():
      shutil.rmtree(site)
    site.mkdir(parents=True)


def copy_file(src: Path, dest: Path) -> None:
    if src.suffix.lower() not in ALLOWLIST_EXTENSIONS:
        raise ValueError(f"unexpected static asset extension: {src}")
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dest)


def load_profiles() -> tuple[dict[str, Any], dict[str, Any]]:
    brand = read_json(ROOT / "config" / "brand.n.json")
    target = read_json(ROOT / "config" / "target.github-public.json")
    for key in ("display_title", "owner_label", "emblem_asset", "emblem_alt"):
        if not brand.get(key):
            raise ValueError(f"brand profile missing {key}")
    for key in ("owner", "repository", "visibility"):
        if not target.get(key):
            raise ValueError(f"target profile missing {key}")
    if target["visibility"] != "public":
        raise ValueError("public build requires public target profile")
    return brand, target


def combined_pay_data() -> dict[str, Any]:
    return {
        "adjustments": read_json(ROOT / "data" / "annual-adjustments.json"),
        "checkpoints": read_json(ROOT / "data" / "historical-checkpoints.json"),
        "validation": read_json(ROOT / "data" / "official-validation.json"),
        "locality": read_json(ROOT / "data" / "locality-examples.json"),
        "localityRates": read_json(ROOT / "data" / "locality-rates.json"),
        "localityDefinitions": read_json(ROOT / "data" / "locality-definitions.json"),
        "localityBoundaries": read_json(ROOT / "data" / "locality-boundaries.json"),
        "inflation": read_json(ROOT / "data" / "inflation-cpi.json"),
        "stateTaxFlags": read_json(ROOT / "data" / "state-tax-flags.json"),
        "regionalPriceParities": read_json(ROOT / "data" / "regional-price-parities.json"),
        "federalContext": read_json(ROOT / "data" / "federal-context.json"),
        "sources": read_json(ROOT / "data" / "sources.json"),
    }


def write_data_js(site: Path) -> None:
    data = combined_pay_data()
    text = "window.NGSPayData = " + json.dumps(data, sort_keys=True, separators=(",", ":")) + ";\n"
    (site / "data").mkdir(parents=True, exist_ok=True)
    (site / "data" / "pay-data.js").write_text(text, encoding="utf-8")


def copy_runtime(site: Path) -> None:
    for name in ("styles.css", "data-loader.js", "formulas.js", "app.js"):
        copy_file(ROOT / "src" / name, site / name)
    evidence_dir = site / "evidence"
    evidence_dir.mkdir(parents=True, exist_ok=True)
    size_json = ROOT / "evidence" / "size-comparison.json"
    if size_json.exists():
        payload = read_json(size_json)
        (evidence_dir / "size-comparison.js").write_text(
            "window.NGSPaySizeReceipt = " + json.dumps(payload, sort_keys=True, separators=(",", ":")) + ";\n",
            encoding="utf-8",
        )
        copy_file(size_json, evidence_dir / "size-comparison.json")
    else:
        (evidence_dir / "size-comparison.js").write_text("window.NGSPaySizeReceipt = null;\n", encoding="utf-8")
    for name in ("calculation-validation.json", "release-receipt.json"):
        evidence_file = ROOT / "evidence" / name
        if evidence_file.exists():
            copy_file(evidence_file, evidence_dir / name)


def copy_brand_assets(site: Path, brand: dict[str, Any]) -> None:
    asset = require_relative(brand["emblem_asset"])
    if not (ROOT / asset).exists():
        raise FileNotFoundError(f"brand asset missing: {asset}")
    for src in (ROOT / "assets" / "brand").glob("*"):
        if src.is_file():
            copy_file(src, site / "assets" / "brand" / src.name)


def render_template(prefix: str, shell_mode: str, brand: dict[str, Any]) -> str:
    template = (ROOT / "src" / "index.html").read_text(encoding="utf-8")
    replacements = {
        "{{ASSET_PREFIX}}": prefix,
        "{{SHELL_MODE}}": shell_mode,
        "{{BRAND_ALT}}": brand["emblem_alt"],
        "{{BUILD_ID}}": BUILD_ID,
        "{{COMMIT_SHA}}": get_commit_sha(ROOT),
    }
    for needle, value in replacements.items():
        template = template.replace(needle, str(value))
    if shell_mode == "standalone":
        template = template.replace('href="../index.html"', 'href="#calculator"')
    return template


def external_asset_check(site: Path) -> None:
    for path in [site / "index.html", site / "module" / "index.html", site / "styles.css", site / "app.js", site / "formulas.js"]:
        text = path.read_text(encoding="utf-8")
        lowered = text.lower()
        if "http://" in lowered or "https://" in lowered or "cdn." in lowered:
            raise ValueError(f"external runtime asset reference found in {path}")


def build_offline(site: Path, brand: dict[str, Any]) -> None:
    html = render_template("", "standalone", brand)
    css = (site / "styles.css").read_text(encoding="utf-8")
    data_js = (site / "data" / "pay-data.js").read_text(encoding="utf-8")
    size_js = (site / "evidence" / "size-comparison.js").read_text(encoding="utf-8")
    loader_js = (site / "data-loader.js").read_text(encoding="utf-8")
    formulas_js = (site / "formulas.js").read_text(encoding="utf-8")
    app_js = (site / "app.js").read_text(encoding="utf-8")
    n256 = b64_data_uri(site / "assets" / "brand" / "n-mark-256.png")
    n512 = b64_data_uri(site / "assets" / "brand" / "n-mark-512.png")
    html = html.replace('<link rel="icon" href="assets/brand/favicon.png">', "")
    html = html.replace('<link rel="stylesheet" href="styles.css">', f"<style>\n{css}\n</style>")
    html = html.replace('src="assets/brand/n-mark-256.png"', f'src="{n256}"')
    html = html.replace('src="assets/brand/n-mark-512.png"', f'src="{n512}"')
    script_block = "\n".join([data_js, size_js, loader_js, formulas_js, app_js])
    for tag in (
        '<script src="data/pay-data.js"></script>',
        '<script src="evidence/size-comparison.js"></script>',
        '<script src="data-loader.js"></script>',
        '<script src="formulas.js"></script>',
        '<script src="app.js"></script>',
    ):
        html = html.replace(tag, "")
    html = html.replace("</body>", f"<script>\n{script_block}\n</script>\n</body>")
    offline = site / "offline" / "N-GS-Pay-Math-Lab-1977-2026.html"
    offline.parent.mkdir(parents=True, exist_ok=True)
    offline.write_text(html, encoding="utf-8")


def main() -> None:
    brand, _target = load_profiles()
    site = ROOT / "site"
    clean_site(site)
    write_data_js(site)
    copy_runtime(site)
    copy_brand_assets(site, brand)
    (site / "index.html").write_text(render_template("", "standalone", brand), encoding="utf-8")
    (site / "module").mkdir(parents=True, exist_ok=True)
    (site / "module" / "index.html").write_text(render_template("../", "module", brand), encoding="utf-8")
    build_offline(site, brand)
    external_asset_check(site)


if __name__ == "__main__":
    main()
