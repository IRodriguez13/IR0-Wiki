#!/usr/bin/env python3
"""
Parse IR0 / ISD QEMU serial logs into Atlas trace JSON.

Maps smoke tags, KTM lines, klog PF notices, and FASE58L harness output
to curated atlas node ids (content/atlas/map.json).
"""
from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

ROOT = Path(__file__).resolve().parent.parent


@dataclass
class TraceRule:
    pattern: re.Pattern[str]
    node: str
    kind: str
    detail_fn: Callable[[re.Match[str], str], str] | None = None


def _detail(m: re.Match[str], line: str) -> str:
    return line.strip()[:160]


def _pf_detail(m: re.Match[str], line: str) -> str:
    addr = m.group(1) if m.lastindex and m.lastindex >= 1 else "?"
    return f"userspace segv addr={addr}"


def _tag_detail(m: re.Match[str], line: str) -> str:
    return m.group(0)


def _harness_detail(m: re.Match[str], line: str) -> str:
    if "TCC_POWER_HARNESS_ID" in line:
        return line.strip().split("TCC_POWER_HARNESS_ID", 1)[-1].lstrip("=").strip()
    return line.strip()[:160]


SCENARIO_RULES: dict[str, list[TraceRule]] = {
    "null-dereference": [
        TraceRule(re.compile(r"exec /sbin/init|execve.*userspace_segv", re.I),
                  "kernel.process.exec", "SYSCALL_ENTER"),
        TraceRule(re.compile(r"\[NOTICE\]\s+\[PF\].*userspace segv", re.I),
                  "arch.page_fault", "EXCEPTION"),
        TraceRule(re.compile(r"\[PF\]\s+userspace segv pid=\w+ addr=([0-9a-fx]+)", re.I),
                  "kernel.mm.page_fault", "CLASSIFY", _pf_detail),
        TraceRule(re.compile(r"handler=0|no handler", re.I),
                  "kernel.signals", "SIGNAL"),
        TraceRule(re.compile(r"userspace_segv smoke observed", re.I),
                  "userspace.shell", "OUTPUT"),
    ],
    "ls-root": [
        TraceRule(re.compile(r"FASE58L_START|FASE58L_HARNESS", re.I), "userspace.shell", "INPUT"),
        TraceRule(re.compile(r"\[FASE58L\]\[ls_path\]|\[FASE58L\]\[ls\]", re.I),
                  "userspace.program", "EXEC", lambda m, l: "busybox ls /"),
        TraceRule(re.compile(r"FASE58L_LS_PATH_OK|FASE58L_LS_ROOT_OK", re.I),
                  "kernel.tty.write", "OUTPUT"),
        TraceRule(re.compile(r"KTM\|[^|]+\|SYSCALL[^|]*\|execve", re.I),
                  "kernel.process.exec", "SYSCALL_ENTER"),
        TraceRule(re.compile(r"KTM\|[^|]+\|SYSCALL[^|]*\|openat", re.I),
                  "kernel.vfs.lookup", "SYSCALL_ENTER"),
        TraceRule(re.compile(r"KTM\|[^|]+\|SYSCALL[^|]*\|getdents", re.I),
                  "kernel.vfs.readdir", "SYSCALL_ENTER"),
        TraceRule(re.compile(r"CLASSIFY.*VFS|VFS_LOOKUP|\[VFS\]", re.I),
                  "kernel.vfs.lookup", "VFS"),
        TraceRule(re.compile(r"MINIX.*readdir|MINIX_READDIR|stage=inode_lookup", re.I),
                  "kernel.fs.minix", "FS"),
        TraceRule(re.compile(r"KTM_BUSYBOX_COREUTILS_OK|FASE58L_OK", re.I),
                  "userspace.shell", "TAG"),
    ],
    "hello-tcc": [
        TraceRule(re.compile(r"TCC_POWER_HARNESS_ID=([^\s]+)", re.I),
                  "userspace.shell", "INPUT", _harness_detail),
        TraceRule(re.compile(r"RUNSV_TCC_POWER_START", re.I),
                  "userspace.shell", "INPUT", _tag_detail),
        TraceRule(re.compile(r"TCC_POWER_LINK_OK", re.I),
                  "userspace.tcc", "COMPILE", _tag_detail),
        TraceRule(re.compile(r"POWER_TCC_COMPILE_OK", re.I),
                  "userspace.program", "EXEC"),
        TraceRule(re.compile(r"POWER_TCC_HALT_CALL", re.I),
                  "kernel.process.exec", "SYSCALL_ENTER"),
        TraceRule(re.compile(r"KTM\|[^|]+\|SYSCALL[^|]*\|write", re.I),
                  "kernel.tty.write", "SYSCALL_ENTER"),
        TraceRule(re.compile(r"POWER_TCC_KTM_OK", re.I),
                  "userspace.shell", "TAG"),
        TraceRule(re.compile(r"SYSTEM_SHUTDOWN_HALT", re.I),
                  "hardware.qemu", "HALT"),
    ],
}

# Fallback rules when scenario-specific patterns miss KTM/generic lines
GENERIC_RULES: list[TraceRule] = [
    TraceRule(re.compile(r"KTM\|(\d+)\|([^|]+)\|([^|]+)\|", re.I), "", "KTM"),
]


SCENARIO_TAIL_MARKERS: dict[str, str] = {
    "null-dereference": "exec /sbin/init",
    "ls-root": "FASE58L_START",
    "hello-tcc": "TCC_POWER_HARNESS_ID",
}


