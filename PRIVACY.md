# Privacy Policy

**@promptpartner/bexio-mcp-server**

Last updated: February 2, 2026

## Overview

This MCP (Model Context Protocol) server acts as a pass-through integration between MCP clients (such as Claude Desktop, n8n, or other compatible applications) and the Bexio API. It does not collect, store, or process personal data independently.

## Data Handling

### What This Server Does

- **Pass-through only**: All requests are forwarded directly to the Bexio API and responses are returned to the MCP client
- **No data storage**: The server does not store, log, or retain any business data, personal information, or API responses
- **No analytics**: The server does not collect usage analytics or telemetry
- **No third-party sharing**: Data is only transmitted between your MCP client and Bexio's API

### API Token

- Your Bexio API token is used solely for authenticating requests to the Bexio API
- The token is stored only in your local configuration (Claude Desktop config, environment variables, or MCP client settings)
- The token is transmitted to Bexio's servers as required for API authentication
- The server does not log, store, or transmit your token to any other party

### Data Processed

When you use this server, the following data may be transmitted to Bexio:

- Contact information (names, addresses, emails, phone numbers)
- Financial data (invoices, quotes, orders, payments)
- Project and time tracking information
- Business documents and files
- Any other data you access or modify through Bexio's API

This data is processed according to [Bexio's Privacy Policy](https://www.bexio.com/en-CH/privacy-policy).

## Open Source

This server is open source software licensed under the MIT License. You can review the complete source code at:

https://github.com/promptpartner/bexio-mcp-server

## Third-Party Services

This server connects to:

- **Bexio API** (https://api.bexio.com) - Your accounting data is processed according to [Bexio's Privacy Policy](https://www.bexio.com/en-CH/privacy-policy) and [Terms of Service](https://www.bexio.com/en-CH/terms-and-conditions)

## Your Rights

Since this server does not store personal data, data subject requests (access, deletion, etc.) should be directed to:

- **Bexio**: For data stored in your Bexio account - contact Bexio support or use their platform's data management features
- **Your MCP Client**: For locally stored configuration - manage through your client's settings

## Contact

For questions about this privacy policy or the MCP server:

- **GitHub Issues**: https://github.com/promptpartner/bexio-mcp-server/issues
- **Email**: lukas@promptpartner.ai

## Changes

We may update this privacy policy from time to time. Changes will be posted to this repository with an updated "Last updated" date.
