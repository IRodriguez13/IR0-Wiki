# IR0, ISD y el límite de los tres árboles

> **Edición:** 0.0.1-rc5  
> **Fuente de verdad:** `ISD/Documentation/DISTRO_CONTRACT.md`

Explore cubre más de un repositorio a propósito:

| Árbol | Dueño de | Capa en el mapa |
|------|----------|-----------------|
| **IR0** | Kernel, MM, syscalls, VFS, drivers | `kernel.*`, `arch.*`, `boundary.*` |
| **ISD** | Rootfs, init, paquetes, perfiles | `userspace.shell`, `userspace.tcc`, layout de disco |
| **IR0-Wiki** | Esta guía, mapa, trazas | `content/` — no es runtime |

El código del kernel no debe meter política de distro. ISD no debe implementar syscalls. El nodo de **syscall boundary** en el mapa es el contrato entre los dos.

## Las ediciones clavan los dos commits

Cada edición registra:

- `repos.kernel.commit` — HEAD de IR0 al generar  
- `repos.isd.commit` — HEAD de ISD al generar  

Correr `make atlas-sync-edition` antes de publicar.

## Qué entra en un recorrido

- **null-dereference** — sobre todo IR0 (mm, signals, process)  
- **ls-root** — BusyBox de ISD + VFS/MINIX de IR0  
- **hello-tcc** — paquete TCC de ISD + exec/write/reboot de IR0  

Ningún repo tiene el cuadro completo; Explore existe para mostrar el empalme.
