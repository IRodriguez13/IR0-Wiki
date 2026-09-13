#!/usr/bin/env python3
"""Copy content/ into site/data/ for static serving (Phase 1 build)."""
from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"
SITE_DATA = ROOT / "site" / "data"


def copy_tree(src: Path, dst: Path) -> None:
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(src, dst)


def main() -> int:
    if not CONTENT.is_dir():
        print("ERROR: content/ missing", file=sys.stderr)
        return 1

    SITE_DATA.parent.mkdir(parents=True, exist_ok=True)
    copy_tree(CONTENT, SITE_DATA)
    print(f"atlas_build: copied {CONTENT} -> {SITE_DATA}")

    # Touch build stamp inside data
    stamp = {
        "built_from": str(CONTENT),
        "files": sum(1 for _ in SITE_DATA.rglob("*") if _.is_file()),
    }
    with (SITE_DATA / "build-stamp.json").open("w", encoding="utf-8") as f:
        json.dump(stamp, f, indent=2)

    return 0


if __name__ == "__main__":
    sys.exit(main())
