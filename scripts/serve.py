from __future__ import annotations

import http.server
import socketserver
from pathlib import Path

from receipt_utils import ROOT


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format: str, *args: object) -> None:
        return


def main() -> None:
    site = ROOT / "site"
    if not site.exists():
        raise SystemExit("site directory missing; run python scripts/build.py first")
    port = 8000
    while True:
        try:
            with socketserver.TCPServer(("127.0.0.1", port), lambda *args, **kwargs: QuietHandler(*args, directory=str(site), **kwargs)) as httpd:
                print(f"http://127.0.0.1:{port}/")
                httpd.serve_forever()
        except OSError:
            port += 1
            if port > 8010:
                raise


if __name__ == "__main__":
    main()
