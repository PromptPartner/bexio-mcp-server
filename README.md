# @promptpartner/bexio-mcp-server

Complete Swiss accounting integration for [Bexio](https://www.bexio.com/) with [Claude Desktop](https://claude.com/desktop). Manage invoices, contacts, projects, time tracking, and 200+ more tools through natural conversation.

## Quick Start

### Option 1: MCPB Bundle (Recommended)

1. Download `bexio-mcp-server.mcpb` from [Releases](https://github.com/promptpartner/bexio-mcp-server/releases)
2. Double-click to install in Claude Desktop
3. Enter your Bexio API token when prompted

### Option 2: npm

```bash
npx @promptpartner/bexio-mcp-server
```

Add to Claude Desktop config:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

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

### Option 3: From Source

```bash
git clone https://github.com/promptpartner/bexio-mcp-server
cd bexio-mcp-server/src
npm install
npm run build
```

Add to Claude Desktop config:

```json
{
  "mcpServers": {
    "bexio": {
      "command": "node",
      "args": ["/path/to/bexio-mcp-server/src/dist/index.js"],
      "env": {
        "BEXIO_API_TOKEN": "your-token-here"
      }
    }
  }
}
```

## Getting Your Bexio API Token

1. Log in to [Bexio](https://office.bexio.com/)
2. Go to **Settings** > **API Tokens**
3. Click **Create Token**
4. Copy the token and use it in your configuration

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
- Interactive invoice preview

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

## HTTP Mode

For integration with n8n or other automation tools:

```bash
npx @promptpartner/bexio-mcp-server --mode http --port 8000
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BEXIO_API_TOKEN` | Yes | - | Your Bexio API token |
| `BEXIO_BASE_URL` | No | `https://api.bexio.com/2.0` | API endpoint URL |

## Troubleshooting

### "Invalid API token" error
- Verify your token in Bexio Settings > API Tokens
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

## License

MIT - See [LICENSE](LICENSE) for details.

## Links

- [Bexio API Documentation](https://docs.bexio.com/)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [Report Issues](https://github.com/promptpartner/bexio-mcp-server/issues)
