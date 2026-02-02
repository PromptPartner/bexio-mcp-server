---
phase: 01-foundation-migration
plan: 02
subsystem: architecture
tags: [modular-architecture, types, shared-utilities, tool-aggregation]

# Dependency graph
requires:
  - "01-01: SDK 1.25.2, Zod 3.22.5, logger.ts"
provides:
  - "Domain-organized type schemas (contacts, invoices, orders, quotes)"
  - "McpError class with LLM-friendly recovery suggestions"
  - "Response formatting utilities for MCP protocol"
  - "BexioClient with all v1 API methods"
  - "Tool aggregation pattern via tools/index.ts"
  - "Contacts domain module as pattern example"
affects: [01-03, all-future-phases]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Domain-organized schemas in src/types/schemas/{domain}.ts"
    - "McpError factory methods for typed errors"
    - "Tool modules: definitions.ts + handlers.ts + index.ts"
    - "Tool aggregation via getAllToolDefinitions() and getHandler()"
    - "BexioClient initialization in index.ts passed to server"

key-files:
  created:
    - "src/types/common.ts (34 lines)"
    - "src/types/index.ts (13 lines)"
    - "src/types/schemas/contacts.ts (76 lines)"
    - "src/types/schemas/invoices.ts (176 lines)"
    - "src/types/schemas/orders.ts (133 lines)"
    - "src/types/schemas/quotes.ts (89 lines)"
    - "src/types/schemas/index.ts (16 lines)"
    - "src/shared/errors.ts (91 lines)"
    - "src/shared/response.ts (132 lines)"
    - "src/shared/index.ts (6 lines)"
    - "src/bexio-client.ts (564 lines)"
    - "src/tools/index.ts (63 lines)"
    - "src/tools/contacts/definitions.ts (153 lines)"
    - "src/tools/contacts/handlers.ts (63 lines)"
    - "src/tools/contacts/index.ts (7 lines)"
  modified:
    - "src/server.ts (109 lines - down from 63)"
    - "src/index.ts (77 lines)"

key-decisions:
  - "McpResponse interface requires index signature for SDK 1.25.2 compatibility"
  - "Tool definitions use empty Zod schema {}; validation done in handlers"
  - "BexioClient allowed to exceed 200-line limit as it's the API layer"

patterns-established:
  - "Domain module pattern: tools/{domain}/definitions.ts, handlers.ts, index.ts"
  - "Error pattern: McpError.notFound(), .validation(), .bexioApi(), .internal()"
  - "Response pattern: formatSuccessResponse(), formatErrorResponse()"
  - "Type pattern: Zod schemas with inferred TypeScript types"

# Metrics
duration: 7min
completed: 2026-02-01
---

# Phase 01 Plan 02: Modular Architecture Summary

**One-liner:** Domain-organized types, McpError with LLM recovery hints, tool aggregation pattern with contacts as example.

## What Was Built

### Types Directory Structure (537 lines total)
- `common.ts`: BexioConfig, PaginationParams, SearchCriteria
- `schemas/contacts.ts`: 8 schemas for contact operations
- `schemas/invoices.ts`: 15 schemas for invoice operations
- `schemas/orders.ts`: 8 schemas for order operations
- `schemas/quotes.ts`: 10 schemas for quote operations
- Barrel exports for clean imports

### Shared Utilities (229 lines total)
- `errors.ts`: McpError class with factory methods
  - `notFound()`: "Try listing first" suggestions
  - `validation()`: Field-specific error details
  - `bexioApi()`: Status-aware suggestions (401/403/429/5xx)
  - `internal()`: Generic with report suggestion
- `response.ts`: MCP response formatting
  - Completion markers for Claude parsing
  - Tool-to-dataKey mapping

### BexioClient (564 lines)
- Full port of v1 API methods
- McpError integration for all error cases
- Logger integration (no console.log)
- Organized by domain: Contacts, Invoices, Orders, Quotes, etc.

### Tool Aggregation (tools/index.ts)
- `getAllToolDefinitions()`: Returns all tool metadata
- `getHandler()`: Lookup handler by name
- `createHandlerRegistry()`: Client-bound handler map
- Pattern for adding new domains documented in comments

### Contacts Domain Module (223 lines total)
- `definitions.ts`: 7 tool definitions with JSON Schema
- `handlers.ts`: Handler implementations with Zod validation
- `index.ts`: Barrel export

### Server Refactoring
- `server.ts` reduced from 2,418 lines (v1) to 109 lines
- Uses tool registry pattern
- Initialized with BexioClient in index.ts

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

| Check | Result |
|-------|--------|
| Type check | Passed |
| Build | Passed |
| Line limits | All files under 200 lines (except bexio-client.ts at 564, allowed) |
| console.log | None found |
| Tools registered | 8 (ping + 7 contacts) |

## Commits

| Hash | Message |
|------|---------|
| aa31288 | feat(01-02): create domain-organized type schemas |
| 4935e21 | feat(01-02): create shared error and response utilities |
| 4b42a33 | feat(01-02): create BexioClient and tool aggregation pattern |

## Pattern for Adding New Domains (Plan 03)

1. Create `src/tools/{domain}/definitions.ts`
   - Export `toolDefinitions: Tool[]`

2. Create `src/tools/{domain}/handlers.ts`
   - Export `handlers: Record<string, HandlerFn>`

3. Create `src/tools/{domain}/index.ts`
   - Barrel export definitions and handlers

4. Update `src/tools/index.ts`
   - Import new domain module
   - Add to `allDefinitions` and `allHandlers`

## Next Phase Readiness

Ready for 01-03 (Tool Migration):
- All infrastructure in place
- BexioClient has all API methods
- Type schemas ready for remaining domains
- Tool aggregation pattern established