def filter_log_tail(text: str, scenario: str) -> str:
    marker = SCENARIO_TAIL_MARKERS.get(scenario)
    if not marker:
        return text
    idx = text.find(marker)
    if idx < 0:
        return text
    return text[idx:]


def parse_log(log_path: Path, scenario: str) -> list[dict]:
    rules = SCENARIO_RULES.get(scenario, [])
    if not rules:
        raise ValueError(f"unknown scenario: {scenario}")

    seen: set[tuple[str, str]] = set()
    events: list[dict] = []
    seq = 0
    text = filter_log_tail(log_path.read_text(encoding="utf-8", errors="replace"), scenario)

    for line in text.splitlines():
        if not line.strip():
            continue

        def emit(node: str, kind: str, detail: str) -> None:
            nonlocal seq
            key = (node, kind, detail[:60])
            if key in seen:
                return
            seen.add(key)
            seq += 1
            events.append({
                "seq": seq,
                "t_ms": seq * 3,
                "node": node,
                "kind": kind,
                "detail": detail,
            })

        if scenario == "null-dereference" and "[PF] userspace segv" in line:
            m = re.search(r"addr=([0-9a-fx]+)", line, re.I)
            addr = m.group(1) if m else "?"
            emit("arch.page_fault", "EXCEPTION", f"#PF user not-present addr={addr}")
            emit("kernel.mm.page_fault", "CLASSIFY", f"pf_user_segv addr={addr}")
            if "handler=0" in line or "no handler" in line:
                emit("kernel.signals", "SIGNAL", "SIGSEGV default kill (no handler)")
            continue

        if scenario == "ls-root" and "FASE58L_LS_PATH_OK" in line:
            emit("userspace.shell", "INPUT", "FASE58L harness: /bin/ls /")
            emit("kernel.process.fork", "FORK", "run_capture fork for ls")
            emit("kernel.process.exec", "SYSCALL_ENTER", "execvp /bin/ls")
            emit("kernel.vfs.lookup", "VFS", "openat / O_DIRECTORY")
            emit("kernel.vfs.readdir", "VFS", "getdents64 loop")
            emit("kernel.fs.minix", "FS", "minix_fs_readdir /")
            emit("kernel.tty.write", "OUTPUT", "FASE58L_LS_PATH_OK")
            continue

        if scenario == "hello-tcc" and "POWER_TCC_COMPILE_OK" in line:
            emit("userspace.tcc", "COMPILE", "TCC linked /tmp/ph")
            emit("kernel.process.exec", "SYSCALL_ENTER", "execve ./tmp/ph")
            emit("userspace.program", "RUN", "guest raw syscalls + write")
            continue

        for rule in rules:
            m = rule.pattern.search(line)
            if not m:
                continue
            detail = rule.detail_fn(m, line) if rule.detail_fn else line.strip()[:160]
            emit(rule.node, rule.kind, detail)
            break

        # Generic KTM → infer node from syscall name in line
        km = re.search(r"KTM\|(\d+)\|([^|]+)\|([^|]+)\|([^|\n]*)", line)
        if km and scenario in ("ls-root", "hello-tcc"):
            name = km.group(3).lower()
            node = None
            kind = km.group(2).upper()
            if "execve" in name:
                node = "kernel.process.exec"
            elif "openat" in name or "open" == name:
                node = "kernel.vfs.lookup"
            elif "getdents" in name:
                node = "kernel.vfs.readdir"
            elif "write" in name:
                node = "kernel.tty.write"
            elif "fork" in name:
                node = "kernel.process.fork"
            if node:
                detail = f"KTM|{km.group(1)}|{km.group(2)}|{km.group(3)}|{km.group(4)}"
                key = (node, kind, detail[:60])
                if key not in seen:
                    seen.add(key)
                    seq += 1
                    events.append({
                        "seq": seq,
                        "t_ms": seq * 3,
                        "node": node,
                        "kind": kind,
                        "detail": detail,
                    })

    return events


def load_kernel_commit(ir0: Path) -> str:
    try:
        import subprocess
        r = subprocess.run(
            ["git", "-C", str(ir0), "rev-parse", "--short", "HEAD"],
            capture_output=True, text=True, check=True,
        )
        return r.stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        return "unknown"


def main() -> int:
    import argparse

    ap = argparse.ArgumentParser(description="Parse IR0 serial log → Atlas trace JSON")
    ap.add_argument("scenario", choices=sorted(SCENARIO_RULES.keys()))
    ap.add_argument("--log", type=Path, required=True, help="QEMU serial log file")
    ap.add_argument("--out", type=Path, help="Output JSON (default content/scenarios/<id>.trace.json)")
    ap.add_argument("--ir0", type=Path, default=ROOT.parent / "IR0")
    ap.add_argument("--min-events", type=int, default=2)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    out = args.out or (ROOT / "content" / "scenarios" / f"{args.scenario}.trace.json")

    if not args.log.is_file():
        print(f"ERROR: log not found: {args.log}", file=sys.stderr)
        return 1

    events = parse_log(args.log, args.scenario)
    if len(events) < args.min_events:
        print(f"WARN: only {len(events)} events (min {args.min_events}); not writing {out}",
              file=sys.stderr)
        return 2

    payload = {
        "scenario": args.scenario,
        "edition": "0.0.1-pre-rc3",
        "source": "captured-serial",
        "kernel_commit": load_kernel_commit(args.ir0),
        "log_file": str(args.log),
        "events": events,
    }

    if args.dry_run:
        print(json.dumps(payload, indent=2))
        return 0

    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {out} ({len(events)} events) from {args.log}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
