# Phase 4: Purchase, Files & Payroll - Context

**Gathered:** 2026-02-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete procurement cycle tools (bills/creditor invoices, expenses, purchase orders, outgoing payments), file/document management, and conditional payroll features (employees, absences). Payroll tools are conditional on Bexio module availability.

</domain>

<decisions>
## Implementation Decisions

### Bills, Expenses, Purchase Orders
- Follow established patterns from invoices/orders (Phase 1)
- Same CRUD + search + action patterns
- Bill actions: issue, mark paid (similar to invoice workflow)
- Outgoing payments linked to bills (like incoming payments to invoices)

### Files & Documents
- Follow established patterns
- Standard upload/download/list operations
- File metadata handling per Bexio API conventions

### Payroll Module Detection
- Friendly error messages when module unavailable
- Example: "Payroll module not enabled in your Bexio account. Enable it at..."
- Not technical/terse — explain the situation helpfully

### Claude's Discretion
- Detection strategy (probe on first call vs per-call)
- Tool visibility when module unavailable
- Whether to suggest workarounds when payroll unavailable
- File type restrictions and size limit handling

</decisions>

<specifics>
## Specific Ideas

No specific requirements — follow established patterns from Phases 1-3.

The key principle: payroll should fail gracefully with helpful messaging, not cryptic errors.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-purchase-files-payroll*
*Context gathered: 2026-02-01*
