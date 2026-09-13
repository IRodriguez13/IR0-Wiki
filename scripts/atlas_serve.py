#!/usr/bin/env python3
"""Serve site/ with no-store so local reloads pick up JS/CSS/HTML edits."""
from __future__ import annotations

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "site"
HOST = "127.0.0.1"
PORT = 8765


class NoCacheHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


def main() -> None:
    httpd = ThreadingHTTPServer((HOST, PORT), NoCacheHandler)
    print(f"IR0 Journal → http://{HOST}:{PORT}/index.html", flush=True)
    httpd.serve_forever()


if __name__ == "__main__":
    main()
