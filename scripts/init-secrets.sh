#!/usr/bin/env bash
# Creates the secrets and config files docker-compose.yml expects.
# Existing files are kept, so the script can be re-run safely.
set -euo pipefail
cd "$(dirname "$0")/.."

mkdir -p secrets config
chmod 700 secrets

if [[ ! -s secrets/token_encryption_key ]]; then
  openssl rand -hex 32 > secrets/token_encryption_key
  echo "Created secrets/token_encryption_key (back it up: without it the stored Bexio login cannot be decrypted)."
fi

if [[ ! -s secrets/gateway_admin_key ]]; then
  openssl rand -hex 24 > secrets/gateway_admin_key
  echo "Created secrets/gateway_admin_key. Admin password for https://<domain>/admin:"
  cat secrets/gateway_admin_key
fi

if [[ ! -s secrets/bexio_client_secret ]]; then
  read -r -s -p "Client secret of your Bexio app (developer.bexio.com): " secret
  echo
  [[ -n "$secret" ]] || { echo "No client secret entered." >&2; exit 1; }
  printf '%s' "$secret" > secrets/bexio_client_secret
  echo "Created secrets/bexio_client_secret."
fi

# The container runs as uid 1001; the directory itself stays private (700).
chmod 644 secrets/*

if [[ ! -f config/clients.json ]]; then
  echo '{}' > config/clients.json
  echo "Created config/clients.json (add clients with scripts/client-add.sh)."
fi
chmod 755 config
chmod 644 config/clients.json
