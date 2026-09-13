#!/usr/bin/env bash
# Bridge ISD scripts into IR0/scripts when smokes expect them locally.
set -euo pipefail

IR0="${1:?IR0 root}"
ISD="${2:?ISD root}"

mkdir -p "$IR0/scripts" "$IR0/packages/busybox"
link_if_missing() {
  local name="$1"
  local src="$ISD/scripts/$name"
  local dst="$IR0/scripts/$name"
  if [[ -f "$src" && ! -e "$dst" ]]; then
    ln -sf "$src" "$dst"
    echo "linked $dst -> $src"
  fi
}

link_pkg_if_missing() {
  local rel="$1"
  local src="$ISD/$rel"
  local dst="$IR0/$rel"
  if [[ -e "$src" && ! -e "$dst" ]]; then
    mkdir -p "$(dirname "$dst")"
    ln -sf "$src" "$dst"
    echo "linked $dst -> $src"
  fi
}

for s in busybox_apply_fragment.sh busybox_inject_manifest.sh busybox_check_manifest.sh install-to-disk.sh inject-smoke-service.sh; do
  link_if_missing "$s"
done

for p in packages/busybox/required_applets.txt packages/busybox/fase58_full.config packages/busybox/fase58_busybox.config; do
  link_pkg_if_missing "$p"
done

# IR0 Makefile uses $(IR0_USERSPACE_ROOT) = ISD
export IR0_ISD_ROOT="$ISD"
export IR0_USERSPACE_ROOT="$ISD"

# smoke-tcc-power-halt checks $(IR0_USERSPACE_OUT)/stage-bin (= product/stage-bin).
# Smoke-only run stubs (runit_tcc_power_run, etc.) live under smoke/stage-bin.
ARCH="${ISD_ARCH:-x86_64}"
PRODUCT_STAGE="$ISD/out/$ARCH/product/stage-bin"
SMOKE_STAGE="$ISD/out/$ARCH/smoke/stage-bin"
if [[ -d "$SMOKE_STAGE" && -d "$PRODUCT_STAGE" ]]; then
  for stub in runit_tcc_power_run runit_fase52_run; do
    if [[ -f "$SMOKE_STAGE/$stub" && ! -e "$PRODUCT_STAGE/$stub" ]]; then
      ln -sf "$SMOKE_STAGE/$stub" "$PRODUCT_STAGE/$stub"
      echo "linked $PRODUCT_STAGE/$stub -> $SMOKE_STAGE/$stub"
    fi
  done
fi

echo "prepare_ir0_smoke_env: IR0=$IR0 ISD=$ISD"
