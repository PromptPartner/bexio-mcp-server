#!/usr/bin/env bash
# Adds (or replaces) a gateway client and prints its access key once.
#
#   scripts/client-add.sh <name> [connection]      connection defaults to "backoffice"
#
# Runs the CLI inside the image as the current user, so config/clients.json stays
# owned by you. The running gateway picks up the change without a restart.
set -euo pipefail
cd "$(dirname "$0")/.."

name="${1:?Usage: scripts/client-add.sh <name> [connection]}"
connection="${2:-backoffice}"

docker compose run --rm --no-deps \
  --user "$(id -u):$(id -g)" \
  --entrypoint node \
  bexio-mcp dist/cli/client-add.js "$name" "$connection" --file /config/clients.json
