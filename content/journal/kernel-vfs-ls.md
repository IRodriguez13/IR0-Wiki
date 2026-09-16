# From ls / to MINIX readdir

> **Edition:** 0.0.1-rc5  
> **Source of truth:** `IR0/fs/vfs.c`, `IR0/fs/minix_fs.c`, `IR0/kernel/syscalls/fs_syscalls.c`

## Userspace path

BusyBox `ls /` (see FASE58L harness) roughly:

```text
fork → execve /bin/ls → openat("/", O_RDONLY|O_DIRECTORY)
     → getdents64 loop → write(1, names…)
```

## Kernel path

| Step | Function | File |
|------|----------|------|
| Syscall dispatch | `wrap_sys_getdents64` | `kernel/syscalls/syscall_dispatch.c` |
| VFS readdir | `vfs_readdir` | `fs/vfs.c` |
| Backend | `minix_fs_readdir` | `fs/minix_fs.c` (via fs ops table) |
| Console out | `sys_write` | `kernel/syscalls/fs_syscalls.c` |

Linux ABI audits lock down pieces of this path separately (`make -C IR0 linux-abi-audit-openat`, `linux-abi-audit-vfs-write`).

## ISD + IR0 integration

ISD injects `/bin/busybox` and hardlinks `/bin/ls` → busybox on the disk image. IR0 MINIX backend serves inode 1 (root) directory entries.

**Smoke tags:** `FASE58L_LS_ROOT_OK`, `FASE58L_LS_PATH_OK`  
**Capture:** `./scripts/capture_trace.sh ls-root --run-smoke`

See: [ls / story](../site/story.html?id=ls-root)
