# Requirements: Bexio MCP v2

**Defined:** 2026-02-01
**Core Value:** Enable anyone to connect Claude Desktop to their Bexio accounting system with zero friction

## v2.0 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation

- [x] **FOUND-01**: Upgrade SDK from 0.5.0 to 1.25.2 with all breaking changes addressed
- [x] **FOUND-02**: Refactor server.ts (2,418 lines) into domain-organized modules (<200 lines each)
- [ ] **FOUND-03**: Create MCPB bundle with manifest.json for one-click Claude Desktop install
- [ ] **FOUND-04**: Publish npm package with bin field for `npx @bexio/mcp-server` usage
- [x] **FOUND-05**: Maintain dual transport (stdio for Claude Desktop, HTTP for n8n)
- [x] **FOUND-06**: Pin Zod to v3.22.x to avoid SDK compatibility issues
- [x] **FOUND-07**: Configure stderr-only logging to prevent stdout contamination

### Existing Tools (Backward Compatibility)

- [x] **EXIST-01**: Preserve all 83 v1 tool names exactly (no renaming)
- [x] **EXIST-02**: Contacts: list, get, search, advanced_search, find_by_number, find_by_name, update (7 tools)
- [x] **EXIST-03**: Invoices: list, list_all, get, search, search_by_customer, create, issue, cancel, mark_sent, send, copy, statuses, list_all_statuses, get_open, get_overdue (15 tools)
- [x] **EXIST-04**: Quotes: list, get, create, search, search_by_customer, issue, accept, decline, send, create_order_from, create_invoice_from (11 tools)
- [x] **EXIST-05**: Orders: list, get, create, search, search_by_customer, create_delivery_from, create_invoice_from (7 tools)
- [x] **EXIST-06**: Payments: list, get, create, delete (4 tools)
- [x] **EXIST-07**: Reminders: list, get, create, delete, mark_sent, send, search, get_sent_this_week (8 tools)
- [x] **EXIST-08**: Deliveries: list, get, issue, search (4 tools)
- [x] **EXIST-09**: Items & Taxes: list, get, create items; list, get taxes (5 tools)
- [x] **EXIST-10**: Reports: revenue, customer_revenue, invoice_status, overdue_invoices, monthly_revenue, top_customers, tasks_due_this_week (7 tools)
- [x] **EXIST-11**: Users: current_user, fictional_users CRUD (6 tools)
- [x] **EXIST-12**: Comments & Relations: list, get, create comments; relations CRUD + search (9 tools)

### Reference Data (New)

- [ ] **REFDATA-01**: Contact groups: list, get, create, delete
- [ ] **REFDATA-02**: Contact sectors: list, get, create
- [ ] **REFDATA-03**: Salutations: list, get, create, delete
- [ ] **REFDATA-04**: Titles: list, get, create, delete
- [ ] **REFDATA-05**: Countries: list, get, create, delete
- [ ] **REFDATA-06**: Languages: list, get, create
- [ ] **REFDATA-07**: Units: list, get, create, delete
- [ ] **REFDATA-08**: Payment types: list, get, create
- [ ] **REFDATA-09**: Company profile: get, update
- [ ] **REFDATA-10**: Permissions: list

### Banking (New)

- [ ] **BANK-01**: Bank accounts: list, get (read-only)
- [ ] **BANK-02**: Currencies: list, get, create, delete, update
- [ ] **BANK-03**: IBAN payments: create, get, update (Swiss ISO 20022)
- [ ] **BANK-04**: QR payments: create, get, update (Swiss QR-invoice standard)

### Projects & Time Tracking (New)

- [ ] **PROJ-01**: Projects: list, get, create, update, delete
- [ ] **PROJ-02**: Project types: list, get
- [ ] **PROJ-03**: Project statuses: list, get
- [ ] **PROJ-04**: Milestones: list, get, create, delete
- [ ] **PROJ-05**: Work packages: list, get, create, update, delete
- [ ] **PROJ-06**: Timesheets: list, get, create, delete
- [ ] **PROJ-07**: Timesheet statuses: list
- [ ] **PROJ-08**: Business activities: list, get, create
- [ ] **PROJ-09**: Communication types: list, get

### Accounting (New)

- [ ] **ACCT-01**: Accounts (chart of accounts): list, get, create
- [ ] **ACCT-02**: Account groups: list
- [ ] **ACCT-03**: Calendar years: list, get
- [ ] **ACCT-04**: Business years: list
- [ ] **ACCT-05**: Manual entries: list, get, create, update, delete
- [ ] **ACCT-06**: VAT periods: list
- [ ] **ACCT-07**: Accounting journal: get

### Purchase Management (New)

- [ ] **PURCH-01**: Bills (creditor invoices): list, get, create, update, delete
- [ ] **PURCH-02**: Bill actions: issue, mark paid
- [ ] **PURCH-03**: Expenses: list, get, create, update, delete
- [ ] **PURCH-04**: Purchase orders: list, get, create, update, delete
- [ ] **PURCH-05**: Outgoing payments: list, get, create, update, delete

### Files & Documents (New)

- [ ] **FILES-01**: Files: list, get, create, delete, update
- [ ] **FILES-02**: File download: get file content/PDF
- [ ] **FILES-03**: Additional addresses: list, get, create, delete

### Payroll (Conditional - requires Bexio payroll module)

