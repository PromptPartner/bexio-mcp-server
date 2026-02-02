# Phase 5: UI & Packaging - Research

**Researched:** 2026-02-01
**Domain:** MCP Apps Extension (UI), MCPB Bundle Distribution, npm Publishing
**Confidence:** MEDIUM (MCP Apps is new but production-ready; MCPB well-documented)

## Summary

Phase 5 encompasses three distinct deliverables:
1. **MCP Apps UI** - Interactive HTML interfaces rendered inline in Claude conversations
2. **MCPB Bundle** - One-click installation package for Claude Desktop
3. **npm Package** - Publishable package for `npx @bexio/mcp-server` execution

MCP Apps (SEP-1865) is now production-ready and officially supported by Claude, Claude Desktop, VS Code Insiders, and other hosts. The extension enables MCP servers to return interactive UIs (dashboards, forms, visualizations) that render in sandboxed iframes within the conversation.

MCPB is the standardized distribution format for local MCP servers, enabling double-click installation in Claude Desktop. The format is spiritually similar to Chrome extensions (.crx) or VS Code extensions (.vsix).

**Primary recommendation:** Implement MCP Apps using `@modelcontextprotocol/ext-apps` SDK for UI resources, bundle with MCPB CLI for distribution, and configure package.json for npx execution.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @modelcontextprotocol/ext-apps | ^1.0.1 | MCP Apps SDK (server + client) | Official SDK for UI resources and bidirectional communication |
| @anthropic-ai/mcpb | latest | MCPB CLI tooling | Official CLI for bundle creation and validation |
| vite | ^6.0.0 | UI bundling | Recommended by MCP Apps docs for single-file HTML output |
| vite-plugin-singlefile | ^3.0.0 | Inline all assets | Bundles JS/CSS into single HTML for resource serving |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| typescript | ^5.5.0 | Already in project | Build UI TypeScript code |
| tsx | ^4.0.0 | Already in project | Development mode for UI |
| concurrently | ^8.0.0 | Dev workflow | Run server + UI watch in parallel |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vite single-file | esbuild + custom script | Vite is recommended pattern, better DX |
| Inline HTML resources | External URL hosting | Inline is more portable, no CORS issues |
| React/Vue for UI | Vanilla TypeScript | Project already TS-only; vanilla simpler for 3 small templates |

**Installation:**
```bash
npm install @modelcontextprotocol/ext-apps vite vite-plugin-singlefile concurrently -D
npm install -g @anthropic-ai/mcpb
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── index.ts               # Entry point (unchanged)
├── server.ts              # Add UI resource registration
├── tools/                 # Existing tool modules
├── shared/                # Existing shared utils
└── ui/                    # NEW: MCP Apps UI resources
    ├── invoice-preview/
    │   ├── invoice-preview.html     # HTML entry point
    │   └── mcp-app.ts               # App client logic
    ├── contact-card/
    │   ├── contact-card.html
    │   └── mcp-app.ts
    └── dashboard/                    # Optional UI-04
        ├── dashboard.html
        └── mcp-app.ts
dist/
├── index.js               # Compiled server
└── ui/                    # Bundled HTML files
    ├── invoice-preview.html
    ├── contact-card.html
    └── dashboard.html
```

### Pattern 1: UI Resource Registration

**What:** Declare UI resources using the `ui://` URI scheme and link tools to them via `_meta.ui.resourceUri`

**When to use:** Every tool that should render an interactive UI

**Example:**
```typescript
// Source: https://modelcontextprotocol.io/docs/extensions/apps
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  registerAppTool,
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import fs from "node:fs/promises";
import path from "node:path";

const server = new McpServer({ name: "bexio-mcp-server", version: "2.0.0" });

// UI resource URI using ui:// scheme
const invoicePreviewUri = "ui://invoice-preview/mcp-app.html";

// Register tool with UI metadata
registerAppTool(
  server,
  "preview_invoice",
  {
    title: "Preview Invoice",
    description: "Display interactive invoice preview",
    inputSchema: {
      type: "object",
      properties: { invoice_id: { type: "integer" } },
      required: ["invoice_id"],
    },
    _meta: { ui: { resourceUri: invoicePreviewUri } },
  },
  async (args) => {
    const invoice = await getInvoice(args.invoice_id);
    return {
      content: [{ type: "text", text: JSON.stringify(invoice) }],
    };
  },
);

// Register resource handler
registerAppResource(
  server,
  invoicePreviewUri,
  invoicePreviewUri,
  { mimeType: RESOURCE_MIME_TYPE },
  async () => {
    const html = await fs.readFile(
      path.join(import.meta.dirname, "dist/ui/invoice-preview.html"),
      "utf-8"
    );
    return {
      contents: [{ uri: invoicePreviewUri, mimeType: RESOURCE_MIME_TYPE, text: html }],
    };
  },
);
```

