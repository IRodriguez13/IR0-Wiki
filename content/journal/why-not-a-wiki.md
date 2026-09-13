# Why this is not a wiki

> Edition 0.0.1-pre-rc3 · narrative layer

A classical wiki is a graph of pages. You click links, read prose, and hope the text still matches the code. That model fails fast on a kernel that changes every week.

**IR0 Atlas / IR0 Journal** is something else:

| Mode | What you get |
|------|----------------|
| **Reading** | Long-form articles with editorial layout — like a systems journal. |
| **Exploration** | A curated map of subsystens you can enter and leave without drowning in call graphs. |
| **Execution** | Stories that replay *observed* paths through IR0 — shell, syscalls, VFS, signals — step by step. |

## Three sources of truth

1. **Curated map** (`content/atlas/map.json`) — design relationships, not every wrapper.
2. **Linked code** — symbols and files validated at build time against the kernel tree.
3. **Traces** — JSON event streams from smokes, KTM, or klog; the animation follows evidence, not imagination.

## Editions

Each publication is pinned to kernel and ISD commits. An explanation never pretends to describe *master forever* — it describes **this edition**.

## Start here

- [NULL dereference story](story.html?id=null-dereference) — isolation in one fault.
- [ls /](story.html?id=ls-root) — the full userspace → VFS path.
- [hello with TCC](story.html?id=hello-tcc) — compile and run on ISD.

Legacy static wiki: [classic index](../index.html).