- [ ] **PAY-01**: Employees: list, get, create, update
- [ ] **PAY-02**: Absences: list, get, create, update, delete
- [ ] **PAY-03**: Payroll documents: list

### MCP Apps / UI Elements (New)

- [ ] **UI-01**: Implement MCP Apps capability declaration
- [ ] **UI-02**: Invoice preview UI resource (HTML template)
- [ ] **UI-03**: Contact card UI resource (HTML template)
- [ ] **UI-04**: Dashboard summary UI resource (optional)

### Distribution

- [ ] **DIST-01**: Submit MCPB bundle to MCP Registry
- [ ] **DIST-02**: Publish npm package to public registry
- [ ] **DIST-03**: Create GitHub release with source and bundle
- [ ] **DIST-04**: Write installation documentation for all channels

## v2.x Requirements (Deferred)

Acknowledged but deferred to future releases.

### Extended Features

- **EXT-01**: Tool consolidation (reduce 83 tools to 15-30 polymorphic tools)
- **EXT-02**: Notes: list, get, create, delete
- **EXT-03**: Tasks: list, get, create, update, delete with priorities/statuses
- **EXT-04**: Users v3 API: full user management
- **EXT-05**: Advanced MCP Apps (data grids, interactive forms)
- **EXT-06**: Caching layer for frequently accessed reference data
- **EXT-07**: Batch operations for bulk processing

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Mobile app | Web/desktop only for v2 |
| OAuth flow | API token is sufficient and simpler |
| Real-time webhooks | MCP is request/response, not push |
| Multi-company support | Single Bexio account per installation |
| Legacy timesheet API | Deprecated per Bexio docs |
| Custom caching | Stateless design for simplicity |
| SDK v2.0 (when released) | Build on stable v1.25.x, upgrade later |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Complete |
| FOUND-02 | Phase 1 | Complete |
| FOUND-03 | Phase 5 | Pending |
| FOUND-04 | Phase 5 | Pending |
| FOUND-05 | Phase 1 | Complete |
| FOUND-06 | Phase 1 | Complete |
| FOUND-07 | Phase 1 | Complete |
| EXIST-01 | Phase 1 | Complete |
| EXIST-02 | Phase 1 | Complete |
| EXIST-03 | Phase 1 | Complete |
| EXIST-04 | Phase 1 | Complete |
| EXIST-05 | Phase 1 | Complete |
| EXIST-06 | Phase 1 | Complete |
| EXIST-07 | Phase 1 | Complete |
| EXIST-08 | Phase 1 | Complete |
| EXIST-09 | Phase 1 | Complete |
| EXIST-10 | Phase 1 | Complete |
| EXIST-11 | Phase 1 | Complete |
| EXIST-12 | Phase 1 | Complete |
| REFDATA-01 | Phase 2 | Pending |
| REFDATA-02 | Phase 2 | Pending |
| REFDATA-03 | Phase 2 | Pending |
| REFDATA-04 | Phase 2 | Pending |
| REFDATA-05 | Phase 2 | Pending |
| REFDATA-06 | Phase 2 | Pending |
| REFDATA-07 | Phase 2 | Pending |
| REFDATA-08 | Phase 2 | Pending |
| REFDATA-09 | Phase 2 | Pending |
| REFDATA-10 | Phase 2 | Pending |
| BANK-01 | Phase 2 | Pending |
| BANK-02 | Phase 2 | Pending |
| BANK-03 | Phase 2 | Pending |
| BANK-04 | Phase 2 | Pending |
| PROJ-01 | Phase 3 | Pending |
| PROJ-02 | Phase 3 | Pending |
| PROJ-03 | Phase 3 | Pending |
| PROJ-04 | Phase 3 | Pending |
| PROJ-05 | Phase 3 | Pending |
| PROJ-06 | Phase 3 | Pending |
| PROJ-07 | Phase 3 | Pending |
| PROJ-08 | Phase 3 | Pending |
| PROJ-09 | Phase 3 | Pending |
| ACCT-01 | Phase 3 | Pending |
| ACCT-02 | Phase 3 | Pending |
| ACCT-03 | Phase 3 | Pending |
| ACCT-04 | Phase 3 | Pending |
| ACCT-05 | Phase 3 | Pending |
| ACCT-06 | Phase 3 | Pending |
| ACCT-07 | Phase 3 | Pending |
| PURCH-01 | Phase 4 | Pending |
| PURCH-02 | Phase 4 | Pending |
| PURCH-03 | Phase 4 | Pending |
| PURCH-04 | Phase 4 | Pending |
| PURCH-05 | Phase 4 | Pending |
| FILES-01 | Phase 4 | Pending |
| FILES-02 | Phase 4 | Pending |
| FILES-03 | Phase 4 | Pending |
| PAY-01 | Phase 4 | Pending |
| PAY-02 | Phase 4 | Pending |
| PAY-03 | Phase 4 | Pending |
| UI-01 | Phase 5 | Pending |
| UI-02 | Phase 5 | Pending |
| UI-03 | Phase 5 | Pending |
| UI-04 | Phase 5 | Pending |
| DIST-01 | Phase 6 | Pending |
| DIST-02 | Phase 6 | Pending |
| DIST-03 | Phase 6 | Pending |
| DIST-04 | Phase 6 | Pending |

**Coverage:**
- v2.0 requirements: 67 total
- Mapped to phases: 67
- Unmapped: 0

---
*Requirements defined: 2026-02-01*
*Last updated: 2026-02-01 after roadmap creation*
