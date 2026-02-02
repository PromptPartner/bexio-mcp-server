# Technology Stack

**Project:** Bexio MCP v2
**Researched:** 2026-02-01
**Focus:** MCP server development stack for one-click installation

## Executive Summary

The MCP ecosystem has matured significantly since the v1 implementation (SDK 0.5.0). The current SDK is at **v1.25.2** with v2 expected in Q1 2026. Major changes include Streamable HTTP transport (SSE deprecated), Zod v4 peer dependency, and the MCPB bundle format for distribution. The v1 to v1.x migration requires transport updates and Zod compatibility verification.

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| @modelcontextprotocol/sdk | ^1.25.2 | MCP server implementation | Official SDK, actively maintained, v1.x stable until v2 ships. 21,000+ projects using it. | HIGH |
| TypeScript | ^5.5.0 | Type safety | Required for Zod strict mode, SDK type inference | HIGH |
| Node.js | >=20.0.0 | Runtime | Required for modern ES modules, Claude Desktop ships Node.js built-in | HIGH |
| zod | ^3.25.0 | Schema validation | Peer dependency of SDK. Supports both Zod 3.25+ and Zod 4 via internal zod/v4 imports | HIGH |

### Transport Layer

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| StdioServerTransport | (from SDK) | Claude Desktop communication | Primary transport for local MCP servers, required for MCPB | HIGH |
| StreamableHTTPServerTransport | (from SDK) | Remote/HTTP communication | Replaced deprecated SSE transport as of MCP spec 2025-03-26 | HIGH |

**DO NOT USE:** SSE transport (deprecated). The older HTTP+SSE transport (protocol version 2024-11-05) is supported only for backwards compatibility. New implementations must use Streamable HTTP.

### Distribution / Bundling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| @anthropic-ai/mcpb | ^2.1.2 | MCPB bundle creation | Official Anthropic CLI for creating .mcpb files. Renamed from @anthropic-ai/dxt | HIGH |
| esbuild | ^0.24.0 | JavaScript bundler | Bundles TypeScript into single file for MCPB. 100x faster than Rollup/Webpack. Use --platform=node | MEDIUM |

### Supporting Libraries (Retained from v1)

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| axios | ^1.7.0 | HTTP client | Bexio API calls. Well-tested, automatic transforms | HIGH |
| dotenv | ^16.4.0 | Environment config | Local development only. MCPB uses user_config instead | HIGH |

### Dev Dependencies

| Library | Version | Purpose | Confidence |
|---------|---------|---------|------------|
| @types/node | ^22.0.0 | Node.js types | HIGH |
| tsx | ^4.0.0 | TypeScript execution | HIGH |
| vitest | ^2.0.0 | Testing | HIGH |
| @vitest/coverage-v8 | ^2.0.0 | Coverage | HIGH |
| typescript | ^5.5.0 | Compiler | HIGH |
| eslint | ^9.0.0 | Linting | MEDIUM |

---

## Breaking Changes from v0.5.0 to v1.x

Based on research, the SDK has undergone significant changes. Key migration requirements:

### 1. Transport API Changes
**Before (0.5.x):**
```typescript
import { Server, StdioServerTransport } from "@modelcontextprotocol/sdk/server";
```

**After (1.x):**
```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
```

### 2. Zod Peer Dependency
- SDK now requires `zod` as a peer dependency (not bundled)
- SDK internally imports from `zod/v4` but remains compatible with Zod 3.25+
- Add to package.json: `"peerDependencies": { "zod": "^3.25.0 || ^4.0.0" }`

### 3. SSE Transport Deprecated
- If using HTTP transport, migrate from SSE to Streamable HTTP
- For local/Claude Desktop: stdio transport is unchanged and preferred

### 4. Server.connect() Behavior
- `server.connect(transport)` replaces any existing transport
- Cannot register capabilities after connecting to transport
- Register all tools/resources before calling connect()

**Confidence:** MEDIUM - Could not find official migration guide. Recommend testing thoroughly.

---

