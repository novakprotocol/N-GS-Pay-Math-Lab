from __future__ import annotations

import argparse
import subprocess
from pathlib import Path

from receipt_utils import ROOT


PROTECTED_PREFIXES = ("data/",)
PROTECTED_FILES = {
    "src/formulas.js",
    "scripts/pay_math.py",
    "tests/test_formulas.py",
    "tests/test_official_tables.py",
    "tests/test_rounding.py",
    "tests/test_historical_status.py",
}


def changed_files(base: str, head: str) -> list[str]:
    result = subprocess.run(
        ["git", "diff", "--name-only", f"{base}...{head}"],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    return [line.strip().replace("\\", "/") for line in result.stdout.splitlines() if line.strip()]


def is_protected(path: str) -> bool:
    return path in PROTECTED_FILES or any(path.startswith(prefix) for prefix in PROTECTED_PREFIXES)


def main() -> None:
    parser = argparse.ArgumentParser(description="Fail if promotion changes calculation or data files.")
    parser.add_argument("--base", default="HEAD~1")
    parser.add_argument("--head", default="HEAD")
    args = parser.parse_args()
    protected = [path for path in changed_files(args.base, args.head) if is_protected(path)]
    if protected:
        raise SystemExit("promotion diff blocked calculation/data changes: " + ", ".join(protected))
    print("promotion diff passed: no calculation/data files changed")


if __name__ == "__main__":
    main()
