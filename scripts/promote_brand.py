from __future__ import annotations

import argparse
from pathlib import Path

from receipt_utils import ROOT, read_json


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate a brand/target promotion profile without changing calculation files.")
    parser.add_argument("--brand", default="config/brand.va-vision.example.json")
    parser.add_argument("--target", default="config/target.ghe-private.example.json")
    args = parser.parse_args()

    brand_path = ROOT / args.brand
    target_path = ROOT / args.target
    brand = read_json(brand_path)
    target = read_json(target_path)
    asset_text = str(brand.get("emblem_asset", ""))
    if brand.get("requires_user_supplied_asset") and ("__SUPPLY" in asset_text or not Path(asset_text).exists()):
        raise SystemExit("refusing promotion: supply the approved VA-VISION emblem path before building a private profile")
    if target.get("visibility") != "private":
        raise SystemExit("refusing promotion: private target profile must declare private visibility")
    print("promotion profile validated; run build in a private worktree only after diff validation")


if __name__ == "__main__":
    main()
