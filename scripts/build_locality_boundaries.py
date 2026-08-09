from __future__ import annotations

import argparse
import json
import struct
import zipfile
from pathlib import Path
from typing import Any

from receipt_utils import ROOT, read_json

CENSUS_BOUNDARY_URL = "https://www2.census.gov/geo/tiger/GENZ2025/shp/cb_2025_us_county_20m.zip"
OPM_LOCALITY_URL = "https://www.opm.gov/policy-data-oversight/pay-leave/salaries-wages/2026/locality-pay-area-definitions/"


def dbf_fields(dbf: bytes) -> tuple[int, int, list[tuple[str, int]]]:
    record_count = struct.unpack_from("<I", dbf, 4)[0]
    header_len = struct.unpack_from("<H", dbf, 8)[0]
    record_len = struct.unpack_from("<H", dbf, 10)[0]
    fields: list[tuple[str, int]] = []
    offset = 1
    pos = 32
    while pos < header_len and dbf[pos] != 0x0D:
        raw_name = dbf[pos : pos + 11].split(b"\x00", 1)[0]
        name = raw_name.decode("ascii", errors="ignore")
        length = dbf[pos + 16]
        fields.append((name, length))
        offset += length
        pos += 32
    return record_count, header_len, record_len, fields


def rounded_point(fips: str, x: float, y: float) -> list[float]:
    if fips.startswith("02") and x > 0:
        x -= 360
    return [round(x, 3), round(y, 3)]


def read_shp_shapes_aligned(shp: bytes, dbf_rows: list[dict[str, str]], locality_by_fips: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    shapes: list[dict[str, Any]] = []
    offset = 100
    record_index = 0
    while offset + 8 <= len(shp):
        _record_number, content_words = struct.unpack_from(">2i", shp, offset)
        offset += 8
        content_len = content_words * 2
        content = shp[offset : offset + content_len]
        offset += content_len
        attrs = dbf_rows[record_index] if record_index < len(dbf_rows) else {}
        record_index += 1
        fips = attrs.get("GEOID") or attrs.get("GEOIDFQ", "")[-5:]
        if not fips or fips not in locality_by_fips:
            continue
        if len(content) < 44:
            continue
        shape_type = struct.unpack_from("<i", content, 0)[0]
        if shape_type == 0:
            continue
        if shape_type not in {5, 15, 25, 31}:
            raise ValueError(f"unexpected shape type {shape_type}")
        num_parts, num_points = struct.unpack_from("<2i", content, 36)
        parts_start = 44
        points_start = parts_start + num_parts * 4
        if points_start + num_points * 16 > len(content):
            raise ValueError(f"shape record {fips} is truncated")
        parts = list(struct.unpack_from(f"<{num_parts}i", content, parts_start)) + [num_points]
        points = [struct.unpack_from("<2d", content, points_start + idx * 16) for idx in range(num_points)]
        rings: list[list[list[float]]] = []
        xs: list[float] = []
        ys: list[float] = []
        for start, end in zip(parts, parts[1:]):
            ring: list[list[float]] = []
            previous: list[float] | None = None
            for x, y in points[start:end]:
                point = rounded_point(fips, x, y)
                if point == previous:
                    continue
                ring.append(point)
                previous = point
            if len(ring) >= 3:
                if ring[0] == ring[-1]:
                    ring.pop()
                for x, y in ring:
                    xs.append(x)
                    ys.append(y)
                rings.append(ring)
        if not rings:
            continue
        locality = locality_by_fips[fips]
        shapes.append({
            "fips": fips,
            "state_abbr": locality["state_abbr"],
            "locality_code": locality["locality_code"],
            "locality_percent": locality["locality_percent"],
            "bbox": [round(min(xs), 3), round(min(ys), 3), round(max(xs), 3), round(max(ys), 3)],
            "rings": rings,
        })
    return sorted(shapes, key=lambda item: item["fips"])


def read_dbf_rows(dbf: bytes) -> list[dict[str, str]]:
    record_count, header_len, record_len, fields = dbf_fields(dbf)
    rows: list[dict[str, str]] = []
    for index in range(record_count):
        pos = header_len + index * record_len
        if pos + record_len > len(dbf) or dbf[pos] == ord("*"):
            rows.append({})
            continue
        cursor = pos + 1
        values: dict[str, str] = {}
        for name, length in fields:
            raw = dbf[cursor : cursor + length]
            values[name] = raw.decode("utf-8", errors="ignore").strip()
            cursor += length
        rows.append(values)
    return rows


def build_boundaries(zip_path: Path) -> dict[str, Any]:
    locality = read_json(ROOT / "data" / "locality-definitions.json")
    locality_by_fips = {county["fips"]: county for county in locality["counties"]}
    with zipfile.ZipFile(zip_path) as archive:
        shp_name = next(name for name in archive.namelist() if name.endswith(".shp"))
        dbf_name = next(name for name in archive.namelist() if name.endswith(".dbf"))
        shp = archive.read(shp_name)
        dbf = archive.read(dbf_name)
    dbf_rows = read_dbf_rows(dbf)
    counties = read_shp_shapes_aligned(shp, dbf_rows, locality_by_fips)
    return {
        "description": "Census 2025 1:20,000,000 county cartographic boundary polygons joined to OPM 2026 locality definitions for browser canvas rendering.",
        "source_policy": "Only OPM and federal Census .gov sources are used. Geometry is generalized cartographic boundary data, not a legal duty-station determination.",
        "boundary_year": 2025,
        "locality_year": 2026,
        "scale": "1:20,000,000",
        "census_boundary_source_url": CENSUS_BOUNDARY_URL,
        "opm_locality_source_url": OPM_LOCALITY_URL,
        "coordinate_precision_decimal_degrees": 3,
        "county_count": len(counties),
        "counties": counties,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Build compact county boundary geometry for the locality map.")
    parser.add_argument("--zip", required=True, type=Path, help="Official Census cb_2025_us_county_20m.zip path")
    parser.add_argument("--output", type=Path, default=ROOT / "data" / "locality-boundaries.json")
    args = parser.parse_args()
    payload = build_boundaries(args.zip)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, sort_keys=True, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"county boundary map written: {payload['county_count']} counties -> {args.output}")


if __name__ == "__main__":
    main()
