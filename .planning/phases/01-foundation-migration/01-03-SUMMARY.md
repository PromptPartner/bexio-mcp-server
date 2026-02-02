---
phase: 01-foundation-migration
plan: 03
subsystem: tools
tags: [tool-migration, http-transport, modular-architecture, 83-tools]

# Dependency graph
requires:
  - "01-02: Modular architecture pattern, contacts domain example"
provides:
  - "All 83 v1 tools migrated to modular structure"
  - "HTTP transport for n8n/remote access"
  - "Dual transport support (stdio + http)"
  - "Complete Phase 1 foundation"
affects: [all-future-phases]

tech-stack:
  added: [fastify, "@fastify/cors"]
  patterns:
    - "Domain module pattern applied to all 10 domains"
    - "Handler registry for tool dispatch"
    - "JSON-RPC over HTTP for remote access"

key-files:
  created:
    - src/tools/invoices/definitions.ts
    - src/tools/invoices/handlers.ts
    - src/tools/orders/definitions.ts
    - src/tools/orders/handlers.ts
    - src/tools/quotes/definitions.ts
    - src/tools/quotes/handlers.ts
    - src/tools/payments/definitions.ts
    - src/tools/payments/handlers.ts
    - src/tools/reminders/definitions.ts
    - src/tools/reminders/handlers.ts
    - src/tools/deliveries/definitions.ts
    - src/tools/deliveries/handlers.ts
    - src/tools/items/definitions.ts
    - src/tools/items/handlers.ts
    - src/tools/reports/definitions.ts
    - src/tools/reports/handlers.ts
    - src/tools/users/definitions.ts
    - src/tools/users/handlers.ts
    - src/tools/misc/definitions.ts
    - src/tools/misc/handlers.ts
    - src/types/schemas/payments.ts
    - src/types/schemas/reminders.ts
    - src/types/schemas/deliveries.ts
    - src/types/schemas/items.ts
    - src/types/schemas/reports.ts
    - src/types/schemas/users.ts
    - src/types/schemas/misc.ts
    - src/transports/http.ts
    - src/transports/index.ts
  modified:
    - src/tools/index.ts
    - src/types/schemas/index.ts
    - src/bexio-client.ts
    - src/index.ts
    - src/package.json

decisions:
  - "All 83 tool names preserved exactly from v1 for backward compatibility"
  - "Tool domains organized by business function (invoices, orders, quotes, etc.)"
  - "HTTP transport uses Fastify for performance and n8n compatibility"
  - "Reports are computed from invoice data (no separate Bexio reports API)"

# Metrics
duration: 15min
completed: 2026-02-01
---

# Phase 1 Plan 3: Tool Migration + HTTP Transport Summary

Complete migration of all 83 v1 tools to modular structure with HTTP transport for n8n access.

## One-liner

All 83 v1 tools migrated to 10 domain modules with dual stdio/HTTP transport support.

## What Was Built

### Tool Domains (83 tools total)

| Domain | Tools | Description |
|--------|-------|-------------|
| contacts | 7 | List, get, search, advanced search, find by number/name, update |
| invoices | 15 | CRUD, search, actions (issue, cancel, send, copy), status lists, open/overdue |
| orders | 7 | CRUD, search, create delivery/invoice from order |
| quotes | 11 | CRUD, search, actions (issue, accept, decline, send), create order/invoice |
| payments | 4 | List, get, create, delete payments for invoices |
| reminders | 8 | CRUD, mark sent, send, search, sent this week |
| deliveries | 4 | List, get, issue, search deliveries |
| items | 5 | Items (3) + Taxes (2) |
| reports | 7 | Revenue, customer revenue, status, overdue, monthly, top customers, tasks |
| users | 6 | Current user + fictional users CRUD |
| misc | 9 | Comments (3) + Contact relations (6) |

### HTTP Transport

- **Endpoint**: `/mcp` - Full JSON-RPC support for MCP clients
- **Endpoint**: `/tools/call` - Direct tool invocation
- **Endpoint**: `/n8n/call` - n8n-optimized format
- **Endpoint**: `/tools` - List all available tools
- **Endpoint**: `/` - Health check

### Usage

```bash
# stdio mode (default, for Claude Desktop)
node dist/index.js

# HTTP mode (for n8n/remote access)
node dist/index.js --mode http --port 8000
```

## Commits

| Hash | Description |
|------|-------------|
| 93ca214 | feat(01-03): migrate all 83 v1 tools to modular structure |
| f7cbd1c | feat(01-03): add Zod schemas for all remaining domains |
| 163814a | feat(01-03): add HTTP transport for n8n/remote access |

## Verification Results

- Tool count: 83 (matches v1 exactly)
- All tool names: Identical to v1 (backward compatible)
- File sizes: All under 200 lines
- No console.log: Verified clean
- TypeScript: Compiles without errors

## Deviations from Plan

None - plan executed exactly as written.

## Phase 1 Complete

All Phase 1 requirements satisfied:

| Requirement | Status |
|-------------|--------|
| FOUND-01: SDK 1.25.2 | Done (Plan 01) |
| FOUND-02: Modular architecture | Done (Plan 02 + 03) |
| FOUND-05: Dual transport | Done (Plan 03) |
| FOUND-06: Zod 3.22.5 | Done (Plan 01) |
| FOUND-07: stderr logging | Done (Plan 01) |
| EXIST-01 to EXIST-12: All 83 tools | Done (Plan 03) |

## Next Phase Readiness

Phase 1 complete. Ready for Phase 2: Reference Data & Banking

- All tool infrastructure in place
- HTTP transport ready for n8n integration
- Modular structure supports easy addition of new tools
- Type system established for all domains
