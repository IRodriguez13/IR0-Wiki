# IR0 Wiki / Atlas

Documentation and executable exploration for **IR0** (kernel) and **ISD** (distro).

Focus: what the system **does today** — boot to shell, syscalls, VFS, MM (fork COW),
graphics/input paths — not gap checklists.

## Repositories

| Repo | Role |
|------|------|
| `../IR0` | Kernel — smokes, symbols, serial logs |
| `../ISD` | Distro rootfs — BusyBox, runit, TCC, profiles |
| `IR0-Wiki` | Classic wiki + Atlas (`content/` → `site/`) |

## Classic wiki

Static pages at the repo root:

- [`index.html`](index.html) / [`index_es.html`](index_es.html) — product overview
- [`Documentation/`](Documentation/) — subsystem notes mirrored from IR0 (EN + [`esp/`](Documentation/esp/))

## Atlas (interactive)

```bash
make atlas-sync-edition    # refresh kernel/isd commits in edition.json
make atlas-validate        # check symbols + trace nodes vs IR0 tree
make atlas-build           # validate + copy content → site/data/
make atlas-serve           # http://127.0.0.1:8765/
```

Deploy: the `site/` directory after `atlas-build` (GitHub Pages workflow).

### Capture traces from IR0 smokes

Needs musl, QEMU, and `disk.img` in the IR0 tree:

```bash
make atlas-capture SCENARIO=null-dereference ATLAS_RUN_SMOKE=1
make atlas-capture SCENARIO=ls-root ATLAS_RUN_SMOKE=1
make atlas-capture SCENARIO=hello-tcc ATLAS_RUN_SMOKE=1
make atlas-capture-all ATLAS_RUN_SMOKE=1
```

| Scenario | IR0 target | Log file |
|----------|------------|----------|
| `null-dereference` | `IR0_LEGACY_SMOKE=1 smoke-userspace-segv` | `/tmp/userspace-segv-smoke.log` |
| `ls-root` | `IR0_LEGACY_SMOKE=1 smoke-fase58l-busybox-coreutils` | `/tmp/fase58l-busybox-smoke.log` |
| `hello-tcc` | `smoke-tcc-power-halt` | `/tmp/tcc-power-halt-smoke.log` |

Parse only: `./scripts/capture_trace.sh ls-root --log /tmp/busybox-manifest-smoke.log`

## Layout

```text
content/           Atlas source (journeys, traces, journal)
site/              Built site (after atlas-build)
Documentation/     Kernel subsystem mirror (capabilities-first)
index.html         Classic wiki (EN)
index_es.html      Classic wiki (ES)
scripts/
```
