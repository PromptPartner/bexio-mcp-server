# bexio-mcp-gateway

One container that lets several Claude Desktop users work with [Bexio](https://www.bexio.com/) through the [Model Context Protocol](https://modelcontextprotocol.io/).

An admin signs in to Bexio once in the browser. After that the gateway refreshes the login in the background. Each person gets their own access key. Personal Access Tokens are not used: they expire after 60 days, must not be shared, and always have full rights.

This is a fork of [promptpartner/bexio-mcp-server](https://github.com/promptpartner/bexio-mcp-server). It is not affiliated with bexio AG.

```
Claude Desktop (anna) ─┐                         ┌──────────────────────────┐
Claude Desktop (beat) ─┼─ HTTPS + access key ──▶ │  /mcp                    │── OAuth ──▶ Bexio API
                       │                         │  connection "backoffice" │
                       └                         └──────────────────────────┘
```

- A **connection** is one Bexio login, for example the shared `backoffice` user. Several clients can share it. A later Bexio user is another connection.
- A **client** is one Claude Desktop installation. Its access key is stored only as a SHA-256 hash. Adding or revoking a client does not need a restart.

## Deploy with Coolify

Coolify builds the `Dockerfile` on `master` and terminates HTTPS. Point a domain at the Coolify proxy, then:

1. Create an app on [developer.bexio.com](https://developer.bexio.com). Set the redirect URL to `https://<your-domain>/oauth/callback`. Copy the client ID and client secret.
2. In Coolify, set the build pack to **Dockerfile**, the branch to `master`, and **Ports Exposes** to a free port on that server (for example `3091`).
3. Add persistent storage mounted at `/data`. The Bexio login and the client list live there. Without this volume a redeploy forgets both.
4. Set these variables and mark them **Available at Runtime**:

| Variable | Value |
|----------|--------|
| `PUBLIC_BASE_URL` | `https://<your-domain>` |
| `BEXIO_CLIENT_ID` | from the Bexio app |
| `BEXIO_CLIENT_SECRET` | from the Bexio app |
| `TOKEN_ENCRYPTION_KEY` | `openssl rand -hex 32` — back this up |
| `GATEWAY_ADMIN_KEY` | password for `/admin`, at least 16 characters |
| `PORT` | the same port as **Ports Exposes** |
| `MCP_CLIENTS_FILE` | `/data/clients.json` |

`TOKEN_ENCRYPTION_KEY` encrypts the stored Bexio login. Lose it and the connection has to be created again.

5. Deploy. `https://<your-domain>/health` answers `{"status":"degraded"}` until a Bexio connection exists, then `{"status":"ok"}`.

A Docker Compose file with its own Caddy proxy is also in the repo. See [docs/docker.md](docs/docker.md) if you are not using Coolify.

## Connect Bexio

Open `https://<your-domain>/admin`. The user name can be anything; the password is `GATEWAY_ADMIN_KEY`.

Enter a label (`backoffice` is filled in when nothing is connected yet) and choose **Connect with Bexio**. Sign in as the Bexio user whose permissions the tools should have, then approve the consent screen. The row shows `active` together with the company and the user.

The gateway requests the scopes the tools need. Payroll scopes are read-only. Narrow them with `BEXIO_SCOPES` (the list must contain `offline_access`). Bexio still enforces what that user is allowed to do.

## Add a Claude Desktop user

In the Coolify terminal of the running container:

```bash
node dist/cli/client-add.js anna backoffice --file /data/clients.json
```

The command prints the access key (`bmg_…`) once. Running it again for the same name replaces the key. To revoke someone, delete their entry in `/data/clients.json` or set `"disabled": true`.

On the user's machine, [Node.js](https://nodejs.org/) must be installed. Claude Desktop reaches the gateway through [`mcp-remote`](https://www.npmjs.com/package/mcp-remote). Edit `claude_desktop_config.json`:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

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
        "BEXIO_AUTH": "Bearer bmg_the-access-key"
      }
    }
  }
}
```

The key is passed through `BEXIO_AUTH` because Claude Desktop on Windows breaks spaces inside `args`. Restart Claude Desktop after saving.

## Operations

Every tool call is written to the container log as one JSON line, with client, connection, tool, duration and outcome. Arguments and results are not logged.

If `/admin` shows `reconnect required`, use **Reconnect** on that row. Client keys stay valid. This happens when consent was revoked in Bexio, or when the gateway was offline for more than a year (the refresh token then expires).

Back up the `/data` volume and `TOKEN_ENCRYPTION_KEY`.

`BEXIO_ENABLED_CATEGORIES` limits which tool groups are registered, which keeps Claude faster. Example: `contacts,invoices,quotes,orders,projects,timetracking`. Known groups: `reference`, `company`, `banking`, `projects`, `timetracking`, `accounting`, `purchase`, `files`, `payroll`, `contacts`, `invoices`, `orders`, `quotes`, `payments`, `reminders`, `deliveries`, `items`, `reports`, `users`, `misc`, `notes`, `tasks`, `stock`, `docs`, `positions`.

## Single-user mode

`stdio` and `http` from the original project still start when `MCP_MODE` is not `gateway`. They use `BEXIO_API_TOKEN` instead of OAuth. The company-switch tools are available only in that mode.

## Credits

- Original server: [promptpartner/bexio-mcp-server](https://github.com/promptpartner/bexio-mcp-server) by [Lukas Hertig](https://promptpartner.ai), building on [Sebastian Bryner](https://bryner.tech/).
- API fixes carried over from [abteilung/bexio-mcp-server](https://github.com/abteilung/bexio-mcp-server) and [Fabrik4/bexio-mcp](https://github.com/Fabrik4/bexio-mcp).
- OAuth design adapted from [asig/bexio-mcp-server](https://github.com/asig/bexio-mcp-server) (MIT).

## License

[MIT](LICENSE). Use of this software is at your own risk. The authors are not responsible for issues arising from its use with a Bexio account. "Bexio" is a trademark of Bexio AG.
