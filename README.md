# IR0 Atlas / Journal

Executable documentation for IR0 + ISD: curated kernel map, scenario traces from QEMU smokes, journal articles pinned to git commits.

## Repositories

| Repo | Role |
|------|------|
| `../IR0` | Kernel — smokes, symbols, serial logs |
| `../ISD` | Distro rootfs — BusyBox, TCC, profiles |
| `IR0-Wiki` | `content/` source + `site/` renderer |

## Commands

```bash
make atlas-sync-edition    # refresh kernel/isd commits in edition.json
make atlas-validate        # check symbols + trace nodes vs IR0 tree
make atlas-build           # validate + copy content → site/data/
make atlas-serve           # http://127.0.0.1:8765/

# Capture traces from IR0 smokes (needs musl, QEMU, disk.img)
make atlas-capture SCENARIO=null-dereference ATLAS_RUN_SMOKE=1
make atlas-capture SCENARIO=ls-root ATLAS_RUN_SMOKE=1
make atlas-capture SCENARIO=hello-tcc ATLAS_RUN_SMOKE=1
make atlas-capture-all ATLAS_RUN_SMOKE=1
```

### Smoke → scenario mapping

| Scenario | IR0 target | Log file |
|----------|------------|----------|
| `null-dereference` | `IR0_LEGACY_SMOKE=1 smoke-userspace-segv` | `/tmp/userspace-segv-smoke.log` |
| `ls-root` | `IR0_LEGACY_SMOKE=1 smoke-fase58l-busybox-coreutils` | `/tmp/fase58l-busybox-smoke.log` |
| `hello-tcc` | `smoke-tcc-power-halt` | `/tmp/tcc-power-halt-smoke.log` |

Parse only (existing log): `./scripts/capture_trace.sh ls-root --log /tmp/busybox-manifest-smoke.log`

## Layout

```text
content/
  edition.json
  atlas/map.json
  scenarios/*.json + *.trace.json
  journal/*.md
site/          ← deploy this directory (after atlas-build)
scripts/
```

Legacy wiki: `index.html` (static monolith).
