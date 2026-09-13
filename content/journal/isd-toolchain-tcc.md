# Toolchain and guest TCC

> **Edition:** 0.0.1-pre-rc3  
> **Source of truth:** `ISD/Documentation/TOOLCHAIN.md`, `IR0/setup/pid1/init_tcc_power_halt.c`

ISD cross-compiles packages with musl for `x86_64-linux-musl` (see `make toolchain-check ARCH=x86_64`). IR0 smokes then inject the resulting rootfs into `disk.img` / ISO.

## Guest-native C with TinyCC

The **hello-tcc** Atlas story follows the TCC power-halt harness:

1. runit starts `init_tcc_power_halt.c` on ISD rootfs  
2. harness writes C source to `/tmp/ph.c`  
3. `/bin/tcc` compiles and links against `/lib/tcc`  
4. guest execs `/tmp/ph` — raw syscalls, optional `/dev/ktm`, then `reboot(HALT)`

Serial tags the smoke greps:

| Tag | Meaning |
|-----|---------|
| `TCC_POWER_LINK_OK` | TCC produced ELF |
| `POWER_TCC_COMPILE_OK` | Guest program ran after compile |
| `POWER_TCC_KTM_OK` | KTM userdev path OK |
| `SYSTEM_SHUTDOWN_HALT` | Clean halt |

**Smoke:** `make -C IR0 smoke-tcc-power-halt`  
**Log:** `/tmp/tcc-power-halt-smoke.log`

See: [hello-tcc story](../site/story.html?id=hello-tcc)
