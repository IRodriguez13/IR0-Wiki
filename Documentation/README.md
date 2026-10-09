# IR0 Wiki — Kernel documentation mirror

> **Last verified:** 2026-10-09  
> **Source of truth:** sibling tree [`../IR0/Documentation/`](../IR0/Documentation/)  
> (code under `IR0/` wins if this mirror drifts).

Public-facing subsystem notes for IR0, synced from the kernel repo with a
**capabilities-first** edit (no backlog dumps, no gap checklists).

Spanish mirrors live under [`esp/`](esp/).

## Map

| Document | Topic |
|----------|--------|
| [MEMORY.md](MEMORY.md) | PMM, paging, fork COW, lazy anon mmap/brk, page faults |
| [PROCESSES.md](PROCESSES.md) | Lifecycle, wait/reap, signals, credentials |
| [SCHEDULING.md](SCHEDULING.md) | Scheduler policies, blocked syscalls, context switch |
| [FILESYSTEM.md](FILESYSTEM.md) | VFS, MINIX, FAT16, EXT2 RO, tmpfs, block layer |
| [VIRTUAL_FILESYSTEMS.md](VIRTUAL_FILESYSTEMS.md) | `/proc`, `/sys`, `/dev`, `/heart` |
| [DRIVERS.md](DRIVERS.md) | Driver registry and bootstrap |
| [INTERRUPTS.md](INTERRUPTS.md) | IDT/PIC, exceptions, signal mapping |
| [USERSPACE.md](USERSPACE.md) | IR0 ↔ ISD coupling, `first-boot`, product rootfs |
| [LINUX_SHAPED.md](LINUX_SHAPED.md) | Linux-shaped ABI without cloning the Linux tree |
| [TOOLING.md](TOOLING.md) | Build, menuconfig, run, validation targets |

## How to refresh

From a workspace with `IR0/` and `IR0-Wiki/` as siblings, copy the matching
`.md` files from `IR0/Documentation/` (and `esp/`), then re-apply the
capabilities-first trim if upstream reintroduces Weak Points sections.

For interactive exploration (journeys, traces, break lab), use the Atlas site
built from `content/` — see the repo [README.md](../README.md).
