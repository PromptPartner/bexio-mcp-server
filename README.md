# @promptpartner/bexio-mcp-server

Complete Swiss accounting integration for [Bexio](https://www.bexio.com/) via the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/). Works with **Claude Desktop**, **n8n**, and any MCP-compatible client.

Manage invoices, contacts, projects, time tracking, and 200+ more tools through AI conversation or workflow automation.

> ⚠️ **Early Release Software**
>
> This project is under active development. While it's functional and tested, you may encounter bugs or unexpected behavior. Features will continue to be added and improved over time. Please [report any issues](https://github.com/promptpartner/bexio-mcp-server/issues) you find!

## Compatibility

| Client | Transport | Status |
|--------|-----------|--------|
| [Claude Desktop](https://claude.ai/download) | stdio | ✅ Fully supported |
| [n8n](https://n8n.io/) | HTTP | ✅ Fully supported |
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | stdio | ✅ Fully supported |
| Other MCP clients | stdio/HTTP | ✅ Should work |

## Quick Start

### For Claude Desktop

**Option A: MCPB Bundle (Easiest)**

1. Download the latest `.mcpb` file from [GitHub Releases](https://github.com/promptpartner/bexio-mcp-server/releases/latest)
2. In Claude Desktop, go to **Settings → Extensions**
3. Install the extension using one of these methods:
   - **Double-click** the downloaded `.mcpb` file, or
   - **Drag and drop** the file onto the Extensions window, or
   - Click **Advanced Settings → Install Extension** and select the file
4. Enter your Bexio API token when prompted

**Option B: npm**

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "bexio": {
      "command": "npx",
      "args": ["@promptpartner/bexio-mcp-server"],
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

### For n8n and Other HTTP Clients

Start the server in HTTP mode:

```bash
BEXIO_API_TOKEN=your-token npx @promptpartner/bexio-mcp-server --mode http --port 8000
```

The server exposes MCP over HTTP at `http://localhost:8000`. Configure your MCP client to connect to this endpoint.

### For Other stdio Clients

```bash
BEXIO_API_TOKEN=your-token npx @promptpartner/bexio-mcp-server
```

Or build from source:

```bash
git clone https://github.com/promptpartner/bexio-mcp-server
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

This MCP server provides **221 tools** across all Bexio domains:

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
- Manual journal entries
- Business years and VAT periods
- Account groups

### Purchase & Expenses
- Bills (creditor invoices)
- Expenses and purchase orders
- Outgoing payments

### Files & Documents
- Document upload/download
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
Claude uses `find_contact_by_name` to identify the customer, then `get_revenue_by_customer` to calculate total revenue from paid invoices.

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
| `BEXIO_API_TOKEN` | Yes | - | Your Bexio API token |
| `BEXIO_BASE_URL` | No | `https://api.bexio.com/2.0` | API endpoint URL |

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
- Restart Claude Desktop after configuration changes
- Verify the config file path is correct for your OS
- Check Claude Desktop logs for error messages

## Privacy Policy

This MCP server acts as a pass-through to the Bexio API and does not store any data. For full details, see our [Privacy Policy](PRIVACY.md).

Your data is processed according to [Bexio's Privacy Policy](https://www.bexio.com/en-CH/privacy-policy).

## Support

- **Issues & Bug Reports:** [GitHub Issues](https://github.com/promptpartner/bexio-mcp-server/issues)
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

The v2.0 expansion from 83 to 221 tools was developed using:

- **[Claude Code](https://docs.anthropic.com/en/docs/claude-code)** - Anthropic's AI-powered development environment that enabled rapid iteration and comprehensive API coverage
- **[GSD Framework](https://github.com/casualjim/get-shit-done)** - The "Get Shit Done" planning framework for structured AI-assisted development workflows

These tools helped transform a 4-day estimated project into a 2-hour reality, demonstrating the potential of AI-augmented software development.

## Disclaimer

This is an independent, community-driven project and is **not affiliated with, endorsed by, or officially connected to Bexio AG** in any way. "Bexio" is a trademark of Bexio AG. This project simply provides an integration layer to the publicly available Bexio API.

Use of this software is at your own risk. The authors are not responsible for any issues arising from its use with your Bexio account.

## License

MIT - See [LICENSE](LICENSE) for details.

## Links

- [Bexio API Documentation](https://docs.bexio.com/)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [PromptPartner.ai](https://promptpartner.ai)
