# Toolchain y TCC invitado

> **Edición:** 0.0.1-rc5  
> **Fuente de verdad:** `ISD/Documentation/TOOLCHAIN.md`, `IR0/setup/pid1/init_tcc_power_halt.c`

ISD cruza paquetes con musl para `x86_64-linux-musl` (ver `make toolchain-check ARCH=x86_64`). Los smokes de IR0 inyectan el rootfs resultante en `disk.img` / ISO.

## C nativo en el guest con TinyCC

La historia **hello-tcc** sigue el harness power-halt de TCC:

1. runit arranca `init_tcc_power_halt.c` sobre el rootfs ISD  
2. el harness escribe fuente C en `/tmp/ph.c`  
3. `/bin/tcc` compila y linkea contra `/lib/tcc`  
4. el guest hace exec de `/tmp/ph` — syscalls crudos, `/dev/ktm` opcional, después `reboot(HALT)`

El serial etiqueta lo que grepea el smoke:

| Tag | Significado |
|-----|-------------|
| `TCC_POWER_LINK_OK` | TCC produjo ELF |
| `POWER_TCC_COMPILE_OK` | El programa invitado corrió después de compilar |
| `POWER_TCC_KTM_OK` | Path KTM userdev OK |
| `SYSTEM_SHUTDOWN_HALT` | Halt limpio |

**Smoke:** `make -C IR0 smoke-tcc-power-halt`  
**Log:** `/tmp/tcc-power-halt-smoke.log`

Ver: [historia hello-tcc](../site/story.html?id=hello-tcc)
