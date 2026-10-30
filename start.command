#!/bin/sh
# macOS double-click launcher for the observatory.
set -eu
cd "$(dirname "$0")"
exec sh ./start.sh "$@"
