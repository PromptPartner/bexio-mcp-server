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
import { companyManager } from "../company-manager.js";
import { getEnabledCategories, type ToolCategory } from "./categories.js";
import * as companies from "./companies/index.js";

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

// Multi-company control tools (list_companies / select_company) are registered
// only when BEXIO_API_TOKENS configures more than one company, and are NOT subject
// to the category whitelist — you always need to switch company. Single-company
// setups (BEXIO_API_TOKEN only) are unchanged.
if (process.env["BEXIO_API_TOKENS"]) {
  allDefinitions.push(...companies.toolDefinitions);
  Object.assign(allHandlers, companies.handlers);
}

if (enabledCategories.size < Object.keys(CATEGORY_MODULES).length) {
  // stderr only — keeps the stdio MCP channel clean.
  console.error(
    `[bexio-mcp] Tool filter active: ${allDefinitions.length} tools registered from categories [${[...enabledCategories].join(", ")}]`
  );
}

/** Get all tool definitions for registration */
const ACRONYMS = new Set(["pdf", "iban", "qr", "vat", "id", "uuid", "ui"]);

/** "get_invoice_pdf" -> "Get Invoice PDF": a readable title for hosts and the directory. */
export function toolTitle(name: string): string {
  return name
    .split("_")
    .map((w) => (ACRONYMS.has(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

// Every tool carries a title (and its read-only/destructive hint from the
// definition): hosts use them to decide what to confirm, and Anthropic's
// directory requires them on every tool.
const titledDefinitions: Tool[] = allDefinitions.map((def) => {
  const title = def.annotations?.title ?? toolTitle(def.name);
  return { ...def, title, annotations: { ...def.annotations, title } };
});

// Read-only mode (BEXIO_READ_ONLY=1).
//
// BEXIO_ENABLED_CATEGORIES filters by DOMAIN, and `invoices`, `contacts` and
// `accounting` each contain writes, so it cannot express "reads only". The
// readOnlyHint/destructiveHint annotations are only a signal hosts use to
// decide what to confirm. This gives a server-side switch.
//
// The filter is an ALLOWLIST on `readOnlyHint === true`, never a denylist on
// `destructiveHint`. Concretely: `create_outgoing_payment` carries
// `destructiveHint: false` and no `readOnlyHint`, because in MCP terms
// "non-destructive" means "it creates rather than destroys". A denylist on
// destructiveHint would therefore still expose payment creation. With an
// allowlist, an unannotated tool is excluded — the error falls on the safe
// side.
//
// Both definitions AND handlers are filtered. Filtering definitions alone
// would leave the handler callable by a client that supplies the tool name
// itself: the tool would be hidden, not disabled.
const readOnly = /^(1|true|yes|on)$/i.test(process.env["BEXIO_READ_ONLY"] ?? "");

// BEXIO_ALLOW_TOOLS names individual writes to allow back, by exact tool name.
//
// Read-only alone is rarely what an integration needs: a workflow that creates
// a draft invoice from an external system needs `create_invoice` and nothing
// else that writes. Naming the exceptions keeps the grant small enough to
// audit at a glance, and anything the server gains later is not in the list,
// so it is not reachable.
//
// Only meaningful together with BEXIO_READ_ONLY — without it every tool is
// registered anyway.
const allowedWrites = new Set(
  (process.env["BEXIO_ALLOW_TOOLS"] ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
);

// BEXIO_DENY_TOOLS refuses individual tools by exact name, always, whatever
// else is configured. It is applied LAST and has the final word.
//
// This is the setting for an integration that needs most writes but must never
// reach a few: an assistant that drafts invoices, books bills and files
// expenses, while sending to the customer and initiating payment stay with a
// person. Those acts are not reversible, and a category whitelist cannot
// express them — `send_invoice` lives in the same domain as `create_invoice`.
//
// Pair it with BEXIO_ENABLED_CATEGORIES rather than relying on it alone: drop
// whole domains you never want (payments, banking, reminders, payroll) so that
// tools added to them in future releases are excluded without touching this
// list, and name here only the ones inside the domains you keep.
const deniedTools = new Set(
  (process.env["BEXIO_DENY_TOOLS"] ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
);

const afterReadOnly: Tool[] = readOnly
  ? titledDefinitions.filter(
      (def) => def.annotations?.readOnlyHint === true || allowedWrites.has(def.name)
    )
  : titledDefinitions;

const servedDefinitions: Tool[] = deniedTools.size
  ? afterReadOnly.filter((def) => !deniedTools.has(def.name))
  : afterReadOnly;

const servedNames = new Set(servedDefinitions.map((def) => def.name));

if (deniedTools.size) {
  const refused = [...deniedTools].filter((name) => titledDefinitions.some((d) => d.name === name));
  // A name that matches nothing refuses nothing — safe, but almost always a
  // typo, and a typo here is a tool left reachable. Say so loudly.
  const unknown = [...deniedTools].filter((name) => !titledDefinitions.some((d) => d.name === name));
  console.error(
    `[bexio-mcp] DENIED (${refused.length}): ${refused.join(", ") || "none"}`
  );
  if (unknown.length) {
    console.error(
      `[bexio-mcp] BEXIO_DENY_TOOLS: no such tool, so nothing was refused for: ${unknown.join(", ")} — check the spelling.`
    );
  }
}

if (readOnly) {
  const granted = [...allowedWrites].filter((name) => servedNames.has(name));
  // A name that matches nothing grants nothing — safe, but almost always a
  // typo, so say so rather than let it pass silently.
  const unknown = [...allowedWrites].filter((name) => !servedNames.has(name));
  // stderr only — keeps the stdio MCP channel clean.
  console.error(
    `[bexio-mcp] READ-ONLY: ${servedDefinitions.length} of ${titledDefinitions.length} tools registered. Writes are refused` +
      (granted.length ? ` except: ${granted.join(", ")}.` : ".")
  );
  if (unknown.length) {
    console.error(
      `[bexio-mcp] BEXIO_ALLOW_TOOLS: no such tool, ignored: ${unknown.join(", ")}`
    );
  }
} else if (allowedWrites.size) {
  console.error(
    "[bexio-mcp] BEXIO_ALLOW_TOOLS has no effect without BEXIO_READ_ONLY; all tools are registered."
  );
}

export function getAllToolDefinitions(): Tool[] {
  return servedDefinitions;
}

/** Get handler for a specific tool */
export function getHandler(toolName: string): HandlerFn | undefined {
  // A denied tool is never resolvable, in any mode. Hiding a definition is not
  // the same as disabling a tool: without this, a client that supplies the
  // name itself would still reach the handler.
  if (deniedTools.has(toolName)) return undefined;
  // The read-only guard applies only in that mode: behaviour is unchanged
  // otherwise.
  if (readOnly && !servedNames.has(toolName)) return undefined;
  return allHandlers[toolName];
}

/**
 * Create a handler registry. Each call resolves the CURRENTLY-active company's
 * client via companyManager, so select_company switches affect HTTP calls too
 * (the active company is process-global — see the multi-company caveat).
 */
export function createHandlerRegistry(): Map<string, (args: unknown) => Promise<unknown>> {
  const registry = new Map<string, (args: unknown) => Promise<unknown>>();

  for (const [name, handler] of Object.entries(allHandlers)) {
    registry.set(name, (args: unknown) => handler(companyManager.getActiveClient(), args));
  }

  return registry;
}
