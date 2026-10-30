#!/usr/bin/env python3
"""One-click entry point: start the observatory and open it in the browser.

Double-click `start.bat` on Windows, `start.command` on macOS or run `./start.sh`.
Any flag the `web` command accepts (`--seed`, `--ticks`, `--port`, `--host`) is
forwarded, so `python start.py --seed 7 --port 9000` works too.
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from primordia.cli import main  # noqa: E402  (path setup must come first)


def start(argv=None) -> int:
    """Start the web observatory and open its page; returns the CLI exit code."""
    args = list(sys.argv[1:] if argv is None else argv)
    return main(["web", "--open", *args])


if __name__ == "__main__":
    sys.exit(start())
