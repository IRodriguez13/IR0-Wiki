#!/usr/bin/env python3
"""
Validate IR0 Atlas content against kernel tree and internal graph consistency.
Phase 1+ — stdlib only.
"""
from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"
DEFAULT_KERNEL = ROOT.parent / "IR0"
DEFAULT_ISD = ROOT.parent / "ISD"


def load_json(path: Path) -> dict:
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def kernel_root(edition: dict) -> Path:
    env = os.environ.get("IR0_ROOT")
    if env:
        return Path(env).resolve()
    rel = edition.get("repos", {}).get("kernel", {}).get("path", "../../IR0")
    p = (ROOT / rel).resolve()
    return p if p.is_dir() else DEFAULT_KERNEL


def isd_root(edition: dict) -> Path:
    env = os.environ.get("ISD_ROOT")
    if env:
        return Path(env).resolve()
    rel = edition.get("repos", {}).get("isd", {}).get("path", "../../ISD")
    p = (ROOT / rel).resolve()
    return p if p.is_dir() else DEFAULT_ISD


def repo_file_exists(path: str, kernel: Path, isd: Path) -> bool:
    if path.startswith("IR0/"):
        return (kernel / path[4:]).is_file()
    if path.startswith("ISD/"):
        return (isd / path[4:]).is_file()
    return False


def symbol_in_file(kernel: Path, rel_path: str, symbol: str) -> bool:
    # rel_path like IR0/fs/vfs.c -> strip IR0/ prefix
    sub = rel_path
    if sub.startswith("IR0/"):
        sub = sub[4:]
    fp = kernel / sub
    if not fp.is_file():
        return False
    text = fp.read_text(encoding="utf-8", errors="replace")
    pat = re.compile(r"\b" + re.escape(symbol) + r"\b")
    return bool(pat.search(text))


def validate_journeys(
    node_ids: set[str],
    kernel: Path | None,
    isd: Path | None,
    errors: list[str],
    warnings: list[str],
) -> None:
    journeys_dir = CONTENT / "journeys"
    if not journeys_dir.is_dir():
        return
    for journey_path in sorted(journeys_dir.glob("*.json")):
        journey = load_json(journey_path)
        jid = journey.get("id", journey_path.stem)
        for step in journey.get("steps", []):
            nid = step.get("node")
            if nid and nid not in node_ids:
                errors.append(f"journey {jid} step {step.get('id')}: unknown node {nid}")
            impl = step.get("implementation") or {}
            fpath = impl.get("file", "")
            if fpath.startswith(("IR0/", "ISD/")) and kernel and isd:
                if not repo_file_exists(fpath, kernel, isd):
                    warnings.append(f"journey {jid}: missing file {fpath} (optional ISD path)")
                sym = impl.get("symbol", "")
                if sym and fpath.startswith("IR0/") and not symbol_in_file(kernel, fpath, sym):
                    warnings.append(f"journey {jid}: symbol {sym} not found in {fpath}")
        for ref in journey.get("refs", []):
            path = ref.get("path", "")
            name = ref.get("symbol", "")
            if path.startswith("IR0/") and kernel and kernel.is_dir():
                sub = path[4:]
                if not (kernel / sub).is_file():
                    errors.append(f"journey {jid}: missing file {path}")
                elif name and not symbol_in_file(kernel, path, name):
                    warnings.append(f"journey {jid}: symbol {name} not found in {path}")


def validate_graph_only(errors: list[str], warnings: list[str]) -> None:
    """Validate map/scenario/trace node ids without kernel tree."""
    map_data = load_json(CONTENT / "atlas" / "map.json")
    node_ids = {n["id"] for n in map_data["nodes"]}
    for edge in map_data.get("edges", []):
        if edge["from"] not in node_ids:
            errors.append(f"edge from unknown node {edge['from']}")
        if edge["to"] not in node_ids:
            errors.append(f"edge to unknown node {edge['to']}")
    scenarios_dir = CONTENT / "scenarios"
    for scenario_path in sorted(scenarios_dir.glob("*.json")):
        if scenario_path.name.endswith(".trace.json"):
            continue
        scenario = load_json(scenario_path)
        sid = scenario.get("id", scenario_path.stem)
        for step in scenario.get("steps", []):
            nid = step.get("node")
            if nid and nid not in node_ids:
                errors.append(f"scenario {sid} step {step.get('id')}: unknown node {nid}")
        trace_file = scenario.get("trace_file")
        if trace_file:
            tp = scenarios_dir / trace_file
            if not tp.is_file():
                errors.append(f"scenario {sid}: missing trace {trace_file}")
            else:
                trace = load_json(tp)
                for ev in trace.get("events", []):
                    en = ev.get("node")
                    if en and en not in node_ids:
                        errors.append(f"trace {trace_file}: unknown node {en}")

    validate_journeys(node_ids, None, None, errors, warnings)
    validate_scenario_playback(errors, warnings)
    validate_architecture(errors, warnings)
    validate_i18n(errors, warnings)