## MCPB Bundle Format

### manifest.json Structure (Required Fields)

```json
{
  "manifest_version": "0.2",
  "name": "bexio-mcp",
  "display_name": "Bexio MCP Server",
  "version": "2.0.0",
  "description": "MCP server for Bexio accounting API integration",
  "author": {
    "name": "Author Name",
    "email": "author@example.com"
  },
  "license": "MIT"
}
```

### manifest.json Structure (Server Configuration)

```json
{
  "server": {
    "type": "node",
    "entry_point": "server/index.js",
    "mcp_config": {
      "command": "node",
      "args": ["server/index.js"],
      "env": {
        "BEXIO_API_TOKEN": "${user_config.api_token}"
      }
    }
  }
}
```

### manifest.json Structure (User Configuration)

```json
{
  "user_config": {
    "api_token": {
      "type": "string",
      "title": "Bexio API Token",
      "description": "Your Bexio API access token",
      "required": true,
      "secret": true
    },
    "company_id": {
      "type": "string",
      "title": "Company ID",
      "description": "Optional: Specific company ID if you have multiple",
      "required": false
    }
  }
}
```

### Complete Bundle Structure

```
bexio-mcp.mcpb (ZIP file)
├── manifest.json          # Required: Bundle metadata
├── server/
│   └── index.js           # Bundled server (single file via esbuild)
├── icon.png               # Optional: 256x256 icon
└── README.md              # Optional: Documentation
```

**Key Insight:** Node.js ships with Claude Desktop for macOS and Windows. Node bundles work out-of-the-box without requiring users to install additional runtimes. Anthropic recommends Node.js over Python for this reason.

---

## npm Package Best Practices

### package.json for npm Distribution

```json
{
  "name": "@your-scope/bexio-mcp",
  "version": "2.0.0",
  "description": "MCP server for Bexio API integration",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "bexio-mcp": "dist/index.js"
  },
  "files": [
    "dist",
    "README.md"
  ],
  "scripts": {
    "build": "tsc && npm run add-shebang",
    "add-shebang": "node -e \"const fs=require('fs'); const f='dist/index.js'; const c=fs.readFileSync(f,'utf8'); if(!c.startsWith('#!')) fs.writeFileSync(f,'#!/usr/bin/env node\\n'+c);\"",
    "prepublishOnly": "npm run build"
  },
  "engines": {
    "node": ">=20.0.0"
  },
  "peerDependencies": {
    "zod": "^3.25.0 || ^4.0.0"
  },
  "keywords": [
    "mcp",
    "bexio",
    "model-context-protocol",
    "claude",
    "ai"
  ]
}
```

### Critical npm Requirements

