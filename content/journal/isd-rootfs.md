# ISD rootfs layout

> **Edition:** 0.0.1-pre-rc3  
> **Source of truth:** `ISD/Documentation/ROOTFS_LAYOUT.md`, `make rootfs PROFILE=*`

ISD builds the **guest root filesystem** that IR0 boots. The kernel owns syscalls and drivers; ISD owns `/bin`, `/sbin`, `/etc`, and the composition of BusyBox, runit, TCC, and profile-specific packages.

## Primary artifact

```text
out/<arch>/rootfs/<profile>/
```

Required top-level directories:

| Path | Role |
|------|------|
| `/bin` `/sbin` | BusyBox applets, TCC, user tools |
| `/etc` | Config, `os-release`, runit services |
| `/dev` `/proc` `/sys` | Device nodes and pseudo-fs mount points |
| `/heart` | Host-share / pseudo-fs integration (kernel `/heart`) |
| `/tmp` `/run` `/var` | Writable runtime (01777 / 0755 per layout doc) |

## Relation to Atlas story **ls /**

When FASE58L runs `/bin/ls /`, the binary comes from ISD's BusyBox injection into the MINIX disk image. The kernel never "knows" about ISD as a distro — it sees ELF files on MINIX and syscalls from musl.

**Smoke:** `make -C IR0 smoke-busybox-manifest` (harness `setup/pid1/fase58l_busybox_smoke.c`).

See also: [ls / story](../site/story.html?id=ls-root)
