/**
 * Tool category filtering.
 *
 * By default all tool categories are registered (~310 tools). For contexts
 * where token budget matters (e.g. smaller models, focused workflows),
 * categories can be whitelisted via env var:
 *
 *   BEXIO_ENABLED_CATEGORIES=contacts,invoices,purchase,banking
 *
 * Empty/unset = all categories enabled (backward compatible).
 */

export type ToolCategory =
  | "reference"
  | "company"
  | "banking"
  | "projects"
  | "timetracking"
  | "accounting"
  | "purchase"
  | "files"
  | "payroll"
  | "contacts"
  | "invoices"
  | "orders"
  | "quotes"
  | "payments"
  | "reminders"
  | "deliveries"
  | "items"
  | "reports"
  | "users"
  | "misc"
  | "notes"
  | "tasks"
  | "stock"
  | "docs"
  | "positions";

export const ALL_CATEGORIES: ToolCategory[] = [
  "reference",
  "company",
  "banking",
  "projects",
  "timetracking",
  "accounting",
  "purchase",
  "files",
  "payroll",
  "contacts",
  "invoices",
  "orders",
  "quotes",
  "payments",
  "reminders",
  "deliveries",
  "items",
  "reports",
  "users",
  "misc",
  "notes",
  "tasks",
  "stock",
  "docs",
  "positions",
];

/**
 * Parse BEXIO_ENABLED_CATEGORIES env var and return the set of enabled
 * categories. Empty/unset = all enabled.
 */
export function getEnabledCategories(): Set<ToolCategory> {
  const raw = process.env.BEXIO_ENABLED_CATEGORIES?.trim();
  if (!raw) {
    return new Set(ALL_CATEGORIES);
  }

  const allSet = new Set<string>(ALL_CATEGORIES);
  const requested = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);

  const enabled = new Set<ToolCategory>();
  const unknown: string[] = [];

  for (const name of requested) {
    if (allSet.has(name)) {
      enabled.add(name as ToolCategory);
    } else {
      unknown.push(name);
    }
  }

  if (unknown.length > 0) {
    // Logged to stderr (never stdout) to keep the stdio MCP channel clean.
    console.error(
      `[bexio-mcp] BEXIO_ENABLED_CATEGORIES contains unknown categories: ${unknown.join(
        ", "
      )}. Valid: ${ALL_CATEGORIES.join(", ")}`
    );
  }

  if (enabled.size === 0) {
    console.error(
      "[bexio-mcp] BEXIO_ENABLED_CATEGORIES resolved to 0 categories — falling back to all categories."
    );
    return new Set(ALL_CATEGORIES);
  }

  return enabled;
}
