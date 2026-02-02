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

// Domain imports
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

// Type for handler functions
export type HandlerFn = (
  client: BexioClient,
  args: unknown
) => Promise<unknown>;

// Aggregate all tool definitions (83 total)
const allDefinitions: Tool[] = [
  ...contacts.toolDefinitions,   // 7 tools
  ...invoices.toolDefinitions,   // 15 tools
  ...orders.toolDefinitions,     // 7 tools
  ...quotes.toolDefinitions,     // 11 tools
  ...payments.toolDefinitions,   // 4 tools
  ...reminders.toolDefinitions,  // 8 tools
  ...deliveries.toolDefinitions, // 4 tools
  ...items.toolDefinitions,      // 5 tools
  ...reports.toolDefinitions,    // 7 tools
  ...users.toolDefinitions,      // 6 tools
  ...misc.toolDefinitions,       // 9 tools
];

// Aggregate all handlers
const allHandlers: Record<string, HandlerFn> = {
  ...contacts.handlers,
  ...invoices.handlers,
  ...orders.handlers,
  ...quotes.handlers,
  ...payments.handlers,
  ...reminders.handlers,
  ...deliveries.handlers,
  ...items.handlers,
  ...reports.handlers,
  ...users.handlers,
  ...misc.handlers,
};

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
