# IR0, ISD, and the three-tree boundary

> **Edition:** 0.0.1-pre-rc3  
> **Source of truth:** `ISD/Documentation/DISTRO_CONTRACT.md`

The Atlas spans multiple repositories on purpose:

| Tree | Owns | Atlas layer |
|------|------|-------------|
| **IR0** | Kernel, MM, syscalls, VFS, drivers | `kernel.*`, `arch.*`, `boundary.*` |
| **ISD** | Rootfs, init, packages, profiles | `userspace.shell`, `userspace.tcc`, disk layout |
| **IR0-Wiki** | This journal, map, traces | `content/` — not runtime |

Kernel code must not embed distro policy. ISD must not implement syscalls. The **syscall boundary** node in the atlas map is the contract between them.

## Editions pin both commits

Each journal edition records:

- `repos.kernel.commit` — IR0 HEAD at build time  
- `repos.isd.commit` — ISD HEAD at build time  

Run `make atlas-sync-edition` before publishing.

## What belongs in a story

- **null-dereference** — mostly IR0 (mm, signals, process)  
- **ls-root** — ISD BusyBox + IR0 VFS/MINIX  
- **hello-tcc** — ISD TCC package + IR0 exec/write/reboot  

No single repo holds the full picture; the Atlas exists to show the join.
