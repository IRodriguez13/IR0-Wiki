#!/usr/bin/env python3
"""Refresh content/edition.json commits from IR0, ISD, and wiki git."""
from __future__ import annotations

import json
import re
import subprocess
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EDITION = ROOT / "content" / "edition.json"


def ir0_version_string(repo: Path) -> str | None:
    header = repo / "includes" / "ir0" / "version.h"
    if not header.is_file():
        return None
    text = header.read_text(encoding="utf-8", errors="replace")
    match = re.search(r'#define\s+IR0_VERSION_STRING\s+"([^"]+)"', text)
    return match.group(1) if match else None


def git_short(repo: Path) -> str | None:
    if not repo.is_dir():
        return None
    try:
        r = subprocess.run(
            ["git", "-C", str(repo), "rev-parse", "--short", "HEAD"],
            capture_output=True, text=True, check=True,
        )
        return r.stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        return None


def main() -> int:
    import argparse

    ap = argparse.ArgumentParser()
    ap.add_argument("--ir0", type=Path, default=ROOT.parent / "IR0")
    ap.add_argument("--isd", type=Path, default=ROOT.parent / "ISD")
    ap.add_argument("--wiki", type=Path, default=ROOT)
    args = ap.parse_args()

    data = json.loads(EDITION.read_text(encoding="utf-8"))
    today = date.today().isoformat()

    k = git_short(args.ir0)
    i = git_short(args.isd)
    w = git_short(args.wiki)
    ver = ir0_version_string(args.ir0)

    if ver:
        data["edition"] = ver
        editions = data.setdefault("editions", [])
        current = next((ed for ed in editions if ed.get("current")), None)
        if current:
            current["id"] = ver
            current["label"] = ver
        else:
            editions.insert(0, {
                "id": ver,
                "label": ver,
                "current": True,
            })

    if k:
        data["repos"]["kernel"]["commit"] = k
        data["repos"]["kernel"]["path"] = str(Path("..") / "IR0")
        data["repos"]["kernel"]["docs_url"] = (
            f"https://github.com/IRodriguez13/IR0/tree/{k}/Documentation"
        )
    if i:
        data["repos"]["isd"]["commit"] = i
        data["repos"]["isd"]["path"] = str(Path("..") / "ISD")
    if w:
        data["repos"]["wiki"]["commit"] = w

    data["generated"] = today
    for ed in data.get("editions", []):
        if ed.get("current"):
            ed["generated"] = today
            if k:
                ed["kernel_commit"] = k
            if i:
                ed["isd_commit"] = i

    # Today items grounded in repo smoke/Makefile targets
    data["today"] = {
        "headline": "Today's system",
        "items": [
            f"IR0 kernel @ {k or '?'} — smokes: IR0_LEGACY_SMOKE=1 smoke-userspace-segv, smoke-busybox-manifest, smoke-tcc-power-halt",
            f"ISD @ {i or '?'} — rootfs profiles via make build ARCH=x86_64",
            "Atlas traces captured from QEMU serial when --run-smoke is used",
            "Three executable stories: NULL fault, ls /, TCC compile+halt",
        ],
    }

    EDITION.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    print(f"sync_edition: kernel={k} isd={i} wiki={w} → {EDITION}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
