from __future__ import annotations

import base64
import hashlib
import json
import mimetypes
import os
import struct
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
STABLE_TIMESTAMP = "2026-08-08T00:00:00Z"


def read_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8-sig") as handle:
        return json.load(handle)


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(payload, indent=2, sort_keys=True)
    path.write_text(text + "\n", encoding="utf-8")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def file_record(path: Path, label: str | None = None) -> dict[str, Any]:
    exists = path.exists()
    record: dict[str, Any] = {
        "label": label or path.name,
        "file_name": path.name,
        "exists": exists,
    }
    if not exists:
        record["status"] = "missing"
        return record
    mime = mimetypes.guess_type(str(path))[0] or "application/octet-stream"
    record.update(
        {
            "byte_count": path.stat().st_size,
            "sha256": sha256_file(path),
            "mime": mime,
        }
    )
    if path.suffix.lower() == ".png":
        record.update(png_info(path))
    return record


def png_info(path: Path) -> dict[str, Any]:
    with path.open("rb") as handle:
        signature = handle.read(8)
        if signature != b"\x89PNG\r\n\x1a\n":
            return {"image": {"valid_png": False}}
        has_trns = False
        width = height = color_type = bit_depth = None
        while True:
            raw_len = handle.read(4)
            if not raw_len:
                break
            length = struct.unpack(">I", raw_len)[0]
            chunk_type = handle.read(4)
            chunk = handle.read(length)
            handle.read(4)
            if chunk_type == b"IHDR":
                width, height, bit_depth, color_type = struct.unpack(">IIBB", chunk[:10])
            elif chunk_type == b"tRNS":
                has_trns = True
            elif chunk_type == b"IEND":
                break
        has_alpha = color_type in (4, 6) or has_trns
    return {
        "image": {
            "valid_png": True,
            "width": width,
            "height": height,
            "bit_depth": bit_depth,
            "color_type": color_type,
            "has_alpha": bool(has_alpha),
        }
    }


def gzip_size(data: bytes) -> int:
    import gzip

    return len(gzip.compress(data, mtime=0))


def gzip_file_size(path: Path) -> int:
    return gzip_size(path.read_bytes())


def bytes_to_kib(value: int) -> float:
    return round(value / 1024, 2)


def bytes_to_mib(value: int) -> float:
    return round(value / (1024 * 1024), 4)


def tree_size(root: Path, exclude_names: set[str] | None = None) -> int:
    exclude_names = exclude_names or set()
    total = 0
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [name for name in dirnames if name not in exclude_names]
        for name in filenames:
            path = Path(dirpath, name)
            total += path.stat().st_size
    return total


def b64_data_uri(path: Path) -> str:
    mime = mimetypes.guess_type(str(path))[0] or "application/octet-stream"
    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:{mime};base64,{encoded}"


def get_commit_sha(root: Path = ROOT) -> str:
    import subprocess

    try:
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=root,
            check=True,
            capture_output=True,
            text=True,
        )
        return result.stdout.strip()
    except Exception:
        return "unavailable"

