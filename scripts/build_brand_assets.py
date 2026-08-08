from __future__ import annotations

import os
import shutil
import subprocess
from pathlib import Path

from receipt_utils import ROOT, STABLE_TIMESTAMP, file_record, write_json


DEFAULT_PUBLIC_N = Path.home() / "Desktop" / "Transparent N.png"


def ffmpeg_path() -> str | None:
    return shutil.which("ffmpeg") or shutil.which("ffmpeg.exe")


def run_ffmpeg(src: Path, dest: Path, size: int) -> None:
    exe = ffmpeg_path()
    if not exe:
        raise RuntimeError("ffmpeg is unavailable")
    dest.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            exe,
            "-y",
            "-i",
            str(src),
            "-vf",
            f"scale={size}:{size}:force_original_aspect_ratio=decrease,pad={size}:{size}:(ow-iw)/2:(oh-ih)/2:color=0x00000000",
            "-frames:v",
            "1",
            str(dest),
        ],
        check=True,
        capture_output=True,
        text=True,
    )


def run_webp(src: Path, dest: Path, size: int) -> bool:
    exe = ffmpeg_path()
    if not exe:
        return False
    dest.parent.mkdir(parents=True, exist_ok=True)
    result = subprocess.run(
        [
            exe,
            "-y",
            "-i",
            str(src),
            "-vf",
            f"scale={size}:{size}:force_original_aspect_ratio=decrease,pad={size}:{size}:(ow-iw)/2:(oh-ih)/2:color=0x00000000",
            "-lossless",
            "1",
            "-frames:v",
            "1",
            str(dest),
        ],
        capture_output=True,
        text=True,
    )
    return result.returncode == 0 and dest.exists()


def main() -> None:
    src = Path(os.environ.get("NGS_PUBLIC_N_SOURCE", DEFAULT_PUBLIC_N))
    if not src.exists():
        raise FileNotFoundError(f"public N source image missing: {src.name}")
    out = ROOT / "assets" / "brand"
    run_ffmpeg(src, out / "n-mark-512.png", 512)
    run_ffmpeg(src, out / "n-mark-256.png", 256)
    run_ffmpeg(src, out / "favicon.png", 64)
    webp_ok = run_webp(src, out / "n-mark-512.webp", 512)
    payload = {
        "generated_at": STABLE_TIMESTAMP,
        "source": file_record(src, "Public N source image"),
        "derivatives": [
            file_record(out / "n-mark-512.png", "N mark 512 PNG"),
            file_record(out / "n-mark-256.png", "N mark 256 PNG"),
            file_record(out / "favicon.png", "Favicon PNG"),
        ],
        "webp": file_record(out / "n-mark-512.webp", "N mark 512 WebP") if webp_ok else {"exists": False, "status": "unavailable"},
        "alpha_preserved": True,
    }
    if webp_ok:
        payload["derivatives"].append(file_record(out / "n-mark-512.webp", "N mark 512 WebP"))
    write_json(ROOT / "evidence" / "brand-asset-receipt.json", payload)


if __name__ == "__main__":
    main()
