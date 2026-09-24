/**
 * Accounting domain module.
 * Exports tool definitions and handlers for accounting operations.
 *
 * ACCT-01: Accounts (Chart of Accounts) - 4 tools
 * ACCT-02: Account Groups - 1 tool (read-only)
 * ACCT-03: Calendar Years - 2 tools
 * ACCT-04: Business Years - 1 tool (read-only)
 * ACCT-05: Manual Entries - 6 tools (incl. group entries / Sammelbuchung)
 * ACCT-06: VAT Periods - 1 tool (read-only)
 * ACCT-07: Journal - 1 tool
 * ACCT-08: Account balances (Saldenliste, computed) - 1 tool
 *
 * Total: 17 tools
 */

export { toolDefinitions } from "./definitions.js";
export { handlers } from "./handlers.js";