def validate_i18n(errors: list[str], warnings: list[str]) -> None:
    i18n_dir = CONTENT / "i18n"
    for loc in ("en", "es"):
        path = i18n_dir / f"ui.{loc}.json"
        if not path.is_file():
            errors.append(f"missing i18n/ui.{loc}.json")
    actions_es = CONTENT / "explore" / "actions.es.json"
    if not actions_es.is_file():
        errors.append("missing explore/actions.es.json")
    arch_es = CONTENT / "architecture.es.json"
    if not arch_es.is_file():
        errors.append("missing architecture.es.json")


def validate_architecture(errors: list[str], warnings: list[str]) -> None:
    path = CONTENT / "architecture.json"
    if not path.is_file():
        return
    arch = load_json(path)
    layers = arch.get("layers") or []
    if len(layers) < 2:
        errors.append("architecture.json: expected at least 2 layers")
    flow = (arch.get("contracts") or {}).get("flow") or []
    if not flow:
        errors.append("architecture.json: contracts.flow missing (use stack format, not ASCII graph)")
    for step in flow:
        if not step.get("label"):
            errors.append("architecture.json: contract step missing label")


def validate_scenario_playback(errors: list[str], warnings: list[str]) -> None:
    scenarios_dir = CONTENT / "scenarios"
    for scenario_path in sorted(scenarios_dir.glob("*.json")):
        if scenario_path.name.endswith(".trace.json"):
            continue
        scenario = load_json(scenario_path)
        sid = scenario.get("id", scenario_path.stem)
        panels = scenario.get("panels") or []
        for step in scenario.get("steps", []):
            pb = step.get("playback")
            if not pb:
                errors.append(f"scenario {sid} step {step.get('id')}: missing playback")
                continue
            if "terminal" in panels:
                hist = (pb.get("terminal") or {}).get("history") or []
                if not hist:
                    errors.append(f"scenario {sid} step {step.get('id')}: empty terminal.history")
            if "cpu" in panels:
                cpu = pb.get("cpu") or {}
                if not any(cpu.get(k) for k in ("mode", "ring", "cr2", "rip", "lines")):
                    errors.append(f"scenario {sid} step {step.get('id')}: empty cpu state")


def validate_refs(kernel: Path, isd: Path, errors: list[str], warnings: list[str]) -> None:
    map_data = load_json(CONTENT / "atlas" / "map.json")
    node_ids = {n["id"] for n in map_data["nodes"]}

    for node in map_data["nodes"]:
        for sym in node.get("symbols", []):
            path = sym.get("path", "")
            name = sym.get("name", "")
            sub = path[4:] if path.startswith("IR0/") else path
            fp = kernel / sub
            if not fp.is_file():
                errors.append(f"map node {node['id']}: missing file {path}")
                continue
            if name and not symbol_in_file(kernel, path, name):
                warnings.append(f"map node {node['id']}: symbol {name} not found in {path}")

    for edge in map_data.get("edges", []):
        if edge["from"] not in node_ids:
            errors.append(f"edge from unknown node {edge['from']}")
        if edge["to"] not in node_ids:
            errors.append(f"edge to unknown node {edge['to']}")

    scenarios_dir = CONTENT / "scenarios"
    for scenario_path in sorted(scenarios_dir.glob("*.json")):
        if scenario_path.name.endswith(".trace.json"):
            continue
        scenario = load_json(scenario_path)
        sid = scenario.get("id", scenario_path.stem)

        for ref in scenario.get("refs", []):
            path = ref.get("path", "")
            name = ref.get("symbol", "")
            sub = path[4:] if path.startswith("IR0/") else path
            if not (kernel / sub).is_file():
                errors.append(f"scenario {sid}: missing file {path}")
            elif name and not symbol_in_file(kernel, path, name):
                warnings.append(f"scenario {sid}: symbol {name} not found in {path}")

        for step in scenario.get("steps", []):
            nid = step.get("node")
            if nid and nid not in node_ids:
                errors.append(f"scenario {sid} step {step.get('id')}: unknown node {nid}")

        trace_file = scenario.get("trace_file")
        if trace_file:
            tp = scenarios_dir / trace_file
            if not tp.is_file():
                errors.append(f"scenario {sid}: missing trace {trace_file}")
            else:
                trace = load_json(tp)
                for ev in trace.get("events", []):
                    en = ev.get("node")
                    if en and en not in node_ids:
                        errors.append(f"trace {trace_file}: unknown node {en}")

    validate_journeys(node_ids, kernel, isd, errors, warnings)
    validate_scenario_playback(errors, warnings)
    validate_architecture(errors, warnings)
    validate_i18n(errors, warnings)


def main() -> int:
    edition = load_json(CONTENT / "edition.json")
    kernel = kernel_root(edition)
    isd = isd_root(edition)
    errors: list[str] = []
    warnings: list[str] = []

    if not kernel.is_dir():
        warnings.append(f"kernel tree not found: {kernel} — skipping symbol/file checks")
        kernel_ok = False
    else:
        kernel_ok = True

    if kernel_ok:
        validate_refs(kernel, isd, errors, warnings)
    else:
        validate_graph_only(errors, warnings)

    for w in warnings:
        print(f"WARN: {w}")
    for e in errors:
        print(f"ERROR: {e}")

    if errors:
        print(f"\nvalidate_refs: FAIL ({len(errors)} errors, {len(warnings)} warnings)")
        return 1

    print(f"validate_refs: OK ({len(warnings)} warnings)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
