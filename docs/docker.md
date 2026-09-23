# Running the gateway with Docker

The gateway is a single container that lets several Claude Desktop users work with Bexio at the same time:

```
Claude Desktop (anna) ─┐                      ┌──────────────────────────┐
Claude Desktop (beat) ─┼─ HTTPS + access key ─▶ bexio-mcp-gateway /mcp   │── OAuth token ──▶ Bexio API
Claude Desktop (...)  ─┘                      │  connection "backoffice" │
                                              └──────────────────────────┘
```

- A **connection** is one Bexio login (for example the shared `backoffice` user). An admin connects it once in the browser. After that the gateway refreshes the token in the background; the refresh token stays valid as long as it is used at least once a year, and the gateway uses it daily.
- A **client** is one Claude Desktop installation. It gets its own access key and is mapped to a connection. Several clients can share one connection. If you later work with more Bexio users, add a connection per user and map the clients accordingly.

## 1. Register an app at Bexio

1. Sign in at [developer.bexio.com](https://developer.bexio.com) with a Bexio user that has admin rights and create a new app.
2. Add the redirect URL `https://<your-domain>/oauth/callback`.
3. Note the **client ID** and **client secret**.

The gateway requests these scopes by default (everything the tools need; payroll is read-only):

```
openid profile email company_profile offline_access
accounting article_edit bank_account_show bank_payment_edit contact_edit file
kb_invoice_edit kb_offer_edit kb_order_edit kb_delivery_edit kb_article_order_edit
kb_bill_show kb_expense_show monitoring_edit note_edit project_edit stock_edit task_edit
payroll_employee_show payroll_absence_show payroll_paystub_show
```

To grant less, set `BEXIO_SCOPES` in `.env` (it must contain `offline_access`). Bexio additionally limits every call to what the connected Bexio user may do.

## 2. Prepare the server

Requirements: a host with Docker, a DNS name pointing to it, and ports 80 and 443 reachable (Caddy obtains the TLS certificate automatically).

```bash
git clone https://github.com/monswyk/bexio-mcp-gateway.git
cd bexio-mcp-gateway

cp gateway.env.example .env
# edit .env: GATEWAY_DOMAIN and BEXIO_CLIENT_ID

./scripts/init-secrets.sh
```

`init-secrets.sh` asks for the Bexio client secret and creates:

| File | Content |
|------|---------|
| `secrets/bexio_client_secret` | Client secret of the Bexio app |
| `secrets/token_encryption_key` | AES-256 key that encrypts the stored Bexio tokens. **Back it up.** |
| `secrets/gateway_admin_key` | Password for the admin page (printed once) |
| `config/clients.json` | Client list, initially empty |

Start the stack:

```bash
docker compose up -d --build
docker compose logs -f bexio-mcp
```

If you already run a reverse proxy, remove the `caddy` service, publish port 8000 of `bexio-mcp` to it, and forward `https://<your-domain>` to it. Do not buffer responses: `/mcp` uses server-sent events.

## 3. Connect Bexio

1. Open `https://<your-domain>/admin`. Enter any user name and the admin key from `secrets/gateway_admin_key` as the password.
2. Keep the suggested label `backoffice` (or enter another one) and click **Connect with Bexio**.
3. Sign in at Bexio **as the user whose rights the AI should use**, then approve the consent screen.
4. The gateway confirms the connection. On `/admin` it is listed as `active` together with the Bexio company and user.

`https://<your-domain>/health` now reports `{"status":"ok"}`.

## 4. Add clients

For each Claude Desktop user:

```bash
./scripts/client-add.sh anna backoffice
```

The script prints the access key (`bmg_...`) **once**. Only its SHA-256 hash is stored in `config/clients.json`. The running gateway picks up the change within seconds; no restart is needed.

Hand the key to the user over a secure channel. Running the command again for the same name replaces the key.

To revoke a client, remove its entry from `config/clients.json` or set `"disabled": true`. Open sessions of that client are closed shortly afterwards.

```json
{
  "anna": { "keyHash": "sha256:…", "connection": "backoffice" },
  "beat": { "keyHash": "sha256:…", "connection": "backoffice", "disabled": true }
}
```

## 5. Configure Claude Desktop

Claude Desktop connects to remote servers through [`mcp-remote`](https://www.npmjs.com/package/mcp-remote), which needs [Node.js](https://nodejs.org/) on the user's machine. Edit `claude_desktop_config.json`:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "bexio": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://<your-domain>/mcp",
        "--header",
        "Authorization:${BEXIO_AUTH}"
      ],
      "env": {
        "BEXIO_AUTH": "Bearer bmg_your-access-key"
      }
    }
  }
}
```

The key goes through the `BEXIO_AUTH` environment variable because Claude Desktop on Windows mangles spaces inside `args`. Restart Claude Desktop after saving.

## Operations

**Audit log.** Every tool call is logged with client, connection, tool, duration and outcome (no arguments, no results):

```bash
docker compose logs bexio-mcp | grep AUDIT
```

**Reconnect.** If the admin page shows `reconnect required` (for example after the consent was revoked in Bexio, or the gateway was offline for more than a year), click **Reconnect** next to the connection. Clients keep their keys.

**Backup.** Back up the `bexio-data` volume (`connections.enc`), `secrets/token_encryption_key` and `config/clients.json`. Without the encryption key the stored login cannot be decrypted, and you have to connect again.

**Update.**

```bash
git pull
docker compose up -d --build
```

**Fewer tools.** `BEXIO_ENABLED_CATEGORIES` in `.env` limits which tool categories are registered, which makes Claude faster and more precise. Example: `contacts,invoices,quotes,orders,projects,timetracking`.

## Configuration reference

The container reads these environment variables. For the secret values, `NAME_FILE` pointing to a file works as well; `docker-compose.yml` uses this for the Docker secrets.

| Variable | Required | Default | Meaning |
|----------|----------|---------|---------|
| `PUBLIC_BASE_URL` | yes | | External URL, for example `https://bexio-mcp.example.ch` |
| `BEXIO_CLIENT_ID` | yes | | Client ID of the Bexio app |
| `BEXIO_CLIENT_SECRET` | yes | | Client secret of the Bexio app |
| `TOKEN_ENCRYPTION_KEY` | yes | | 64 hex characters (`openssl rand -hex 32`) |
| `GATEWAY_ADMIN_KEY` | yes | | Admin page password, at least 16 characters |
| `BEXIO_SCOPES` | no | see above | Space-separated scopes, must contain `offline_access` |
| `BEXIO_REDIRECT_URI` | no | `$PUBLIC_BASE_URL/oauth/callback` | Must match the Bexio app |
| `BEXIO_ENABLED_CATEGORIES` | no | all | Comma-separated tool categories |
| `DATA_DIR` | no | `/data` | Location of `connections.enc` |
| `MCP_CLIENTS_FILE` | no | `/config/clients.json` | Client list |
| `MCP_SESSION_TTL_MINUTES` | no | `60` | Idle MCP sessions are closed after this time |
| `PORT` / `HOST` | no | `8000` / `0.0.0.0` | Listen address |
