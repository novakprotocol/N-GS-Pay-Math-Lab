from __future__ import annotations

import csv
import json
import os
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Any

from pay_math import build_schedule, years
from receipt_utils import ROOT, STABLE_TIMESTAMP, bytes_to_kib, bytes_to_mib, gzip_file_size, gzip_size, tree_size, write_json


PAY_CELLS = 7500


def sum_files(root: Path, suffixes: set[str] | None = None) -> tuple[int, int, int]:
    raw = 0
    gz = 0
    count = 0
    for path in root.rglob("*"):
        if path.is_file() and (suffixes is None or path.suffix.lower() in suffixes):
            raw += path.stat().st_size
            gz += gzip_file_size(path)
            count += 1
    return raw, gz, count


def file_group(paths: list[Path]) -> tuple[int, int, int]:
    raw = sum(path.stat().st_size for path in paths if path.exists())
    gz = sum(gzip_file_size(path) for path in paths if path.exists())
    count = sum(1 for path in paths if path.exists())
    return raw, gz, count


def measurement(
    id_: str,
    label: str,
    raw: int | None,
    gzip_bytes: int | None,
    file_count: int,
    cells: int,
    formula_bytes: int,
    show: bool = False,
    short_label: str | None = None,
    notes: str = "",
) -> dict[str, Any]:
    multiple = None
    reduction = None
    bytes_per_cell = None
    if raw and raw > 0 and formula_bytes > 0:
        multiple = raw / formula_bytes
        reduction = 100 * (1 - formula_bytes / raw)
    if raw is not None and cells > 0:
        bytes_per_cell = raw / cells
    return {
        "id": id_,
        "label": label,
        "short_label": short_label or label,
        "raw_bytes": raw,
        "kib": bytes_to_kib(raw) if raw is not None else None,
        "mib": bytes_to_mib(raw) if raw is not None else None,
        "gzip_bytes": gzip_bytes,
        "file_count": file_count,
        "represented_pay_cells": cells,
        "static_to_formula_multiple": multiple,
        "storage_reduction_percent": reduction,
        "bytes_per_pay_cell": bytes_per_cell,
        "show_in_ui": show,
        "notes": notes,
    }


def write_csv_table(path: Path, year: int, schedule: list[list[int]]) -> None:
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["year", "grade"] + [f"step_{step}" for step in range(1, 11)])
        for grade, row in enumerate(schedule, start=1):
            writer.writerow([year, grade] + row)


def html_table(year: int, schedule: list[list[int]]) -> str:
    rows = []
    for grade, row in enumerate(schedule, start=1):
        rows.append("<tr><th>GS-{}</th>{}</tr>".format(grade, "".join(f"<td>{value}</td>" for value in row)))
    return "<!doctype html><html><head><meta charset=\"utf-8\"><title>{}</title></head><body><table><thead><tr><th>Grade</th>{}</tr></thead><tbody>{}</tbody></table></body></html>".format(
        year,
        "".join(f"<th>Step {step}</th>" for step in range(1, 11)),
        "".join(rows),
    )


def generate_static_alternatives(tmp: Path) -> dict[str, Path]:
    dirs = {
        "csv": tmp / "annual-csv",
        "json": tmp / "annual-json",
        "html": tmp / "annual-html",
        "combined": tmp / "combined",
        "pdf": tmp / "annual-pdf",
    }
    for path in dirs.values():
        path.mkdir(parents=True, exist_ok=True)
    combined: dict[str, Any] = {}
    combined_html_parts = []
    for year in years():
        schedule = build_schedule(year)
        combined[str(year)] = schedule
        write_csv_table(dirs["csv"] / f"gs-{year}.csv", year, schedule)
        (dirs["json"] / f"gs-{year}.json").write_text(json.dumps({"year": year, "schedule": schedule}, sort_keys=True) + "\n", encoding="utf-8")
        html = html_table(year, schedule)
        (dirs["html"] / f"gs-{year}.html").write_text(html, encoding="utf-8")
        combined_html_parts.append(f"<section><h2>{year}</h2>{html.split('<body>', 1)[1].split('</body>', 1)[0]}</section>")
    (dirs["combined"] / "all-schedules.json").write_text(json.dumps(combined, sort_keys=True) + "\n", encoding="utf-8")
    (dirs["combined"] / "all-schedules.html").write_text(
        "<!doctype html><html><head><meta charset=\"utf-8\"><title>1977-2026 GS schedules</title></head><body>{}</body></html>".format("".join(combined_html_parts)),
        encoding="utf-8",
    )
    sample = ROOT / "evidence" / "static-sample-2026.csv"
    shutil.copy2(dirs["csv"] / "gs-2026.csv", sample)
    return dirs


