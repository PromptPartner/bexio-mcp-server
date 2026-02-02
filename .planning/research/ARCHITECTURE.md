# Architecture Patterns: MCP Server Modular Structure

**Domain:** MCP (Model Context Protocol) Server Refactoring
**Researched:** 2026-02-01
**Confidence:** MEDIUM-HIGH (patterns verified via multiple sources, some MCP-specific patterns less documented)

## Executive Summary

Production MCP servers follow a **modular, domain-driven architecture** with clear separation between tool definitions, handlers, and shared utilities. The recommended pattern for your 56-tool Bexio server is a **domain-organized module structure** with centralized registration.

## Current State Analysis

Your v1 `server.ts` (2,418 lines) follows a common but problematic pattern:

```
Current Monolith:
├── server.ts (2,418 lines)
│   ├── Tool definitions (lines 156-1619) - ~1,463 lines
│   ├── Response formatting (lines 1622-1830) - ~208 lines
│   └── Tool handlers (lines 1832-2418) - ~586 lines
├── bexio-client.ts (30,124 bytes) - API client
├── types.ts (21,661 bytes) - Zod schemas
├── index.ts - Entry point
└── http-server.ts - HTTP transport
```

**Problems with current structure:**
- Single 2,418-line file is unmaintainable
- Tool definitions mixed with handlers
- No clear domain boundaries
- Difficult to test individual tools
- Adding new tools requires touching one massive file

## Recommended Architecture

### Pattern: Domain-Organized Modules

```
src/
├── index.ts                    # Entry point, transport selection
├── server.ts                   # Core server setup, tool registration
├── bexio-client.ts            # API client (keep as-is)
├── types/                      # Shared types
│   ├── index.ts               # Barrel export
│   ├── common.ts              # Pagination, response types
│   └── schemas/               # Split current types.ts by domain
│       ├── contacts.ts
│       ├── invoices.ts
│       ├── orders.ts
│       └── ...
├── tools/                      # Tool modules by domain
│   ├── index.ts               # Aggregates all tools for registration
│   ├── contacts/
│   │   ├── index.ts           # Barrel: exports definitions + handlers
│   │   ├── definitions.ts     # Tool definitions (inputSchema)
│   │   └── handlers.ts        # Handler implementations
│   ├── invoices/
│   │   ├── index.ts
│   │   ├── definitions.ts
│   │   └── handlers.ts
│   ├── orders/
│   │   ├── index.ts
│   │   ├── definitions.ts
│   │   └── handlers.ts
│   ├── quotes/
│   │   ├── index.ts
│   │   ├── definitions.ts
│   │   └── handlers.ts
│   ├── payments/
│   │   ├── index.ts
│   │   ├── definitions.ts
│   │   └── handlers.ts
│   ├── reminders/
│   │   ├── index.ts
│   │   ├── definitions.ts
│   │   └── handlers.ts
│   ├── deliveries/
│   │   ├── index.ts
│   │   ├── definitions.ts
│   │   └── handlers.ts
│   ├── items/
│   │   ├── index.ts
│   │   ├── definitions.ts
│   │   └── handlers.ts
│   ├── reports/
│   │   ├── index.ts
│   │   ├── definitions.ts
│   │   └── handlers.ts
│   └── users/
│       ├── index.ts
│       ├── definitions.ts
│       └── handlers.ts
├── shared/                     # Shared utilities
│   ├── index.ts
│   ├── errors.ts              # McpError, error formatting
│   ├── response.ts            # Response formatting (from current formatResponseData)
│   └── validation.ts          # Shared validation helpers
└── transports/                 # Transport implementations
    ├── stdio.ts
    └── http.ts
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `index.ts` | Entry point, transport selection | `server.ts`, `transports/` |
| `server.ts` | Server setup, tool registration | `tools/`, MCP SDK |
| `tools/[domain]/definitions.ts` | Tool metadata (name, description, inputSchema) | None (pure data) |
| `tools/[domain]/handlers.ts` | Tool execution logic | `bexio-client.ts`, `shared/` |
| `tools/[domain]/index.ts` | Barrel export, wires definitions to handlers | definitions, handlers |
| `tools/index.ts` | Aggregates all domain tools | All domain modules |
| `bexio-client.ts` | Bexio API communication | External Bexio API |
| `shared/errors.ts` | Error creation and formatting | None |
| `shared/response.ts` | Response formatting | None |
| `types/` | Type definitions, Zod schemas | None |

### Data Flow

```
User Request (Claude Desktop)
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  Transport Layer (stdio or HTTP)                             │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  server.ts                                                   │
│  - Receives CallToolRequest                                  │
│  - Routes to appropriate handler by tool name                │
│  - Catches errors, formats responses                         │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  tools/[domain]/handlers.ts                                  │
│  - Validates input with Zod schema                           │
│  - Calls bexio-client methods                                │
│  - Throws McpError on failure                                │
│  - Returns raw result (formatting handled by server)         │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  bexio-client.ts                                             │
│  - Makes HTTP requests to Bexio API                          │
│  - Handles pagination, retries                               │
│  - Returns typed responses                                   │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  Bexio API (External)                                        │
└─────────────────────────────────────────────────────────────┘
```

## Patterns to Follow

### Pattern 1: Separation of Definitions from Handlers

**What:** Tool definitions (metadata) live in `definitions.ts`, handler logic in `handlers.ts`
**Why:** Definitions are pure data, handlers contain logic. Separation enables:
- Easier testing (test handlers without definitions)
- Clear contracts (definitions are the API surface)
- Parallel development (one person writes definitions, another handlers)

**Example:**

```typescript
// tools/contacts/definitions.ts
import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const listContactsDefinition: Tool = {
  name: 'list_contacts',
  description: 'List contacts from Bexio with optional pagination',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'integer',
        description: 'Maximum number of contacts to return (default: 50)',
        default: 50,
      },
      offset: {
        type: 'integer',
        description: 'Number of contacts to skip (default: 0)',
        default: 0,
      },
    },
  },
};

