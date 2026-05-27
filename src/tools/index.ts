/**
 * Tool aggregation module.
 * Single import point for all domain tools.
 *
 * Pattern for adding new domains:
 * 1. Create tools/{domain}/definitions.ts
 * 2. Create tools/{domain}/handlers.ts
 * 3. Create tools/{domain}/index.ts
 * 4. Import and add to arrays below
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { BexioClient } from "../bexio-client.js";
import { getEnabledCategories, type ToolCategory } from "./categories.js";

// Domain imports
import * as reference from "./reference/index.js";
import * as company from "./company/index.js";
import * as banking from "./banking/index.js";
import * as projects from "./projects/index.js";
import * as timetracking from "./timetracking/index.js";
import * as accounting from "./accounting/index.js";
import * as contacts from "./contacts/index.js";
import * as invoices from "./invoices/index.js";
import * as orders from "./orders/index.js";
import * as quotes from "./quotes/index.js";
import * as payments from "./payments/index.js";
import * as reminders from "./reminders/index.js";
import * as deliveries from "./deliveries/index.js";
import * as items from "./items/index.js";
import * as reports from "./reports/index.js";
import * as users from "./users/index.js";
import * as misc from "./misc/index.js";
import * as purchase from "./purchase/index.js";
import * as files from "./files/index.js";
import * as payroll from "./payroll/index.js";
import * as notes from "./notes/index.js";
import * as tasks from "./tasks/index.js";
import * as stock from "./stock/index.js";
import * as docs from "./docs/index.js";
import * as positions from "./positions/index.js";

// Type for handler functions
export type HandlerFn = (
  client: BexioClient,
  args: unknown
) => Promise<unknown>;

// Per-category module map — used to build the (optionally filtered) tool set.
type CategoryModule = {
  toolDefinitions: Tool[];
  handlers: Record<string, HandlerFn>;
};

const CATEGORY_MODULES: Record<ToolCategory, CategoryModule> = {
  reference,
  company,
  banking,
  projects,
  timetracking,
  accounting,
  purchase,
  files,
  payroll,
  contacts,
  invoices,
  orders,
  quotes,
  payments,
  reminders,
  deliveries,
  items,
  reports,
  users,
  misc,
  notes,
  tasks,
  stock,
  docs,
  positions,
};

// Resolve enabled categories once at module load (BEXIO_ENABLED_CATEGORIES).
const enabledCategories = getEnabledCategories();

// Build definitions + handlers from the enabled categories only.
const allDefinitions: Tool[] = [];
const allHandlers: Record<string, HandlerFn> = {};

for (const [name, mod] of Object.entries(CATEGORY_MODULES)) {
  if (!enabledCategories.has(name as ToolCategory)) continue;
  allDefinitions.push(...mod.toolDefinitions);
  Object.assign(allHandlers, mod.handlers);
}

if (enabledCategories.size < Object.keys(CATEGORY_MODULES).length) {
  // stderr only — keeps the stdio MCP channel clean.
  console.error(
    `[bexio-mcp] Tool filter active: ${allDefinitions.length} tools registered from categories [${[...enabledCategories].join(", ")}]`
  );
}

/** Get all tool definitions for registration */
export function getAllToolDefinitions(): Tool[] {
  return allDefinitions;
}

/** Get handler for a specific tool */
export function getHandler(toolName: string): HandlerFn | undefined {
  return allHandlers[toolName];
}

/** Create handler registry bound to a client */
export function createHandlerRegistry(
  client: BexioClient
): Map<string, (args: unknown) => Promise<unknown>> {
  const registry = new Map<string, (args: unknown) => Promise<unknown>>();

  for (const [name, handler] of Object.entries(allHandlers)) {
    registry.set(name, (args: unknown) => handler(client, args));
  }

  return registry;
}
