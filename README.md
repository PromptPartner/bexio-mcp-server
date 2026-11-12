# @promptpartner/bexio-mcp-server

Complete Swiss accounting integration for [Bexio](https://www.bexio.com/) via the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/). Works with **Claude Desktop**, **n8n**, and any MCP-compatible client.

Manage invoices, contacts, projects, time tracking, and 300+ more tools through AI conversation or workflow automation.

> ⚠️ **Early Release Software**
>
> This project is under active development. While it's functional and tested, you may encounter bugs or unexpected behavior. Features will continue to be added and improved over time. Please [report any issues](https://github.com/PromptPartner/bexio-mcp-server/issues) you find!

## Compatibility

| Client | Transport | Status |
|--------|-----------|--------|
| [Claude Desktop](https://claude.ai/download) | stdio | ✅ Fully supported |
| [n8n](https://n8n.io/) | HTTP | ✅ Fully supported |
| Other MCP clients | stdio/HTTP | ✅ Should work |

## Quick Start

### For Claude Desktop

**Option A: MCPB Bundle (Easiest)**

1. Download the latest `.mcpb` file from [GitHub Releases](https://github.com/PromptPartner/bexio-mcp-server/releases/latest)
2. Install it in Claude Desktop, either way works:
   - **Double-click** the `.mcpb` file (or drag it onto the Claude Desktop window), or
   - go to **Settings → Extensions → Advanced settings**, and under **Extension Developer** click **Install Extension…** and select the file
3. Enter your Bexio API token when prompted. It is stored in your operating system's keychain.
4. Optional: switch on **Interactive panels** in the extension's settings for invoice previews, contact cards and a dashboard.

No Node.js installation is needed: Claude Desktop runs extensions with its built-in Node.js.
Updating from 2.6.1 or older? Re-enter your token if Claude Desktop asks for it.

**Option B: npm (manual config)**

Requires [Node.js](https://nodejs.org/) (LTS). In Claude Desktop, open **Settings → Developer → Edit Config**
and add:

```json
{
  "mcpServers": {
    "bexio": {
      "command": "npx",
      "args": ["-y", "@promptpartner/bexio-mcp-server"],
      "env": {
        "BEXIO_API_TOKEN": "your-token-here"
      }
    }
  }
}
```

Config location:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Then **quit Claude Desktop completely and restart it**. Note that this file keeps your token in plain
text; the extension (Option A) stores it in the keychain instead.

### For n8n and Other HTTP Clients

Start the server in HTTP mode, with a bearer token:

```bash
BEXIO_API_TOKEN=your-token BEXIO_HTTP_TOKEN=$(openssl rand -hex 32) \
  npx @promptpartner/bexio-mcp-server --mode http --host 127.0.0.1 --port 8000
```

Clients then send `Authorization: Bearer <BEXIO_HTTP_TOKEN>` on every request (`GET /`,
the health check, stays open).

> **Security:** every tool reads or changes your books. Without `BEXIO_HTTP_TOKEN` the HTTP
> endpoints are unauthenticated: on `0.0.0.0` (the default) anyone who can reach the port
> can use them, and because CORS allows any origin, even a loopback-only server can be
> called by a web page open in your browser. The server warns at startup when no token is
> set. Local file paths (`upload_file` `file_path`, `download_file` `output_path`) are
> refused over HTTP unless `BEXIO_FILE_DIR` names a directory to confine them to.

The server exposes MCP over HTTP at `http://localhost:8000`. Configure your MCP client to connect to this endpoint.

### For Other stdio Clients

```bash
BEXIO_API_TOKEN=your-token npx @promptpartner/bexio-mcp-server
```

Or build from source:

```bash
git clone https://github.com/PromptPartner/bexio-mcp-server
cd bexio-mcp-server/src
npm install && npm run build
BEXIO_API_TOKEN=your-token node dist/index.js
```

## Getting Your Bexio API Token

1. Go to [developer.bexio.com](https://developer.bexio.com/)
2. Log in with your regular Bexio account
3. Navigate to **Personal Access Tokens**
4. Click **Create New Token**
5. Copy the token and use it in your configuration

## Features

This MCP server provides **315 tools** across all Bexio domains:

### Contacts & CRM
- Create, update, search contacts
- Contact groups, sectors, salutations, titles
- Contact relations management

### Invoices & Sales
- Full invoice lifecycle (create, issue, send, cancel)
- Quotes with accept/decline workflows
- Orders with delivery management
- Incoming payments tracking
- Interactive invoice preview (Claude Desktop)

### Banking & Payments
- Swiss QR-bill payment support (QR-IBAN)
- Standard IBAN payments (ISO 20022)
- Currency management (CHF, EUR)
- Bank account management

### Projects & Time Tracking
- Project management with types and statuses
- Milestones and work packages
- Timesheet entries with duration tracking
- Business activities and communication types

### Accounting
- Chart of accounts
- Manual journal entries, incl. group entries (Sammelbuchung: one voucher, many postings)
- Journal by date range and account; computed account balances (Saldenliste)
- Business years and VAT periods
- Account groups

### Purchase & Expenses
- Bills (creditor invoices)
- Expenses and purchase orders
- Outgoing payments

### Files & Documents
- Document upload/download; upload straight from a local file path (no base64 through the chat)
- File management

### Payroll (requires Bexio Payroll module)
- Employee management
- Absence tracking
- Payroll documents

## Examples

Here are some real-world examples of using the Bexio MCP server with Claude:

### Example 1: Finding Overdue Invoices

**Prompt:**
> "Show me all overdue invoices"

**What happens:**
Claude uses the `get_overdue_invoices` tool to query Bexio for all invoices past their due date.

**Response:**
> Found 3 overdue invoices:
>
> | Invoice # | Customer | Amount | Due Date | Days Overdue |
> |-----------|----------|--------|----------|--------------|
> | INV-2024-001 | Acme AG | CHF 2,450.00 | 2024-01-15 | 18 days |
> | INV-2024-003 | Tech GmbH | CHF 890.50 | 2024-01-20 | 13 days |
> | INV-2024-007 | Swiss Corp | CHF 5,200.00 | 2024-01-25 | 8 days |
>
> Total overdue: CHF 8,540.50

---

### Example 2: Creating an Invoice

**Prompt:**
> "Create an invoice for contact 'Sunrise AG' with two items: 10 hours of consulting at CHF 150/hour and a software license for CHF 500"

**What happens:**
Claude uses `find_contact_by_name` to locate the customer, then `create_invoice` with the specified line items.

**Response:**
> Created Invoice INV-2024-015 for Sunrise AG:
>
> - 10x Consulting Hours @ CHF 150.00 = CHF 1,500.00
> - 1x Software License @ CHF 500.00 = CHF 500.00
>
> Subtotal: CHF 2,000.00
> VAT (8.1%): CHF 162.00
> **Total: CHF 2,162.00**
>
> Invoice is in draft status. Say "issue invoice INV-2024-015" to finalize it.

---

### Example 3: Project Time Summary

**Prompt:**
> "How much time was logged on project 'Website Redesign' this month?"

**What happens:**
Claude uses `search_projects` to find the project, then `search_timesheets` to get time entries filtered by project and date range.

**Response:**
> Time logged on "Website Redesign" (January 2024):
>
> | Team Member | Hours | Activities |
> |-------------|-------|------------|
> | Anna M. | 24:30 | Design, Meetings |
> | Marco K. | 18:15 | Development |
> | Lisa B. | 8:00 | Content Writing |
>
> **Total: 50 hours 45 minutes**
>
> Budget used: 50.75 of 80 hours (63%)

---

### Example 4: Customer Revenue Report

**Prompt:**
> "What's my revenue from 'Tech Solutions GmbH' this year?"

**What happens:**
Claude uses `find_contact_by_name` to identify the customer, then `get_customer_revenue_report` to calculate total revenue from paid invoices.

**Response:**
> Revenue from Tech Solutions GmbH (2024):
>
> - Q1: CHF 12,450.00 (3 invoices)
> - Q2: CHF 8,200.00 (2 invoices)
> - Q3: CHF 15,800.00 (4 invoices)
> - Q4: CHF 6,500.00 (2 invoices, 1 pending)
>
> **Total paid: CHF 42,950.00**
> **Pending: CHF 3,200.00**

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BEXIO_API_TOKEN` | Yes* | - | Your Bexio API token (single company) |
| `BEXIO_API_TOKENS` | Yes* | - | Multiple companies — see [Multiple Companies](#multiple-companies-mandates) |
| `BEXIO_DEFAULT_COMPANY` | No | first | Which company is active at startup |
| `BEXIO_BASE_URL` | No | `https://api.bexio.com/2.0` | API endpoint URL |
| `BEXIO_ENABLED_CATEGORIES` | No | (all) | Comma-separated tool-category whitelist — see below |
| `BEXIO_READ_ONLY` | No | off | `1`/`true` registers only read-only tools; every write is refused — see below |
| `BEXIO_ALLOW_TOOLS` | No | - | With `BEXIO_READ_ONLY`, individual writes to allow back, by exact tool name |
| `BEXIO_DENY_TOOLS` | No | - | Tools refused by exact name, always, whatever else is configured — see below |
| `BEXIO_OAUTH_TOKEN_FILE` | No | - | JSON file holding an OAuth `access_token` and `refresh_token`; refreshed on 401 — see below |
| `BEXIO_OAUTH_CLIENT_ID` | With token file | - | Client ID of your app on developer.bexio.com |
| `BEXIO_OAUTH_CLIENT_SECRET` | With token file | - | Client secret of that app |
| `BEXIO_OAUTH_TOKEN_URL` | No | bexio's | Token endpoint, if you need to override it |
| `BEXIO_HTTP_TOKEN` | Recommended for HTTP | - | Bearer token required on every HTTP endpoint except `GET /` |
| `BEXIO_FILE_DIR` | No | - | Directory that `upload_file` `file_path` / `download_file` `output_path` are confined to. Required for local paths over HTTP; optional extra confinement over stdio |
| `BEXIO_DOWNLOAD_INLINE_MAX_BYTES` | No | `64000` | `download_file` returns files up to this size inline as base64; larger ones are written to disk |

\* Provide either `BEXIO_API_TOKEN` (one company) or `BEXIO_API_TOKENS` (several).

### Read-Only Mode

Every tool reads or changes your books, and the category whitelist filters by
domain — `invoices`, `contacts` and `accounting` each contain writes, so it
cannot express "reads only". Set `BEXIO_READ_ONLY` to register read-only tools
only:

```bash
BEXIO_READ_ONLY=1
```

Writes are refused at the server, not merely hidden: both the tool definitions
and their handlers are filtered, so a client that supplies a tool name itself
gets nothing back. The count registered is logged to stderr at startup.

The filter is an allowlist on each tool's `readOnlyHint` annotation, so a tool
without one is excluded. Note that it cannot be a denylist on
`destructiveHint`: `create_outgoing_payment`, for instance, is annotated
`destructiveHint: false` — in MCP terms it creates rather than destroys — and a
denylist would still expose it.

Useful when the token has write permissions you do not want an assistant to
reach, for reporting and analysis sessions, and as a way to try the server
against production books without risk.

To allow a few writes back, name them in `BEXIO_ALLOW_TOOLS`:

```bash
BEXIO_READ_ONLY=1
BEXIO_ALLOW_TOOLS=create_invoice,create_expense,create_contact,upload_file
```

Read-only alone is rarely what an integration needs; naming the exceptions
keeps the grant small enough to audit at a glance, and anything the server
gains in a later release is not in the list, so it is not reachable.

### OAuth Tokens — Refreshed Automatically

A Personal Access Token is static and needs none of this. An OAuth access
token does: bexio issues it for one hour, after which every call returns 401.

That is worth solving, because scopes exist only on the OAuth path. A PAT "has
all default scopes granted and therefore has full access to your company's
data" — there is no way to restrict one. An operator who wants the *token*
limited to, say, `kb_invoice_edit` and `contact_edit` has to use OAuth, and
without refresh that choice costs an interactive browser round trip every
hour. In practice nobody makes it.

Point the server at the file your authorization flow wrote:

```bash
BEXIO_OAUTH_TOKEN_FILE=/path/to/tokens.json   # { "access_token": "...", "refresh_token": "..." }
BEXIO_OAUTH_CLIENT_ID=...
BEXIO_OAUTH_CLIENT_SECRET=...
```

The access token is read from that file at startup, in preference to
`BEXIO_API_TOKEN`. On a 401 the server exchanges the refresh token, replays the
request once, and writes both tokens back to the file (mode 600) so the next
process starts live. Request the `offline_access` scope during authorization,
or bexio returns no refresh token.

Two details that are not obvious:

- **bexio rotates the refresh token on every exchange.** Refreshes are
  therefore single-flight: tool calls run in parallel, so an expiry mid-batch
  produces several 401s at once, and without the guard each would spend the
  refresh token while the later exchanges presented one that is no longer
  current.
- **Both the axios instance and the stored token are updated**, because the
  binary and multipart paths (PDF download, file upload) build their own
  headers and would otherwise keep presenting the expired one.

If the refresh itself fails — a revoked or expired refresh token — the error
says so and says to run the authorization flow again, rather than surfacing
the original 401, which only says "unauthorized".

### Refusing Individual Tools

`BEXIO_DENY_TOOLS` takes a comma-separated list of exact tool names and refuses
them, always, whatever else is configured. It is applied last and has the final
word; both the definition and the handler are dropped, so a client that
supplies the name itself gets `Tool <name> not found`.

```bash
BEXIO_DENY_TOOLS=send_invoice,mark_invoice_as_sent,create_outgoing_payment,create_manual_entry
```

This is for the common shape of an integration that needs most writes but must
never reach a few. An assistant that drafts invoices, books bills and files
expenses is useful; one that can send a document to a customer or initiate a
payment is a different proposition. Those acts are not reversible, and the
category whitelist cannot express them — `send_invoice` sits in the same domain
as `create_invoice`, and `create_outgoing_payment` in the same domain as
`create_bill`.

Pair it with `BEXIO_ENABLED_CATEGORIES` rather than relying on it alone: drop
whole domains you never want, so that tools added to them in later releases are
excluded without anyone editing a list, and name here only the ones inside the
domains you keep. A name that matches no tool refuses nothing, which is safe
but almost always a typo, so it is reported on stderr at startup along with the
names actually refused.

`BEXIO_READ_ONLY` with `BEXIO_ALLOW_TOOLS` expresses the opposite shape — reads
plus a short list of named exceptions — and is the better fit when the writes
you need are few enough to list.

### Reducing Token Budget — Category Whitelist

All tools are registered by default. For focused workflows or smaller models,
registering only a subset reduces the system-prompt token cost. Set
`BEXIO_ENABLED_CATEGORIES` to a comma-separated list:

```bash
BEXIO_ENABLED_CATEGORIES=contacts,invoices,purchase,banking,quotes,projects
```

Available categories: `reference`, `company`, `banking`, `projects`,
`timetracking`, `accounting`, `purchase`, `files`, `payroll`, `contacts`,
`invoices`, `orders`, `quotes`, `payments`, `reminders`, `deliveries`,
`items`, `reports`, `users`, `misc`, `notes`, `tasks`, `stock`, `docs`,
`positions`. Unknown names are ignored (logged to stderr); empty/unset = all
enabled (backward compatible).

## Multiple Companies (Mandates)

Bexio binds each API token to a **single company (mandate)** — there is no token that
spans companies. To work with several companies, generate one token per company (switch
to that company in Bexio first, then Settings → API Tokens), and configure them all on a
**single** server instance. Two new tools — `list_companies` and `select_company` — let
you switch the active company in conversation ("in Globex, list open invoices"). This
avoids running one server per company and the duplicated tool-context that comes with it.

Set `BEXIO_API_TOKENS` instead of (or alongside) `BEXIO_API_TOKEN`, as a comma-separated
list of `label:token` pairs (or a JSON object). `BEXIO_DEFAULT_COMPANY` picks the company
active at startup (defaults to the first):

```json
{
  "mcpServers": {
    "bexio": {
      "command": "npx",
      "args": ["@promptpartner/bexio-mcp-server"],
      "env": {
        "BEXIO_API_TOKENS": "Acme:token-for-acme,Globex:token-for-globex",
        "BEXIO_DEFAULT_COMPANY": "Acme"
      }
    }
  }
}
```

Then just ask Claude things like *"switch to Globex and show this month's invoices."*
`list_companies` shows the configured companies and which one is active; in
multi-company mode each response also notes the `active_company` so it's always clear
which company a result came from. Tokens are never logged or returned. The two control
tools appear only when `BEXIO_API_TOKENS` is set, so single-company setups are unchanged.

> **HTTP/n8n note:** the active company is process-global. For concurrent multi-tenant
> HTTP deployments, run one instance per company instead.

## Command Line Options

```bash
npx @promptpartner/bexio-mcp-server [options]

Options:
  --mode <stdio|http>  Transport mode (default: stdio)
  --host <address>     HTTP host (default: 0.0.0.0)
  --port <number>      HTTP port (default: 8000)
```

## Troubleshooting

### "Invalid API token" error
- Verify your token at [developer.bexio.com](https://developer.bexio.com/) > Personal Access Tokens
- Ensure the token has not expired
- Check that the token has the required permissions

### "Connection refused" error
- Check your internet connection
- Verify BEXIO_BASE_URL is correct (default: https://api.bexio.com/2.0)

### Payroll tools return "module not available"
- Payroll tools require the Bexio Payroll module subscription
- Contact Bexio support to enable the module

### Claude Desktop doesn't see the server
- Quit Claude Desktop completely (not just the window) and restart it after configuration changes
- Check that it is connected: click **+** in the message box → **Connectors** → **Manage connectors**
- For the JSON config: check the file path for your OS and that the JSON is valid
- Check the logs: `~/Library/Logs/Claude/mcp-server-*.log` (macOS) or `%APPDATA%\Claude\logs` (Windows)

## Privacy Policy

This MCP server acts as a pass-through to the Bexio API and does not store any data. For full details, see our [Privacy Policy](PRIVACY.md).

Your data is processed according to [Bexio's Privacy Policy](https://www.bexio.com/en-CH/privacy-policy).

## Support

- **Issues & Bug Reports:** [GitHub Issues](https://github.com/PromptPartner/bexio-mcp-server/issues)
- **Email:** lukas@promptpartner.ai

## Support the Project

If this project saves you time or helps your business, consider buying me a coffee! ☕

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-support-yellow?style=flat&logo=buy-me-a-coffee)](https://buymeacoffee.com/lukashertig)

Your support helps keep this project maintained and improved!

## Author

Created by [Lukas Hertig](https://linkedin.com/in/lukashertig) from [PromptPartner.ai](https://promptpartner.ai)

## Acknowledgments

This project builds upon the original Bexio MCP server created by [Sebastian Bryner](https://www.linkedin.com/in/sebastian-bryner/) of [bryner.tech](https://bryner.tech/). His v1.0 implementation provided the foundational architecture and initial 83 tools that made this expanded v2.0 possible.

### Development Tools

The expansion from 83 to 314 tools was developed using:

- **[GSD Framework](https://github.com/casualjim/get-shit-done)** - The "Get Shit Done" planning framework for structured AI-assisted development workflows

These tools helped transform a 4-weeks estimated project into a 2-days reality, demonstrating the potential of AI-augmented software development.

## Disclaimer

This is an independent, community-driven project and is **not affiliated with, endorsed by, or officially connected to Bexio AG** in any way. "Bexio" is a trademark of Bexio AG. This project simply provides an integration layer to the publicly available Bexio API.

Use of this software is at your own risk. The authors are not responsible for any issues arising from its use with your Bexio account.

## License

MIT - See [LICENSE](LICENSE) for details.

## Star History

<a href="https://www.star-history.com/?repos=promptpartner%2Fbexio-mcp-server&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=promptpartner/bexio-mcp-server&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=promptpartner/bexio-mcp-server&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=promptpartner/bexio-mcp-server&type=date&legend=top-left" />
 </picture>
</a>

## Links

- [Bexio API Documentation](https://docs.bexio.com/)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [PromptPartner.ai](https://promptpartner.ai)