export const contactDefinitions: Tool[] = [
  listContactsDefinition,
  getContactDefinition,
  searchContactsDefinition,
  // ... more
];
```

```typescript
// tools/contacts/handlers.ts
import { BexioClient } from '../../bexio-client.js';
import { ListContactsParamsSchema } from '../../types/schemas/contacts.js';

export function createContactHandlers(bexioClient: BexioClient) {
  return {
    list_contacts: async (args: unknown) => {
      const params = ListContactsParamsSchema.parse(args);
      return bexioClient.listContacts(params);
    },
    get_contact: async (args: unknown) => {
      // ...
    },
  };
}
```

```typescript
// tools/contacts/index.ts
export { contactDefinitions } from './definitions.js';
export { createContactHandlers } from './handlers.js';
```

### Pattern 2: Centralized Tool Registration

**What:** Single `tools/index.ts` aggregates all tools for server registration
**Why:** Server only needs to import from one location, domain modules remain independent

**Example:**

```typescript
// tools/index.ts
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BexioClient } from '../bexio-client.js';

import { contactDefinitions, createContactHandlers } from './contacts/index.js';
import { invoiceDefinitions, createInvoiceHandlers } from './invoices/index.js';
import { orderDefinitions, createOrderHandlers } from './orders/index.js';
// ... more imports

export function getAllDefinitions(): Tool[] {
  return [
    ...contactDefinitions,
    ...invoiceDefinitions,
    ...orderDefinitions,
    // ... more
  ];
}

export type ToolHandler = (args: unknown) => Promise<unknown>;

export function createAllHandlers(bexioClient: BexioClient): Record<string, ToolHandler> {
  return {
    ...createContactHandlers(bexioClient),
    ...createInvoiceHandlers(bexioClient),
    ...createOrderHandlers(bexioClient),
    // ... more
  };
}
```

### Pattern 3: Logic Throws, Server Catches

**What:** Handler logic throws `McpError`, server catches and formats response
**Why:** Handlers stay pure, error handling is centralized

**Example:**

```typescript
// shared/errors.ts
export class McpError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'McpError';
  }
}

export function createNotFoundError(resource: string, id: string | number): McpError {
  return new McpError('NOT_FOUND', `${resource} with ID ${id} not found`);
}
```

```typescript
// tools/invoices/handlers.ts
import { McpError } from '../../shared/errors.js';

export function createInvoiceHandlers(bexioClient: BexioClient) {
  return {
    get_invoice: async (args: unknown) => {
      const params = GetInvoiceParamsSchema.parse(args);
      const invoice = await bexioClient.getInvoice(params.invoice_id);
      if (!invoice) {
        throw new McpError('NOT_FOUND', `Invoice ${params.invoice_id} not found`);
      }
      return invoice;
    },
  };
}
```

```typescript
// server.ts (simplified)
this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const handler = this.handlers[name];
    if (!handler) {
      throw new McpError('UNKNOWN_TOOL', `Tool ${name} not found`);
    }

    const result = await handler(args);
    return this.formatSuccess(name, result);
  } catch (error) {
    if (error instanceof McpError) {
      return this.formatError(error);
    }
    // Unexpected error
    return this.formatError(new McpError('INTERNAL', error.message));
  }
});
```

### Pattern 4: Response Formatting Centralization

**What:** `shared/response.ts` handles all response formatting
**Why:** Consistent response structure, single place to modify format

**Example:**

```typescript
// shared/response.ts
export interface McpResponse {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export function formatSuccess(toolName: string, result: unknown): McpResponse {
  const dataKey = getDataKey(toolName);
  const response = {
    [dataKey]: result,
    meta: {
      source: 'bexio',
      fetched_at: new Date().toISOString(),
      tool: toolName,
    },
  };

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(response, null, 2) + '\n\n--- RESPONSE COMPLETE ---',
    }],
  };
}

