## No.

IR0 es un **kernel Unix-like independiente**. No es una distribución Linux, no es un fork de Linux y no es “Linux con parches”.

Lo que **sí** comparte con Linux es deliberado y parcial:

- Una **ABI userspace compatible con Linux** cuando eso permite correr software existente **sin modificaciones específicas de IR0**.
- Nodos de dispositivo familiares (`/dev/fb0`, `/dev/events0`, semántica TTY) alineados con lo que musl, BusyBox y TinyX ya esperan.

Los programas hablan un contrato. Dos kernels pueden implementarlo. Linux es la referencia; IR0 es este proyecto. ISD es la capa de distro — no el kernel.

## Dos confusiones que esto evita

| Mito | Realidad |
|------|----------|
| “IR0 es una distro Linux” | ISD es la capa de distribución; IR0 es el árbol del kernel. |
| “IR0 inventa un universo incompatible” | El objetivo es correr software de terceros sin parchearlo, honrando contratos reales. |

## Una historia real: TinyX y read(2)

TinyX **no** se modifica para acomodar la semántica del kernel IR0. Donde se puede, **IR0 implementa los contratos userspace** que el software ya espera.

Cuando TinyX arrancó en IR0, el servidor X pidió **N bytes** de un dispositivo de input. IR0 podía devolver **más que count**, violando `read(2)`. Correr software de terceros **sin parches** expuso la violación — el arreglo era en el path de input del kernel, no en un fork de X.

Eso es más interesante que una página que diga “IR0 soporta X11.”

## Adónde seguir

- [Recorrido Start X](journey.html?id=start-x) — startx → framebuffer + UAPI de input
- [Arquitectura](architecture.html) — programas arriba, hardware abajo