### Pattern 2: UI Client (HTML Template)

**What:** HTML with embedded TypeScript that communicates with the host via the App class

**When to use:** Every MCP App UI template

**Example:**
```html
<!-- Source: https://modelcontextprotocol.io/docs/extensions/apps -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice Preview</title>
  <style>
    /* Inline styles for self-contained bundle */
    .invoice { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; margin-bottom: 2rem; }
    .line-items { width: 100%; border-collapse: collapse; }
    .line-items th, .line-items td { padding: 0.5rem; border-bottom: 1px solid #eee; }
    .total { font-weight: bold; text-align: right; margin-top: 1rem; }
  </style>
</head>
<body>
  <div id="app" class="invoice">Loading...</div>
  <script type="module" src="/src/ui/invoice-preview/mcp-app.ts"></script>
</body>
</html>
```

```typescript
// src/ui/invoice-preview/mcp-app.ts
import { App } from "@modelcontextprotocol/ext-apps";

interface Invoice {
  id: number;
  document_nr: string;
  title: string;
  contact: { name_1: string; mail?: string };
  positions: Array<{ text: string; amount: number; unit_price: number }>;
  total_gross: number;
  currency_id: string;
  is_valid_from: string;
  is_valid_until: string;
  kb_item_status_id: number;
}

const appEl = document.getElementById("app")!;

const app = new App({ name: "Invoice Preview", version: "1.0.0" });

// Handle initial tool result
app.ontoolresult = (result) => {
  const text = result.content?.find((c) => c.type === "text")?.text;
  if (text) {
    const invoice = JSON.parse(text) as Invoice;
    renderInvoice(invoice);
  }
};

app.connect();

function renderInvoice(invoice: Invoice) {
  appEl.innerHTML = `
    <div class="header">
      <div>
        <h1>Invoice ${invoice.document_nr}</h1>
        <p>${invoice.title}</p>
      </div>
      <div>
        <p><strong>To:</strong> ${invoice.contact.name_1}</p>
        <p>${invoice.contact.mail || ""}</p>
      </div>
    </div>
    <table class="line-items">
      <thead><tr><th>Description</th><th>Qty</th><th>Price</th><th>Amount</th></tr></thead>
      <tbody>
        ${invoice.positions.map(p => `
          <tr>
            <td>${p.text}</td>
            <td>${p.amount}</td>
            <td>${p.unit_price.toFixed(2)}</td>
            <td>${(p.amount * p.unit_price).toFixed(2)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
    <div class="total">
      Total: ${invoice.currency_id} ${invoice.total_gross.toFixed(2)}
    </div>
  `;
}
```

### Pattern 3: MCPB Manifest Structure

**What:** manifest.json defining bundle metadata, server configuration, and user settings

**When to use:** Creating the .mcpb distribution bundle

**Example:**
```json
{
  "name": "bexio-mcp-server",
  "version": "2.0.0",
  "description": "Connect Claude to your Bexio accounting system",
  "author": "Your Name",
  "homepage": "https://github.com/yourorg/bexio-mcp-server",
  "icon": "icon.png",
  "server": {
    "type": "node",
    "entry_point": "dist/index.js"
  },
  "mcp_config": {
    "command": "node",
    "args": ["dist/index.js"],
    "env": {
      "BEXIO_API_TOKEN": "${user_config.api_token}"
    }
  },
  "user_config": {
    "api_token": {
      "type": "string",
      "title": "Bexio API Token",
      "description": "Your Bexio API token from Settings > API Tokens",
      "required": true,
      "secret": true
    }
  },
  "compatibility": {
    "platforms": ["darwin", "win32"],
    "node_version": ">=18.0.0"
  },
  "tools": [
    {
      "name": "list_invoices",
      "description": "List invoices from Bexio",
      "annotations": {
        "readOnlyHint": true
      }
    }
  ]
}
```

### Pattern 4: npm Package for npx

**What:** package.json configuration enabling `npx @bexio/mcp-server` execution

**When to use:** npm publishing for global CLI access

**Example:**
```json
{
  "name": "@bexio/mcp-server",
  "version": "2.0.0",
  "description": "MCP server for Bexio accounting integration",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "bexio-mcp-server": "dist/index.js"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "tsc && npm run build:ui",
    "build:ui": "vite build",
    "prepublishOnly": "npm run build"
  }
}
```

Entry point must have shebang:
```typescript
#!/usr/bin/env node
// dist/index.js - compiled from src/index.ts
```

### Anti-Patterns to Avoid

- **Serving UI from external URLs:** MCP Apps should embed HTML in the resource response, not link externally. External URLs require CORS and may not work offline.

- **Omitting `_meta.ui.resourceUri` on tools:** Without this metadata, hosts cannot preload or render the UI when the tool is called.

- **Using `console.log` in UI code for debugging:** The sandboxed iframe has limited console access. Use `app.log()` from the App class instead.

- **Including secrets in manifest.json:** Never hardcode API tokens. Use `user_config` with `secret: true` for Claude Desktop to prompt securely.

- **Bundling unnecessary node_modules in MCPB:** Only production dependencies should be included. Run `npm install --production` before packing.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| UI-host communication | postMessage + JSON-RPC manually | `App` class from ext-apps | Handles connection, tool calls, logging correctly |
| HTML bundling | Manual inline scripts | vite-plugin-singlefile | Handles assets, minification, CSP correctly |
| Bundle creation | Manual ZIP + manifest | `mcpb pack` | Validates manifest, handles structure correctly |
| Tool-UI linking | Custom metadata format | `_meta.ui.resourceUri` | Standard understood by all compliant hosts |

**Key insight:** MCP Apps defines a precise protocol for UI-host communication. Hand-rolling the postMessage protocol will likely miss edge cases around connection timing, result handling, and error propagation.

## Common Pitfalls

### Pitfall 1: UI Resource Not Found at Runtime

**What goes wrong:** Server registers `ui://invoice-preview/mcp-app.html` but file doesn't exist at `dist/ui/invoice-preview.html`
**Why it happens:** Build process doesn't match resource handler path expectations
**How to avoid:**
- Build UI files to predictable paths (`dist/ui/<name>.html`)
- Use `import.meta.dirname` for path resolution (not `__dirname` in ESM)
- Test resource fetch locally before deployment
**Warning signs:** Empty or error responses when host requests UI resource

