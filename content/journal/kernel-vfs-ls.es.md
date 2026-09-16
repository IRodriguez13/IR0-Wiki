# De ls / al readdir de MINIX

> **Edición:** 0.0.1-rc5  
> **Fuente de verdad:** `IR0/fs/vfs.c`, `IR0/fs/minix_fs.c`, `IR0/kernel/syscalls/fs_syscalls.c`

## Camino userspace

BusyBox `ls /` (harness FASE58L) más o menos:

```text
fork → execve /bin/ls → openat("/", O_RDONLY|O_DIRECTORY)
     → getdents64 loop → write(1, names…)
```

## Camino kernel

| Paso | Función | Archivo |
|------|---------|---------|
| Dispatch de syscall | `wrap_sys_getdents64` | `kernel/syscalls/syscall_dispatch.c` |
| VFS readdir | `vfs_readdir` | `fs/vfs.c` |
| Backend | `minix_fs_readdir` | `fs/minix_fs.c` (tabla de ops) |
| Salida a consola | `sys_write` | `kernel/syscalls/fs_syscalls.c` |

Los audits de ABI Linux cierran pedazos de este path por separado (`make -C IR0 linux-abi-audit-openat`, `linux-abi-audit-vfs-write`).

## Integración ISD + IR0

ISD inyecta `/bin/busybox` y hardlinks `/bin/ls` → busybox en la imagen de disco. El backend MINIX de IR0 sirve las entradas del directorio inode 1 (root).

**Tags de smoke:** `FASE58L_LS_ROOT_OK`, `FASE58L_LS_PATH_OK`  
**Captura:** `./scripts/capture_trace.sh ls-root --run-smoke`

Ver: [historia ls /](../site/story.html?id=ls-root)
