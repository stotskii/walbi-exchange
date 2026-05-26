#!/usr/bin/env bash
# Build and deploy walbi-exchange to Hetzner.
# Usage: ./deploy/deploy.sh
#
# What it does:
#   1. pnpm build  — produces dist/ with hashed assets + SW
#   2. rsync dist/ to /srv/walbi-exchange/ on the box
#   3. reload Caddy so any new headers fragment is picked up
#
# Requirements:
#   • SSH access to root@46.224.164.185 (Hetzner FSN1)
#   • /etc/caddy/sites/exchange.walbi.cfd imported in main Caddyfile
#   • DNS A record exchange.walbi.cfd → 46.224.164.185

set -euo pipefail

HOST="root@46.224.164.185"
REMOTE_ROOT="/srv/walbi-exchange"
HERE="$(cd "$(dirname "$0")/.." && pwd)"

cd "$HERE"

echo "▸ Building dist/…"
pnpm build

echo "▸ Ensuring remote root exists…"
ssh "$HOST" "mkdir -p $REMOTE_ROOT"

echo "▸ Syncing dist/ → $HOST:$REMOTE_ROOT…"
rsync -avz --delete \
	--exclude '.DS_Store' \
	dist/ "$HOST:$REMOTE_ROOT/"

echo "▸ Reloading Caddy…"
ssh "$HOST" "systemctl reload caddy || systemctl restart caddy"

echo "✓ Deployed → https://exchange.walbi.cfd"