### Pitfall 2: MCPB Bundle Missing Dependencies

**What goes wrong:** Bundle works locally but fails on user machines
**Why it happens:** `node_modules` not included or wrong dependencies bundled
**How to avoid:**
- Run `npm install --production` before `mcpb pack`
- Test bundle in fresh environment (different machine/user)
- Use Node.js (ships with Claude Desktop) not Python
**Warning signs:** "Cannot find module" errors in Claude Desktop logs

### Pitfall 3: npx Execution Fails Without Shebang

**What goes wrong:** `npx @bexio/mcp-server` fails with permission denied or wrong interpreter
**Why it happens:** Entry point missing `#!/usr/bin/env node` shebang
**How to avoid:**
- Add shebang as first line of `src/index.ts`
- Verify `dist/index.js` has shebang after compilation
- Build script should preserve shebang
**Warning signs:** Works with `node dist/index.js` but not `npx`

### Pitfall 4: UI Not Rendering in Host

**What goes wrong:** Tool returns data but no UI appears
**Why it happens:** Host doesn't support MCP Apps or extension not negotiated
**How to avoid:**
- Declare `io.modelcontextprotocol/ui` extension capability
- Check host compatibility (Claude, Claude Desktop, VS Code Insiders support it)
- Verify `_meta.ui.resourceUri` is set on tool definition
**Warning signs:** Tool result shown as text instead of interactive UI

### Pitfall 5: User Config Not Prompting

**What goes wrong:** MCPB installs but doesn't ask for API token
**Why it happens:** `user_config` schema invalid or `mcp_config.env` doesn't reference it
**How to avoid:**
- Validate manifest with `mcpb validate`
- Use `${user_config.field_name}` syntax in env
- Mark required fields as `required: true`
**Warning signs:** Server starts but fails with missing credentials