def find_chrome() -> Path | None:
    candidates = [
        Path("C:/Program Files/Google/Chrome/Application/chrome.exe"),
        Path("C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"),
        Path("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"),
    ]
    for path in candidates:
        if path.exists():
            return path
    found = shutil.which("chrome") or shutil.which("msedge")
    return Path(found) if found else None


def generate_pdfs(chrome: Path, html_dir: Path, pdf_dir: Path) -> dict[str, Any]:
    try:
        version = subprocess.run([str(chrome), "--version"], capture_output=True, text=True, timeout=10)
    except Exception as exc:
        return {"status": "unavailable", "reason": f"browser version check failed: {exc}", "browser_executable": str(chrome), "browser_version": "unavailable"}
    generated = 0
    for html in sorted(html_dir.glob("*.html")):
        pdf = pdf_dir / (html.stem + ".pdf")
        try:
            result = subprocess.run(
                [
                    str(chrome),
                    "--headless=new",
                    "--disable-gpu",
                    "--no-sandbox",
                    f"--print-to-pdf={pdf}",
                    html.resolve().as_uri(),
                ],
                capture_output=True,
                text=True,
                timeout=45,
            )
        except Exception as exc:
            return {"status": "unavailable", "reason": f"headless print failed: {exc}", "browser_executable": str(chrome), "browser_version": version.stdout.strip()}
        if result.returncode != 0 or not pdf.exists():
            return {
                "status": "unavailable",
                "reason": (result.stderr or result.stdout or "headless print failed").strip()[:500],
                "browser_executable": str(chrome),
                "browser_version": version.stdout.strip(),
            }
        generated += 1
    return {
        "status": "generated",
        "file_count": generated,
        "browser_executable": str(chrome),
        "browser_version": version.stdout.strip(),
    }


