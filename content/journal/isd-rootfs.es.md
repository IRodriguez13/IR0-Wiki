# Layout del rootfs de ISD

> **Edición:** 0.0.1-rc5  
> **Fuente de verdad:** `ISD/Documentation/ROOTFS_LAYOUT.md`, `make rootfs PROFILE=*`

ISD construye el **filesystem raíz del guest** que IR0 arranca. El kernel es dueño de syscalls y drivers; ISD es dueño de `/bin`, `/sbin`, `/etc` y de cómo se componen BusyBox, runit, TCC y los paquetes del perfil.

## Artefacto principal

```text
out/<arch>/rootfs/<profile>/
```

Directorios de primer nivel requeridos:

| Path | Rol |
|------|-----|
| `/bin` `/sbin` | Applets de BusyBox, TCC, herramientas de usuario |
| `/etc` | Config, `os-release`, servicios runit |
| `/dev` `/proc` `/sys` | Nodos de dispositivo y puntos de mount de pseudo-fs |
| `/heart` | Share con el host / integración de pseudo-fs (kernel `/heart`) |
| `/tmp` `/run` `/var` | Runtime escribible (01777 / 0755 según el layout) |

## Relación con el recorrido **ls /**

Cuando FASE58L corre `/bin/ls /`, el binario viene de la inyección BusyBox de ISD en la imagen MINIX. El kernel nunca “conoce” ISD como distro — ve ELFs en MINIX y syscalls de musl.

**Smoke:** `make -C IR0 smoke-busybox-manifest` (harness `setup/pid1/fase58l_busybox_smoke.c`).

Ver también: [historia ls /](../site/story.html?id=ls-root)