## Code Examples

Verified patterns from official sources:

### Server-Side UI Registration (Complete)

```typescript
// Source: https://modelcontextprotocol.io/docs/extensions/apps
// src/server.ts - additions for MCP Apps support

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  registerAppTool,
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import fs from "node:fs/promises";
import path from "node:path";

export function registerUIResources(server: McpServer, client: BexioClient) {
  const uiBasePath = path.join(import.meta.dirname, "ui");

  // Invoice Preview UI
  const invoiceUri = "ui://bexio/invoice-preview.html";

  registerAppTool(server, "preview_invoice", {
    title: "Preview Invoice",
    description: "Display interactive invoice preview with line items and totals",
    inputSchema: {
      type: "object",
      properties: { invoice_id: { type: "integer" } },
      required: ["invoice_id"],
    },
    _meta: { ui: { resourceUri: invoiceUri } },
  }, async (args) => {
    const invoice = await client.getInvoice(args.invoice_id as number);
    return { content: [{ type: "text", text: JSON.stringify(invoice) }] };
  });

  registerAppResource(server, invoiceUri, invoiceUri,
    { mimeType: RESOURCE_MIME_TYPE },
    async () => {
      const html = await fs.readFile(path.join(uiBasePath, "invoice-preview.html"), "utf-8");
      return { contents: [{ uri: invoiceUri, mimeType: RESOURCE_MIME_TYPE, text: html }] };
    }
  );

  // Contact Card UI
  const contactUri = "ui://bexio/contact-card.html";

  registerAppTool(server, "show_contact_card", {
    title: "Show Contact Card",
    description: "Display formatted contact information card",
    inputSchema: {
      type: "object",
      properties: { contact_id: { type: "integer" } },
      required: ["contact_id"],
    },
    _meta: { ui: { resourceUri: contactUri } },
  }, async (args) => {
    const contact = await client.getContact(args.contact_id as number);
    return { content: [{ type: "text", text: JSON.stringify(contact) }] };
  });

  registerAppResource(server, contactUri, contactUri,
    { mimeType: RESOURCE_MIME_TYPE },
    async () => {
      const html = await fs.readFile(path.join(uiBasePath, "contact-card.html"), "utf-8");
      return { contents: [{ uri: contactUri, mimeType: RESOURCE_MIME_TYPE, text: html }] };
    }
  );
}
```

