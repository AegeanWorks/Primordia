#!/bin/sh
# Start the Primordia observatory and open its page.
set -eu
cd "$(dirname "$0")"
if command -v python3 >/dev/null 2>&1; then
    exec python3 start.py "$@"
fi
if command -v python >/dev/null 2>&1; then
    exec python start.py "$@"
fi
echo "Primordia needs Python 3.10+ on PATH." >&2
exit 1
