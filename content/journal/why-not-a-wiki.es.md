# Por qué esto no es una wiki

> Edición 0.0.1-rc5 · capa narrativa

Una wiki clásica es un grafo de páginas. Clickeás links, leés prosa y esperás que el texto siga coincidiendo con el código. Ese modelo se rompe rápido en un kernel que cambia cada semana.

**Explore IR0** es otra cosa:

| Modo | Qué obtenés |
|------|-------------|
| **Lectura** | Artículos cortos con layout de journal de sistemas. |
| **Exploración** | Un mapa curado de subsistemas para entrar y salir sin ahogarte en call graphs. |
| **Ejecución** | Recorridos que reproducen paths *observados* por IR0 — shell, syscalls, VFS, señales — paso a paso. |

## Tres fuentes de verdad

1. **Mapa curado** (`content/atlas/map.json`) — relaciones de diseño, no cada wrapper.  
2. **Código enlazado** — símbolos y archivos validados en el build contra el árbol del kernel.  
3. **Trazas** — streams JSON de smokes, KTM o klog; la animación sigue evidencia, no imaginación.

## Ediciones

Cada publicación está clavada a commits de kernel e ISD. Una explicación nunca pretende describir *master para siempre* — describe **esta edición**.

## Empezá acá

- [Historia de NULL dereference](story.html?id=null-dereference) — isolation en un fault.  
- [ls /](story.html?id=ls-root) — el path userspace → VFS completo.  
- [hello con TCC](story.html?id=hello-tcc) — compilar y correr en ISD.

Wiki estática legacy: [índice clásico](../index.html).
