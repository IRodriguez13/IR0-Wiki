#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IR0="${IR0_ROOT:-$(cd "$ROOT/../IR0" && pwd)}"
ISD="${ISD_ROOT:-$(cd "$ROOT/../ISD" && pwd)}"
SCENARIO="${1:-null-dereference}"
RUN_SMOKE=0
LOG=""

shift || true
while [[ $# -gt 0 ]]; do
  case "$1" in
    --run-smoke) RUN_SMOKE=1 ;;
    --log) LOG="$2"; shift ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
  shift
done

OUT="$ROOT/content/scenarios/${SCENARIO}.trace.json"
PY="$ROOT/scripts/parse_serial_trace.py"

prepare() {
  chmod +x "$ROOT/scripts/prepare_ir0_smoke_env.sh"
  "$ROOT/scripts/prepare_ir0_smoke_env.sh" "$IR0" "$ISD"
}

run_smoke() {
  prepare
  export IR0_ISD_ROOT="$ISD" IR0_USERSPACE_ROOT="$ISD"
  case "$SCENARIO" in
    null-dereference)
      LOG="${LOG:-/tmp/userspace-segv-smoke.log}"
      echo "==> IR0 IR0_LEGACY_SMOKE=1 smoke-userspace-segv → $LOG"
      make -C "$IR0" IR0_LEGACY_SMOKE=1 smoke-userspace-segv
      ;;
    ls-root)
      LOG="${LOG:-/tmp/fase58l-busybox-smoke.log}"
      echo "==> Atlas FASE58L ls smoke → $LOG"
      chmod +x "$ROOT/scripts/run_fase58l_atlas_smoke.sh"
      if ! "$ROOT/scripts/run_fase58l_atlas_smoke.sh" "$LOG"; then
        echo "WARN: FASE58L atlas smoke failed; try curated trace"
        exit 0
      fi
      ;;
    hello-tcc)
      LOG="${LOG:-/tmp/tcc-power-halt-smoke.log}"
      echo "==> IR0 smoke-tcc-power-halt → $LOG"
      make -C "$IR0" smoke-tcc-power-halt
      ;;
    *)
      echo "No smoke target for $SCENARIO"
      exit 1
      ;;
  esac
}

if [[ "$RUN_SMOKE" -eq 1 ]]; then
  run_smoke
fi

case "$SCENARIO" in
  null-dereference) LOG="${LOG:-/tmp/userspace-segv-smoke.log}" ;;
  ls-root)          LOG="${LOG:-/tmp/fase58l-busybox-smoke.log}" ;;
  hello-tcc)        LOG="${LOG:-/tmp/tcc-power-halt-smoke.log}" ;;
esac

if [[ ! -f "$LOG" ]]; then
  echo "WARN: log missing: $LOG"
  echo "  Run with --run-smoke or pass --log PATH"
  exit 0
fi

python3 "$PY" "$SCENARIO" --log "$LOG" --out "$OUT" --ir0 "$IR0" || {
  RC=$?
  if [[ "$RC" -eq 2 ]]; then
    echo "Keeping existing curated trace at $OUT"
    exit 0
  fi
  exit "$RC"
}

python3 "$ROOT/scripts/sync_edition.py" --ir0 "$IR0" --isd "$ISD"
python3 "$ROOT/scripts/validate_refs.py"
