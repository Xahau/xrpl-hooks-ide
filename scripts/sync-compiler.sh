#!/bin/sh
# Copies the in-browser compiler worker bundle from a sibling hooks-compiler checkout.
# Usage: HOOKS_COMPILER=../hooks-compiler sh scripts/sync-compiler.sh
# Build it there first with `pnpm install && pnpm build:worker`.
set -e
SRC="${HOOKS_COMPILER:-../hooks-compiler}/dist-worker"
[ -f "$SRC/worker.js" ] || { echo "missing $SRC/worker.js"; exit 1; }
mkdir -p public/compiler && cp "$SRC"/* public/compiler/
echo "synced from $SRC @ $(git -C "${HOOKS_COMPILER:-../hooks-compiler}" rev-parse --short HEAD)" > public/compiler/SYNC