export function formatError(error: McpError): McpResponse {
  return {
    content: [{
      type: 'text',
      text: `Error: ${error.message}\n\n--- RESPONSE COMPLETE ---`,
    }],
    isError: true,
  };
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Handler Registration Inside Handlers

**What:** Tool definitions include handler logic inline
**Why bad:** Can't test definitions separately, definitions file becomes bloated
**Instead:** Keep definitions as pure data, wire handlers in index.ts

### Anti-Pattern 2: Direct BexioClient Dependency

**What:** Handlers import and instantiate BexioClient directly
**Why bad:** Hard to test, no dependency injection
**Instead:** Pass BexioClient via factory function (createXxxHandlers)

### Anti-Pattern 3: Shared Mutable State

**What:** Handlers share state (e.g., caching) via module-level variables
**Why bad:** Race conditions, test isolation issues
**Instead:** Pass dependencies explicitly, or use server-level state

### Anti-Pattern 4: Giant Switch Statement

**What:** Single switch statement with 56 cases for tool routing
**Why bad:** Unmaintainable, all tools coupled together
**Instead:** Use handler registry object with tool name as key

## Tool Domain Organization

Based on your 56 tools, here's the recommended domain split:

| Domain | Tools | Count |
|--------|-------|-------|
| contacts | list_contacts, get_contact, search_contacts, advanced_search_contacts, find_contact_by_number, find_contact_by_name, update_contact | 7 |
| invoices | list_invoices, list_all_invoices, get_invoice, search_invoices, search_invoices_by_customer, create_invoice, issue_invoice, cancel_invoice, mark_invoice_as_sent, send_invoice, copy_invoice, list_invoice_statuses, list_all_statuses | 13 |
| orders | list_orders, get_order, create_order, search_orders, search_orders_by_customer, create_order_from_quote | 6 |
| quotes | list_quotes, get_quote, create_quote, search_quotes, search_quotes_by_customer, issue_quote, accept_quote, decline_quote, send_quote, create_invoice_from_quote | 10 |
| payments | list_payments, get_payment, create_payment, delete_payment | 4 |
| reminders | list_reminders, get_reminder, create_reminder, delete_reminder, mark_reminder_as_sent, send_reminder, search_reminders, get_reminders_sent_this_week | 8 |
| deliveries | list_deliveries, get_delivery, issue_delivery, search_deliveries, create_delivery_from_order, create_invoice_from_order | 6 |
| items | list_items, get_item, create_item, list_taxes, get_tax | 5 |
| reports | get_revenue_report, get_customer_revenue_report, get_invoice_status_report, get_overdue_invoices_report, get_monthly_revenue_report, get_top_customers_by_revenue, get_open_invoices, get_overdue_invoices, get_tasks_due_this_week | 9 |
| users | get_current_user, list_fictional_users, get_fictional_user, create_fictional_user, update_fictional_user, delete_fictional_user | 6 |
| comments | list_comments, get_comment, create_comment | 3 |
| relations | list_contact_relations, get_contact_relation, create_contact_relation, update_contact_relation, delete_contact_relation, search_contact_relations | 6 |

**Total: 83 tools** (Note: I count 83 from your description, not 56. Please verify the actual count.)

## Testing Patterns

### Pattern: In-Memory Testing with Mocked Client

**What:** Use InMemoryTransport for fast, isolated tests
**Why:** Avoids subprocess spawning, faster, easier to debug

**Example:**

```typescript
// tools/contacts/handlers.test.ts
import { describe, it, expect, vi } from 'vitest';
import { createContactHandlers } from './handlers.js';

describe('Contact Handlers', () => {
  const mockClient = {
    listContacts: vi.fn(),
    getContact: vi.fn(),
  };

  const handlers = createContactHandlers(mockClient as any);

  it('list_contacts returns paginated results', async () => {
    mockClient.listContacts.mockResolvedValue([
      { id: 1, name: 'Test' },
    ]);

    const result = await handlers.list_contacts({ limit: 10 });

    expect(result).toHaveLength(1);
    expect(mockClient.listContacts).toHaveBeenCalledWith({ limit: 10 });
  });

  it('list_contacts validates input', async () => {
    await expect(handlers.list_contacts({ limit: 'invalid' }))
      .rejects.toThrow();
  });
});
```

### Pattern: E2E Testing with Real Server

**What:** Spawn server, communicate via transport, verify responses
**When:** Integration tests, CI/CD pipelines

```typescript
// tests/e2e/server.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

describe('E2E Server Tests', () => {
  let client: Client;

  beforeAll(async () => {
    // Create in-memory client-server pair
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    // ... setup
  });

  it('lists available tools', async () => {
    const tools = await client.listTools();
    expect(tools.tools.length).toBeGreaterThan(50);
  });
});
```

## Build Order for Migration

### Phase 1: Foundation (No Breaking Changes)

1. **Create directory structure** - Create empty folders
2. **Create shared/errors.ts** - Error types
3. **Create shared/response.ts** - Extract formatResponseData
4. **Create types/ structure** - Split types.ts into domain files

**Verification:** Server still works with original server.ts

### Phase 2: Extract First Domain (Contacts - Low Risk)

1. **Create tools/contacts/definitions.ts** - Copy contact tool definitions
2. **Create tools/contacts/handlers.ts** - Copy contact handlers
3. **Create tools/contacts/index.ts** - Wire together
4. **Update server.ts** - Import from tools/contacts, remove local defs

**Verification:** Contact tools work, no regressions

### Phase 3: Migrate Remaining Domains (Parallel-able)

Migrate domains in order of independence:
1. **items** (standalone)
2. **users** (standalone)
3. **comments** (standalone)
4. **relations** (standalone)
5. **orders** (depends on quotes for conversions)
6. **quotes** (depends on contacts)
7. **invoices** (depends on contacts, most complex)
8. **payments** (depends on invoices)
9. **reminders** (depends on invoices)
10. **deliveries** (depends on orders)
11. **reports** (depends on invoices, contacts)

**Verification:** Each domain migrated, tests pass

### Phase 4: Clean Up Server.ts

1. **Create tools/index.ts** - Aggregate all tools
2. **Simplify server.ts** - Remove handler switch, use registry
3. **Update tests** - Point to new locations

**Verification:** server.ts under 200 lines, all tests pass

### Phase 5: Type System Cleanup

1. **Split types.ts** - Move schemas to types/schemas/[domain].ts
2. **Update imports** - All tools import from types/
3. **Remove original types.ts**

**Verification:** Build succeeds, no type errors

## Dependency Graph

```
                    ┌─────────────┐
                    │  index.ts   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  server.ts  │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼──────┐ ┌───▼───┐ ┌──────▼──────┐
       │ tools/index │ │shared/│ │bexio-client │
       └──────┬──────┘ └───────┘ └─────────────┘
              │
    ┌─────────┼─────────┬─────────┬─────────┐
    │         │         │         │         │
┌───▼───┐ ┌───▼───┐ ┌───▼───┐ ┌───▼───┐ ┌───▼───┐
│contact│ │invoice│ │orders │ │quotes │ │  ...  │
└───┬───┘ └───┬───┘ └───┬───┘ └───┬───┘ └───────┘
    │         │         │         │
    └─────────┴─────────┴─────────┘
                    │
              ┌─────▼─────┐
              │  types/   │
              └───────────┘
```

**Key insight:** All domain modules depend only on:
- `types/` (for schemas)
- `shared/` (for errors, response formatting)
- `bexio-client.ts` (passed via dependency injection)

No domain depends on another domain directly.

## Sources

### HIGH Confidence (Official/Authoritative)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) - Official SDK, architecture patterns
- [Build an MCP Server](https://modelcontextprotocol.io/docs/develop/build-server) - Official documentation

### MEDIUM Confidence (Verified Patterns)
- [mcp-ts-template](https://github.com/cyanheads/mcp-ts-template) - Production-grade template with proven patterns
- [mcp-framework](https://github.com/QuantGeekDev/mcp-framework) - Framework with directory-based discovery
- [MCP Server Testing Guide](https://mcpcat.io/guides/writing-unit-tests-mcp-servers/) - Testing patterns with Vitest
- [mcp-server-e2e-testing-example](https://github.com/mkusaka/mcp-server-e2e-testing-example) - E2E testing patterns

### LOW Confidence (Community Patterns)
- General monolith-to-modular migration patterns from microservices literature
- Strangler Fig pattern for incremental migration

## Roadmap Implications

Based on this architecture research:

1. **Phase 1 (Foundation)** should create shared utilities first - they're dependencies for all other phases
2. **Phase 2 (First Domain)** should use contacts - it's well-understood, low coupling, good test case
3. **Phases 3-4 (Bulk Migration)** can proceed in parallel within a phase since domains are independent
4. **Phase 5 (Cleanup)** should happen after all domains migrated to avoid rework

**Risk Areas:**
- `bexio-client.ts` may also need refactoring if handlers reveal tight coupling
- Response formatting logic (`formatResponseData`, `getDataKey`) needs careful extraction
- Existing tests (shell scripts) may need conversion to Vitest

**Research Flags for Later Phases:**
- Phase with HTTP transport separation may need deeper research on transport abstraction
- MCPB bundling phase will need research on manifest.json structure