1. **bin field**: Single entry makes `npx @your-scope/bexio-mcp` work directly
2. **Shebang**: Add `#!/usr/bin/env node` to entry point (TypeScript doesn't preserve this)
3. **type: module**: Required for ES modules
4. **files array**: Only publish dist/ and docs
5. **engines.node**: Specify >=20.0.0 for modern features

### Distribution Strategy

| Channel | Target Audience | How to Install |
|---------|-----------------|----------------|
| MCPB bundle | Non-technical users | Double-click .mcpb file |
| npm package | Developers | `npx @scope/bexio-mcp` |
| GitHub release | Power users | Clone and build |

---

## Required vs Optional Dependencies

### Required (Runtime)

| Package | Why Required |
|---------|--------------|
| @modelcontextprotocol/sdk | Core MCP functionality |
| zod | Peer dependency for SDK schema validation |
| axios | Bexio API HTTP client |

### Optional (Bundled in MCPB)

For MCPB distribution, all dependencies are bundled. The manifest.json `mcp_config` handles execution.

### Dev Only

| Package | Purpose |
|---------|---------|
| typescript | Compilation |
| @types/node | Type definitions |
| esbuild | Bundling for MCPB |
| tsx | Development execution |
| vitest | Testing |
| @anthropic-ai/mcpb | CLI for bundle creation |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Alternative |
|----------|-------------|-------------|---------------------|
| SDK | @modelcontextprotocol/sdk | FastMCP | Official SDK is better documented, more stable |
| Transport | stdio + Streamable HTTP | SSE | SSE deprecated in MCP spec 2025-03-26 |
| Bundler | esbuild | Rollup/Webpack | esbuild is 100x faster, simpler config |
| HTTP Client | axios | fetch | axios has better error handling, transforms |
| Schema | zod | joi/yup | zod is required peer dependency of SDK |
| Bundle format | MCPB | Custom installer | MCPB is cross-client standard, Claude Desktop native support |

---

## Installation Commands

### Fresh Project Setup

```bash
# Core dependencies
npm install @modelcontextprotocol/sdk@^1.25.2 zod@^3.25.0 axios@^1.7.0

# Dev dependencies
npm install -D typescript@^5.5.0 @types/node@^22.0.0 tsx@^4.0.0 esbuild@^0.24.0 vitest@^2.0.0 @vitest/coverage-v8@^2.0.0 @anthropic-ai/mcpb@^2.1.2
```

### Upgrade from v1 (0.5.0)

```bash
# Update SDK (breaking changes!)
npm install @modelcontextprotocol/sdk@^1.25.2

# Add required peer dependency
npm install zod@^3.25.0

# Add MCPB tooling
npm install -D @anthropic-ai/mcpb@^2.1.2 esbuild@^0.24.0
```

---

## tsconfig.json Recommendations

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Note:** `strict: true` is required by Zod. TypeScript 5.5+ required for modern SDK type inference.

---

## Sources

### HIGH Confidence (Official/Authoritative)
- [npm: @modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk) - SDK version 1.25.2, peer dependencies
- [GitHub: modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk) - Official SDK repository
- [npm: @anthropic-ai/mcpb](https://www.npmjs.com/package/@anthropic-ai/mcpb) - MCPB CLI version 2.1.2
- [MCP Specification Changelog](https://modelcontextprotocol.io/specification/2025-11-25/changelog) - SSE deprecation, Streamable HTTP
- [GitHub: modelcontextprotocol/mcpb MANIFEST.md](https://github.com/modelcontextprotocol/mcpb/blob/main/MANIFEST.md) - Bundle specification
- [Anthropic Engineering: Desktop Extensions](https://www.anthropic.com/engineering/desktop-extensions) - MCPB rationale
- [Claude Help Center: Building Desktop Extensions](https://support.claude.com/en/articles/12922929-building-desktop-extensions-with-mcpb) - MCPB creation guide

### MEDIUM Confidence (Multiple Sources Agree)
- [Why MCP Deprecated SSE](https://blog.fka.dev/blog/2025-06-06-why-mcp-deprecated-sse-and-go-with-streamable-http/) - Transport migration rationale
- [Publish MCP Server to NPM](https://www.aihero.dev/publish-your-mcp-server-to-npm) - npm distribution patterns
- [Zod Documentation](https://zod.dev/) - Peer dependency requirements
- [Distribute MCP Servers - Speakeasy](https://www.speakeasy.com/mcp/distributing-mcp-servers) - Distribution best practices
- [MCP Server Best Practices 2026](https://www.cdata.com/blog/mcp-server-best-practices-2026) - Security and OAuth 2.1

### LOW Confidence (Needs Verification)
- Migration from SDK 0.5.0 to 1.x - No official migration guide found. Test thoroughly.
- Exact esbuild configuration for MCPB - May need adjustment based on dependencies.

---

## Open Questions for Phase-Specific Research

1. **OAuth 2.1 for Bexio**: Does Bexio API support OAuth 2.1 or only API tokens? Affects user_config design.
2. **MCPB signing**: Should the bundle be signed? Requires code signing certificate.
3. **Fastify removal**: v1 included Fastify for HTTP mode. With Streamable HTTP in SDK, is custom Fastify still needed?
4. **SDK v2 timeline**: v2 expected Q1 2026. Should we wait or build on v1.x?
