# Userspace page faults and SIGSEGV

> **Edition:** 0.0.1-rc5  
> **Source of truth:** `IR0/mm/page_fault.c`, `IR0/kernel/process/signals.c`, `IR0/kernel/process/exit.c`

When a ring-3 program touches an unmapped address, the CPU raises **#PF**. IR0's portable handler is `mm_page_fault_handle()`:

## Classification

For user faults where the address is not heap, stack, or mmap — and not eligible for demand paging — the kernel calls `pf_user_segv()`:

- tries `signals_deliver_from_irq_frame()` if a handler exists  
- otherwise `process_signal_default_kill()` with **SIGSEGV**  
- sets `exit_signal` so `wait4` returns `WIFSIGNALED(SIGSEGV)` (not `exited(139)`)  
- BusyBox ash prints `Segmentation fault`

## Smoke evidence

| Component | Path |
|-----------|------|
| Fault binary | `IR0/setup/pid1/userspace_segv.c` (uses unmapped `0xDEADBEEF`) |
| PID1 validator | `IR0/setup/pid1/init_segv_smoke.c` |
| Target | `make -C IR0 IR0_LEGACY_SMOKE=1 smoke-userspace-segv` |
| Serial grep | `[PF] userspace segv pid=` + `userspace_segv smoke observed` |

## Kernel vs userspace fault

A fault in ring 0 with no recovery path → **panic**. A fault in ring 3 → **only that process dies**. The Explore story compares both outcomes.

See: [NULL dereference story](../site/story.html?id=null-dereference)
