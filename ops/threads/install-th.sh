#!/usr/bin/env bash
# Builds the `th` Threads CLI (github.com/Egor01KKK/threads-content-research-agent) at a reviewed commit.
# Usage: bash ops/threads/install-th.sh [output path, default /usr/local/bin/th]
set -euo pipefail
OUT="${1:-/usr/local/bin/th}"
COMMIT=981cccd2eb53d44f46cc5675b2388c8c7a6ad758
[ -x "$OUT" ] && { echo "th уже есть: $OUT"; exit 0; }
command -v go >/dev/null || { echo "нужен Go (go.dev/dl)" >&2; exit 1; }
D=$(mktemp -d); trap 'rm -rf "$D"' EXIT
git -C "$D" init -q
git -C "$D" fetch -q --depth 1 https://github.com/Egor01KKK/threads-content-research-agent "$COMMIT"
git -C "$D" checkout -q FETCH_HEAD
(cd "$D" && GOTOOLCHAIN=auto go build -o "$OUT" ./cmd/th)
echo "th установлен: $OUT"
