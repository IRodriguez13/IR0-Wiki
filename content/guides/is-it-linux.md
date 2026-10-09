## No.

IR0 is an **independent Unix-like kernel**. It is not a Linux distribution, not a Linux fork, and not “Linux with patches.”

What IR0 **does** share with Linux is deliberate:

- A **Linux-compatible userspace ABI** where that lets existing software run **without IR0-specific modifications**.
- Familiar device nodes (`/dev/fb0`, `/dev/events0`, TTY semantics) aligned with what musl, BusyBox, and TinyX already expect.

Programs speak one contract. Two kernels can implement it. Linux is the reference; IR0 is this project. ISD is the distro layer — not the kernel.

## Two confusions this avoids

| Myth | Reality |
|------|---------|
| “IR0 is a Linux distro” | ISD is the distribution layer; IR0 is the kernel tree. |
| “IR0 reinvents an incompatible universe” | The goal is to run unmodified third-party software by honoring real contracts. |

## A real story: TinyX and read(2)

TinyX is **not** modified to accommodate IR0 kernel semantics. Where practical, **IR0 implements the userspace contracts** expected by existing software.

When TinyX started on IR0, the X server requested **N bytes** from an input device. IR0 could return **more than count**, violating `read(2)`. Running **unmodified** third-party software exposed the contract violation — the fix belonged in the kernel input path, not in a fork of X.

That is more interesting than a page saying “IR0 supports X11.”

## Where to go next

- [Start X journey](journey.html?id=start-x) — startx → framebuffer + input UAPI
- [Architecture](architecture.html) — programs on top, hardware at the bottom
