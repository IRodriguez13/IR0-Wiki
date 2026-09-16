# Page faults de userspace y SIGSEGV

> **Edición:** 0.0.1-rc5  
> **Fuente de verdad:** `IR0/mm/page_fault.c`, `IR0/kernel/process/signals.c`, `IR0/kernel/process/exit.c`

Cuando un programa en ring 3 toca una dirección no mapeada, la CPU levanta **#PF**. El handler portable de IR0 es `mm_page_fault_handle()`:

## Clasificación

En faults de usuario donde la dirección no es heap, stack ni mmap — y no sirve demand paging — el kernel llama `pf_user_segv()`:

- prueba `signals_deliver_from_irq_frame()` si hay handler  
- si no, `process_signal_default_kill()` con **SIGSEGV**  
- setea `exit_signal` para que `wait4` devuelva `WIFSIGNALED(SIGSEGV)` (no `exited(139)`)  
- BusyBox ash imprime `Segmentation fault`

## Evidencia del smoke

| Componente | Path |
|-----------|------|
| Binario del fault | `IR0/setup/pid1/userspace_segv.c` (usa `0xDEADBEEF` sin mapear) |
| Validador de PID1 | `IR0/setup/pid1/init_segv_smoke.c` |
| Target | `make -C IR0 IR0_LEGACY_SMOKE=1 smoke-userspace-segv` |
| Serial grep | `[PF] userspace segv pid=` + `userspace_segv smoke observed` |

## Fault de kernel vs userspace

Un fault en ring 0 sin recuperación → **pánico**. Un fault en ring 3 → **solo muere ese proceso**. El recorrido de Explore compara los dos desenlaces.

Ver: [historia de NULL dereference](../site/story.html?id=null-dereference)