### Vite Configuration for UI Bundling

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    outDir: "dist/ui",
    rollupOptions: {
      input: {
        "invoice-preview": "src/ui/invoice-preview/invoice-preview.html",
        "contact-card": "src/ui/contact-card/contact-card.html",
        "dashboard": "src/ui/dashboard/dashboard.html",
      },
    },
  },
});
```

### Complete manifest.json for MCPB

```json
{
  "name": "bexio-mcp-server",
  "version": "2.0.0",
  "description": "Connect Claude Desktop to your Bexio accounting system. Manage invoices, contacts, projects, and more through natural conversation.",
  "author": "Bexio MCP Team",
  "homepage": "https://github.com/example/bexio-mcp-server",
  "icon": "icon.png",
  "license": "MIT",
  "server": {
    "type": "node",
    "entry_point": "dist/index.js"
  },
  "mcp_config": {
    "command": "node",
    "args": ["dist/index.js"],
    "env": {
      "BEXIO_API_TOKEN": "${user_config.api_token}",
      "BEXIO_BASE_URL": "${user_config.base_url}"
    }
  },
  "user_config": {
    "api_token": {
      "type": "string",
      "title": "Bexio API Token",
      "description": "Your Bexio API token. Get it from Bexio > Settings > API Tokens",
      "required": true,
      "secret": true
    },
    "base_url": {
      "type": "string",
      "title": "API Base URL",
      "description": "Bexio API endpoint (usually https://api.bexio.com/2.0)",
      "required": false,
      "default": "https://api.bexio.com/2.0"
    }
  },
  "compatibility": {
    "platforms": ["darwin", "win32"],
    "node_version": ">=18.0.0"
  },
  "capabilities": {
    "tools": true,
    "resources": true,
    "ui": true
  },
  "tools": [
    {
      "name": "list_invoices",
      "description": "List invoices with pagination",
      "annotations": { "readOnlyHint": true }
    },
    {
      "name": "preview_invoice",
      "description": "Display interactive invoice preview",
      "annotations": { "readOnlyHint": true }
    },
    {
      "name": "show_contact_card",
      "description": "Display formatted contact information",
      "annotations": { "readOnlyHint": true }
    }
  ]
}
```

### Build and Pack Scripts

```json
{
  "scripts": {
    "build": "tsc && npm run build:ui",
    "build:ui": "vite build",
    "pack:mcpb": "npm run build && mcpb pack",
    "prepublishOnly": "npm run build",
    "dev": "concurrently \"tsc --watch\" \"vite build --watch\""
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Text-only tool responses | MCP Apps with UI resources | SEP-1865 (Nov 2025, stable Jan 2026) | Tools can return interactive dashboards, forms, visualizations |
| .dxt Claude Desktop extension | .mcpb MCP Bundle format | Late 2025 | Cross-client compatibility, standardized format |
| Manual Claude Desktop config | One-click bundle install | MCPB adoption 2025 | Zero-friction user installation |
| SDK 0.5.x | SDK 1.25.2 | 2025 | New tool registration API, resource patterns |

**Deprecated/outdated:**
- `.dxt` extension format: Replaced by `.mcpb` (existing .dxt still works but .mcpb preferred)
- Manual `claude_desktop_config.json` editing: Still works but bundles preferred for distribution
- SDK imports from `/server/index.js`: Now use `/server/mcp.js` for McpServer

## Open Questions

Things that couldn't be fully resolved:

1. **UI-04 Dashboard Scope**
   - What we know: Requirement says "Dashboard summary UI resource (optional)"
   - What's unclear: What data should the dashboard display? Invoice summary? Contact stats? Revenue?
   - Recommendation: Implement as optional; include basic "open invoices + overdue" summary if included

2. **Tool Annotations for MCPB Directory**
   - What we know: Public directory submission requires mandatory tool annotations
   - What's unclear: Exact annotation schema beyond `readOnlyHint`
   - Recommendation: Use `readOnlyHint` for read tools, omit for write tools; validate with `mcpb validate`

3. **npm Scope for Publishing**
   - What we know: Package should use scoped name like `@bexio/mcp-server`
   - What's unclear: Whether `@bexio` scope is available or if different scope needed
   - Recommendation: Verify npm scope availability before publishing; may need `@bexio-mcp` or similar

4. **Extension Capability Negotiation**
   - What we know: MCP Apps requires `io.modelcontextprotocol/ui` extension
   - What's unclear: How to declare in SDK 1.25.2 server options
   - Recommendation: Check ext-apps SDK source for server-side capability declaration

## Sources

### Primary (HIGH confidence)

- [MCP Apps Official Documentation](https://modelcontextprotocol.io/docs/extensions/apps) - Complete implementation guide
- [ext-apps GitHub Repository](https://github.com/modelcontextprotocol/ext-apps) - SDK source and examples
- [MCPB GitHub Repository](https://github.com/modelcontextprotocol/mcpb) - Bundle format specification
- [Claude Help Center - Building MCPB](https://support.claude.com/en/articles/12922929-building-desktop-extensions-with-mcpb) - Official bundle guide
- [ext-apps API Documentation](https://modelcontextprotocol.github.io/ext-apps/api/) - SDK reference

### Secondary (MEDIUM confidence)

- [SEP-1865 Pull Request](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/1865) - Original proposal
- [MCP Blog - MCP Apps](https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/) - Feature announcement
- [MCP Blog - Adopting MCPB](http://blog.modelcontextprotocol.io/posts/2025-11-20-adopting-mcpb/) - Format adoption

### Tertiary (LOW confidence)

- npm publishing patterns from multiple Medium/dev.to articles - General patterns, not MCP-specific
- Specific manifest.json field schemas - Requires validation against MANIFEST.md

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM - ext-apps SDK v1.0.1 is stable but new; MCPB well-documented
- Architecture: HIGH - Clear patterns from official docs and examples
- Pitfalls: MEDIUM - Based on general MCP patterns and docs, not production experience
- UI Templates: MEDIUM - Invoice/contact structure known from existing tools, rendering is standard HTML

**Research date:** 2026-02-01
**Valid until:** 2026-03-01 (30 days - MCP Apps is stable but rapidly evolving)
