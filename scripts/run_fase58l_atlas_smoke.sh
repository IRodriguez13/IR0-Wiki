#!/usr/bin/env bash
# Minimal FASE58L disk inject for Atlas ls-root capture (no ISD manifest gate).
set -euo pipefail

IR0="${IR0_ROOT:-$(cd "$(dirname "$0")/../../IR0" && pwd)}"
LOG="${1:-/tmp/fase58l-busybox-smoke.log}"
BB="${IR0}/setup/pid1/fase50_busybox_real"
H="${IR0}/setup/pid1/fase58l_busybox_smoke"

if [[ ! -f "$BB" ]]; then
  echo "✗ missing $BB — build BusyBox first (make -C IR0 build-busybox-fase58-full partial OK)" >&2
  exit 1
fi

cd "$IR0"
DISK=$(mktemp /tmp/ir0-fase58l-atlas.XXXXXX.img)
cleanup() { rm -f "$DISK"; }
trap cleanup EXIT

dd if=/dev/zero of="$DISK" bs=1M count=200 status=none
python3 scripts/inject_init_minix.py --format-large "$DISK"
python3 scripts/inject_init_minix.py "$DISK" "$H" sbin/init
python3 scripts/inject_init_minix.py "$DISK" "$BB" bin/busybox
for app in echo ls cat sh pwd uname; do
  python3 scripts/inject_init_minix.py --hardlink "$DISK" bin/busybox "bin/$app"
done

rm -f "$LOG"
bash scripts/smoke_qemu_run.sh --log "$LOG" --timeout 120 --done FASE58L_OK -- \
  qemu-system-x86_64 -cdrom kernel-x64-userspace.iso \
  -drive file="$DISK",format=raw,if=ide,index=0 \
  -serial stdio -display none -m 256M -no-reboot -net none

grep -q FASE58L_LS_PATH_OK "$LOG" || grep -q FASE58L_LS_ROOT_OK "$LOG"