def main() -> None:
    site = ROOT / "site"
    if not site.exists():
        raise FileNotFoundError("run scripts/build.py before scripts/build_size_receipt.py")

    js_files = [site / "data-loader.js", site / "formulas.js", site / "app.js", site / "data" / "pay-data.js"]
    css_files = [site / "styles.css"]
    html_files = [site / "index.html", site / "module" / "index.html"]
    brand_files = list((site / "assets" / "brand").glob("*"))
    data_files = list((ROOT / "data").glob("*.json"))
    source_metadata_files = [ROOT / "README.md", ROOT / "NOTICE.md", ROOT / "CITATION.cff"]

    js_raw, js_gz, js_count = file_group(js_files)
    css_raw, css_gz, css_count = file_group(css_files)
    html_raw, html_gz, html_count = file_group(html_files)
    brand_raw, brand_gz, brand_count = file_group(brand_files)
    data_raw, data_gz, data_count = file_group(data_files)
    metadata_raw, metadata_gz, metadata_count = file_group([path for path in source_metadata_files if path.exists()])

    core_engine_raw, core_engine_gz, core_engine_count = file_group([ROOT / "src" / "formulas.js", ROOT / "scripts" / "pay_math.py"])
    complete_raw = tree_size(site, exclude_names=set())
    formula_artifact_bytes = max(1, complete_raw - brand_raw)
    formula_artifact_gzip = max(1, sum_files(site, None)[1] - brand_gz)

    measurements: list[dict[str, Any]] = [
        measurement("core_calculation_engine", "Core calculation engine", core_engine_raw, core_engine_gz, core_engine_count, PAY_CELLS, formula_artifact_bytes, False),
        measurement("historical_data_checkpoints", "Historical data and checkpoints", data_raw, data_gz, data_count, PAY_CELLS, formula_artifact_bytes, False),
        measurement("html", "HTML bytes", html_raw, html_gz, html_count, PAY_CELLS, formula_artifact_bytes, False),
        measurement("css", "CSS bytes", css_raw, css_gz, css_count, 0, formula_artifact_bytes, False),
        measurement("javascript", "JavaScript bytes", js_raw, js_gz, js_count, PAY_CELLS, formula_artifact_bytes, False),
        measurement("source_metadata", "Source/reference metadata bytes", metadata_raw, metadata_gz, metadata_count, 0, formula_artifact_bytes, False),
        measurement("optimized_brand_assets", "Optimized N brand assets bytes", brand_raw, brand_gz, brand_count, 0, formula_artifact_bytes, False),
        measurement("calculation_without_brand", "Calculation package without brand imagery", formula_artifact_bytes, formula_artifact_gzip, sum_files(site, None)[2] - brand_count, PAY_CELLS, formula_artifact_bytes, True, "Formula package"),
        measurement("complete_with_brand", "Complete deployed package with brand imagery", complete_raw, sum_files(site, None)[1], sum_files(site, None)[2], PAY_CELLS, formula_artifact_bytes, True, "Complete package"),
        measurement("repository_worktree", "Full repository working-tree bytes excluding .git", tree_size(ROOT, exclude_names={".git", ".tmp-size-lab"}), None, 0, PAY_CELLS, formula_artifact_bytes, False),
        measurement("offline_single_file", "Single-file offline build", (site / "offline" / "N-GS-Pay-Math-Lab-1977-2026.html").stat().st_size, gzip_file_size(site / "offline" / "N-GS-Pay-Math-Lab-1977-2026.html"), 1, PAY_CELLS, formula_artifact_bytes, True, "Offline HTML"),
    ]

    input_sources = {
        "original_public_n_image": Path.home() / "Desktop" / "Transparent N.png",
        "original_pay_lab_html": Path.home() / "Downloads" / "gs-pay-math-lab-1977-2026.html",
        "portal_reference_html": Path.home() / "Downloads" / "index(20260808-155724).html",
    }
    for id_, path in input_sources.items():
        if path.exists():
            measurements.append(measurement(id_, id_.replace("_", " ").title(), path.stat().st_size, gzip_file_size(path), 1, 0, formula_artifact_bytes, False))

    tmp_root = ROOT / ".tmp-size-lab"
    if tmp_root.exists():
        shutil.rmtree(tmp_root)
    tmp_root.mkdir(parents=True, exist_ok=True)
    try:
        dirs = generate_static_alternatives(tmp_root)
        csv_raw, csv_gz, csv_count = sum_files(dirs["csv"], {".csv"})
        json_raw, json_gz, json_count = sum_files(dirs["json"], {".json"})
        annual_html_raw, annual_html_gz, annual_html_count = sum_files(dirs["html"], {".html"})
        combined_json = dirs["combined"] / "all-schedules.json"
        combined_html = dirs["combined"] / "all-schedules.html"
        measurements.extend(
            [
                measurement("annual_csv_tables", "Fifty separate annual CSV tables", csv_raw, csv_gz, csv_count, PAY_CELLS, formula_artifact_bytes, True, "50 CSV"),
                measurement("annual_json_tables", "Fifty separate annual JSON tables", json_raw, json_gz, json_count, PAY_CELLS, formula_artifact_bytes, True, "50 JSON"),
                measurement("annual_html_tables", "Fifty separate annual static HTML table pages", annual_html_raw, annual_html_gz, annual_html_count, PAY_CELLS, formula_artifact_bytes, True, "50 HTML"),
                measurement("combined_static_json", "One combined static JSON export containing all 7,500 cells", combined_json.stat().st_size, gzip_file_size(combined_json), 1, PAY_CELLS, formula_artifact_bytes, True, "Combined JSON"),
                measurement("combined_static_html", "One combined static HTML export containing all 7,500 cells", combined_html.stat().st_size, gzip_file_size(combined_html), 1, PAY_CELLS, formula_artifact_bytes, True, "Combined HTML"),
            ]
        )
        chrome = find_chrome()
        if chrome and os.environ.get("NGS_ENABLE_BROWSER_EVIDENCE") == "1":
            pdf_status = generate_pdfs(chrome, dirs["html"], dirs["pdf"])
            if pdf_status["status"] == "generated":
                pdf_raw, pdf_gz, pdf_count = sum_files(dirs["pdf"], {".pdf"})
                measurements.append(measurement("printable_pdfs", "Fifty printable PDFs", pdf_raw, pdf_gz, pdf_count, PAY_CELLS, formula_artifact_bytes, True, "50 PDFs", json.dumps(pdf_status, sort_keys=True)))
            else:
                measurements.append(measurement("printable_pdfs", "Fifty printable PDFs", None, None, 0, PAY_CELLS, formula_artifact_bytes, True, "50 PDFs", json.dumps(pdf_status, sort_keys=True)))
        else:
            reason = "unavailable: browser evidence disabled; set NGS_ENABLE_BROWSER_EVIDENCE=1 to generate PDFs"
            if not chrome:
                reason = "unavailable: no verified local headless Chromium/Chrome PDF path"
            measurements.append(measurement("printable_pdfs", "Fifty printable PDFs", None, None, 0, PAY_CELLS, formula_artifact_bytes, True, "50 PDFs", reason))
    finally:
        if tmp_root.exists():
            shutil.rmtree(tmp_root, ignore_errors=True)

    receipt = {
        "generated_at": STABLE_TIMESTAMP,
        "equations": {
            "static_to_formula_multiple": "static_equivalent_bytes / formula_artifact_bytes",
            "storage_reduction_percent": "100 * (1 - formula_artifact_bytes / static_equivalent_bytes)",
            "bytes_per_pay_cell": "artifact_bytes / represented_pay_cells",
        },
        "represented_pay_cells": PAY_CELLS,
        "formula_artifact_bytes": formula_artifact_bytes,
        "calculation_package_without_brand_imagery": formula_artifact_bytes,
        "complete_deployed_package_with_brand_imagery": complete_raw,
        "optimized_brand_assets_bytes": brand_raw,
        "measurements": measurements,
    }
    write_json(ROOT / "evidence" / "size-comparison.json", receipt)
    md_lines = [
        "# Size Comparison",
        "",
        f"Generated: {STABLE_TIMESTAMP}",
        "",
        "| Artifact | Raw bytes | Gzip bytes | Files | Cells | Multiple | Reduction |",
        "| --- | ---: | ---: | ---: | ---: | ---: | ---: |",
    ]
    for item in measurements:
        multiple = "N/A" if item["static_to_formula_multiple"] is None else f"{item['static_to_formula_multiple']:.2f}x"
        reduction = "N/A" if item["storage_reduction_percent"] is None else f"{item['storage_reduction_percent']:.1f}%"
        raw = "unavailable" if item["raw_bytes"] is None else str(item["raw_bytes"])
        gzip_text = "unavailable" if item["gzip_bytes"] is None else str(item["gzip_bytes"])
        md_lines.append(f"| {item['label']} | {raw} | {gzip_text} | {item['file_count']} | {item['represented_pay_cells']} | {multiple} | {reduction} |")
    (ROOT / "evidence" / "size-comparison.md").write_text("\n".join(md_lines) + "\n", encoding="utf-8")

    site_evidence = ROOT / "site" / "evidence"
    site_evidence.mkdir(parents=True, exist_ok=True)
    write_json(site_evidence / "size-comparison.json", receipt)
    (site_evidence / "size-comparison.js").write_text(
        "window.NGSPaySizeReceipt = " + json.dumps(receipt, sort_keys=True, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )
    print(f"size comparison written: formula package {formula_artifact_bytes} bytes, complete site {complete_raw} bytes")


if __name__ == "__main__":
    main()



