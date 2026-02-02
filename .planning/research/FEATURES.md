# Feature Landscape: Bexio MCP v2

**Domain:** MCP Server for Bexio Swiss Accounting API
**Researched:** 2026-02-01
**Research Confidence:** HIGH (based on official docs.bexio.com and v1 source code analysis)

## Executive Summary

v1 implements 56 tools covering core sales order management (contacts, invoices, quotes, orders, deliveries, payments, reminders) plus items, taxes, comments, contact relations, and custom reports. However, v1 is missing **significant API categories** that represent approximately 40-50% of the Bexio API surface area.

**Major gaps identified:**
- **Projects & Time Tracking** (entire category missing)
- **Banking** (IBAN/QR payments, bank accounts)
- **Accounting** (accounts, manual entries, currencies, business years)
- **Purchase Management** (bills, expenses, purchase orders, outgoing payments)
- **Payroll** (employees, absences)
- **Files** (document management)
- **Reference Data** (contact groups, salutations, titles, countries, languages, units, payment types)

---

## v1 Coverage Analysis

### What v1 Already Implements (56 tools)

| Category | Endpoints | Tools | Coverage |
|----------|-----------|-------|----------|
| Contacts | CRUD + search | 9 | Good, missing groups/sectors |
| Invoices | CRUD + actions + search | 14 | Comprehensive |
| Quotes | CRUD + actions + search | 10 | Comprehensive |
| Orders | CRUD + transformations + search | 7 | Good |
| Deliveries | List/get/issue/search | 4 | Basic |
| Payments (invoice) | CRUD | 4 | Complete for invoice payments |
| Reminders | CRUD + send + search | 8 | Comprehensive |
| Items | CRUD | 3 | Basic, missing search |
| Taxes | List/get | 2 | Read-only (correct for v3 API) |
| Comments | List/create/get | 3 | Missing delete |
| Contact Relations | CRUD + search | 6 | Comprehensive |
| Fictional Users | CRUD | 5 | Complete |
| Reports | Custom analytics | 6 | Custom implementation |
| Document Templates | Referenced but not exposed | 0 | Missing |

---

## Table Stakes

Features users expect for 100% API coverage. Missing = incomplete MCP implementation.

### Priority 1: Core Missing Categories

| Feature | Why Expected | Complexity | API Endpoints | Notes |
|---------|--------------|------------|---------------|-------|
| **Projects (CRUD)** | Time tracking foundation | Medium | GET/POST/DELETE/PATCH /2.0/project | Required for time tracking |
| **Timesheets (CRUD)** | Core time tracking | Medium | GET/POST/DELETE /2.0/timesheet | Main time tracking endpoint |
| **Bank Accounts (read)** | Payment creation requirement | Low | GET /2.0/bank_account | Read-only, needed for payments |
| **Accounts (chart of accounts)** | Accounting foundation | Medium | GET/POST /2.0/account | Required for manual entries |
| **Manual Entries** | Core accounting | High | GET/POST/PUT/DELETE /2.0/manual_entry | Multi-line journal entries |
| **Currencies** | Multi-currency support | Low | GET/POST/DELETE/PATCH /2.0/currency | Swiss business essential |
| **Bills (creditor invoices)** | Supplier invoice management | High | GET/POST/PUT/DELETE /2.0/bill | Purchase module core |
| **Expenses** | Expense tracking | Medium | GET/POST/PUT/DELETE /2.0/expense | Purchase module core |
| **Files** | Document management | Medium | GET/POST/DELETE/PATCH /2.0/file | PDF storage/retrieval |

### Priority 2: Reference Data (Configuration)

| Feature | Why Expected | Complexity | API Endpoints | Notes |
|---------|--------------|------------|---------------|-------|
| Contact Groups | Contact organization | Low | GET/POST/DELETE /2.0/contact_group | Contact categorization |
| Contact Sectors | Industry classification | Low | GET/POST /2.0/contact_sector | Business classification |
| Salutations | Form letters | Low | GET/POST/DELETE /2.0/salutation | Required for doc generation |
| Titles | Academic/professional titles | Low | GET/POST/DELETE /2.0/title | Formal addressing |
| Countries | Address validation | Low | GET/POST/DELETE /2.0/country | Reference data |
| Languages | Multi-language docs | Low | GET/POST /2.0/language | Document language |
| Units | Quantity units | Low | GET/POST/DELETE /2.0/unit | Invoice positions |
| Payment Types | Payment methods | Low | GET/POST /2.0/payment_type | Invoice configuration |
| Additional Addresses | Multiple addresses | Medium | GET/POST/DELETE /2.0/additional_address | Contact extension |

### Priority 3: Banking & Payments

| Feature | Why Expected | Complexity | API Endpoints | Notes |
|---------|--------------|------------|---------------|-------|
| IBAN Payments | Swiss banking standard | High | POST/GET/PATCH /2.0/iban_payment | ISO 20022 compliance |
| QR Payments | Swiss QR-invoice support | High | POST/GET/PATCH /2.0/qr_payment | Swiss payment standard |
| Outgoing Payments | Supplier payments | Medium | GET/POST/PUT/DELETE /2.0/outgoing_payment | Purchase module |

### Priority 4: Purchase Management

| Feature | Why Expected | Complexity | API Endpoints | Notes |
|---------|--------------|------------|---------------|-------|
| Purchase Orders | Supplier ordering | Medium | GET/POST/PUT/DELETE /2.0/purchase_order | Procurement |
| Bill Actions | Issue/pay bills | Medium | Various action endpoints | Workflow completion |

### Priority 5: Extended Features

| Feature | Why Expected | Complexity | API Endpoints | Notes |
|---------|--------------|------------|---------------|-------|
| Employees (payroll) | HR integration | Medium | GET/POST/PATCH /payroll/employee | Requires payroll module |
| Absences | Leave tracking | Medium | GET/POST/PUT/DELETE /payroll/absence | Requires payroll module |
| Milestones | Project management | Low | GET/POST/DELETE /2.0/pr_milestone | Project extension |
| Work Packages | Project management | Low | GET/POST/DELETE/PATCH /2.0/pr_package | Project extension |
| Business Activities | CRM tracking | Low | GET/POST /2.0/business_activity | Activity logging |
| Notes | General notes | Low | GET/POST/DELETE /2.0/note | Already in API, not exposed |
| Tasks | Task management | Low | GET/POST/DELETE /2.0/task | Task tracking |
| Company Profile | Account info | Low | GET /2.0/company_profile | Read-only |
| Permissions | Access control | Low | GET /2.0/permission | Read-only |
| Users (full) | User management | Low | GET/POST/DELETE/PATCH /3.0/users | v3 API |

---

## Differentiators

Features that set MCP apart. Not expected, but provide competitive advantage.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Batch Operations** | Process multiple records in single call | Medium | Not in Bexio API, implement client-side |
| **Smart Search** | Cross-entity search (find all docs for customer) | Medium | Already partially implemented in v1 |
| **Workflow Automation** | Quote->Order->Invoice chains | Low | v1 has transformations, could enhance |
| **PDF Generation/Download** | Get document PDFs via MCP | Medium | Files API enables this |
| **Financial Dashboards** | Pre-built analytics queries | Low | v1 has custom reports, could expand |
| **VAT Reporting** | Swiss VAT period summaries | Medium | Accounting + Tax APIs |
| **Recurring Invoice Templates** | Template-based recurring docs | High | Custom implementation |
| **Contact Enrichment** | Combine contact + relations + addresses | Low | Multi-call aggregation |
| **Document Duplication Detection** | Find duplicate invoices/contacts | Medium | Custom search logic |
| **Audit Trail** | Track document status changes | Low | Already have status APIs |

---

## Anti-Features

Features to explicitly NOT build. Common mistakes in API integrations.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **OAuth Flow Management** | MCP uses static tokens, OAuth adds complexity | Use API token authentication only |
| **Webhook Receivers** | MCP is request-only, not a server | Document that webhooks require separate infrastructure |
| **Caching Layer** | Stale data issues, complexity | Direct API passthrough, let client cache |
| **Rate Limit Management** | Bexio handles this server-side | Implement retry on 429, document limits |
| **Data Transformation** | Lose API fidelity | Return raw API responses with metadata |
| **Partial Updates Without Read** | Risk data loss | Always read before update |
| **Bulk Delete** | Dangerous, no undo | Require individual deletes with confirmation |
| **Direct Database Access** | Bexio is SaaS | Use only official REST API |
| **Legacy Timesheet API** | Deprecated per docs.bexio.com | Use new /2.0/timesheet endpoint |
| **Complex Position Types** | Confusing, error-prone | Start with KbPositionCustom, KbPositionItem, KbPositionText |

---

## Feature Dependencies

```
Core Foundation
    |
    +-- Contact Groups/Sectors --> Contacts (enhanced)
    |
    +-- Currencies --> Invoices/Quotes/Orders (multi-currency)
    |
    +-- Bank Accounts --> IBAN Payments
    |                 --> QR Payments
    |                 --> Outgoing Payments
    |
    +-- Accounts --> Manual Entries
    |           --> Accounting Reports
    |
    +-- Projects --> Timesheets
    |           --> Milestones
    |           --> Work Packages
    |
    +-- Bills --> Outgoing Payments
    |
    +-- Employees --> Absences
                 --> Payroll Documents
```

### Dependency Notes:

1. **Bank Accounts must come before banking features** - IBAN/QR payments require bank_account_id
2. **Accounts must come before Manual Entries** - Journal entries reference account IDs
3. **Projects must come before Timesheets** - Time entries require project_id
4. **Contact Groups before enhanced contacts** - Groups referenced by contact_group_ids

---

## Implementation Priority Matrix

Based on table stakes, dependencies, and complexity.

### Phase 1: Core Reference Data (Low Complexity, Foundational)
| Feature | Endpoints | Est. Effort |
|---------|-----------|-------------|
| Contact Groups | 3 | 2 hours |
| Contact Sectors | 2 | 1 hour |
| Salutations | 4 | 2 hours |
| Titles | 4 | 2 hours |
| Countries | 4 | 2 hours |
| Languages | 2 | 1 hour |
| Units | 3 | 2 hours |
| Payment Types | 2 | 1 hour |
| Company Profile | 2 | 1 hour |
| Permissions | 1 | 30 min |

**Phase 1 Total:** ~20 endpoints, ~14 hours

### Phase 2: Banking Foundation
| Feature | Endpoints | Est. Effort |
|---------|-----------|-------------|
| Bank Accounts (read) | 1 | 1 hour |
| Currencies | 4 | 3 hours |
| IBAN Payments | 3 | 4 hours |
| QR Payments | 3 | 4 hours |

**Phase 2 Total:** ~11 endpoints, ~12 hours

### Phase 3: Projects & Time Tracking
| Feature | Endpoints | Est. Effort |
|---------|-----------|-------------|
| Projects | 4 | 4 hours |
| Project Types/Statuses | 2 | 1 hour |
| Milestones | 3 | 2 hours |
| Work Packages | 4 | 3 hours |
| Timesheets | 3 | 3 hours |
| Timesheet Statuses | 1 | 30 min |
| Business Activities | 2 | 1 hour |
| Communication Types | 2 | 1 hour |

**Phase 3 Total:** ~21 endpoints, ~16 hours

### Phase 4: Accounting
| Feature | Endpoints | Est. Effort |
|---------|-----------|-------------|
| Accounts | 3 | 3 hours |
| Account Groups | 1 | 1 hour |
| Calendar Years | 2 | 1 hour |
| Business Years | 1 | 1 hour |
| Manual Entries | 4 | 6 hours |
| VAT Periods | 1 | 1 hour |
| Accounting Reports/Journal | 1 | 2 hours |

**Phase 4 Total:** ~13 endpoints, ~15 hours

### Phase 5: Purchase Management
| Feature | Endpoints | Est. Effort |
|---------|-----------|-------------|
| Bills | 5+ | 6 hours |
| Expenses | 6 | 5 hours |
| Purchase Orders | 4 | 4 hours |
| Outgoing Payments | 5 | 4 hours |

**Phase 5 Total:** ~20 endpoints, ~19 hours

### Phase 6: Files & Documents
| Feature | Endpoints | Est. Effort |
|---------|-----------|-------------|
| Files | 4 | 5 hours |
| Document Templates | 1 | 1 hour |
| Additional Addresses | 3 | 2 hours |

**Phase 6 Total:** ~8 endpoints, ~8 hours

### Phase 7: Payroll & HR (Optional - Requires Module)
| Feature | Endpoints | Est. Effort |
|---------|-----------|-------------|
| Employees | 3 | 4 hours |
| Absences | 5 | 4 hours |
| Payroll Documents | 1 | 2 hours |

**Phase 7 Total:** ~9 endpoints, ~10 hours

### Phase 8: Extended Features
| Feature | Endpoints | Est. Effort |
|---------|-----------|-------------|
| Notes | 4 | 2 hours |
| Tasks | 5 | 3 hours |
| Task Priorities/Statuses | 2 | 1 hour |
| Users (v3 API) | 4 | 3 hours |

**Phase 8 Total:** ~15 endpoints, ~9 hours

---

## Deprecated v1 Endpoints

Based on Bexio API documentation review:

| v1 Endpoint | Status | Action Required |
|-------------|--------|-----------------|
| Timesheets (legacy) | DEPRECATED | Use /2.0/timesheet instead of legacy /monitoring |
| IdP Authentication | Deprecated 2025-03-31 | v1 uses token auth, not affected |

**Note:** v1's implementation appears to use the correct v2/v3 APIs. No deprecated endpoints found in current v1 code.

---

## v1 Gaps Summary (Missing for 100% Coverage)

### By Category

| Category | Missing Endpoints | Priority |
|----------|-------------------|----------|
| **Reference Data** | ~27 endpoints | P1 |
| **Banking** | ~7 endpoints | P2 |
| **Projects/Time** | ~21 endpoints | P3 |
| **Accounting** | ~13 endpoints | P4 |
| **Purchase** | ~20 endpoints | P5 |
| **Files** | ~8 endpoints | P6 |
| **Payroll** | ~9 endpoints (optional) | P7 |
| **Extended** | ~15 endpoints | P8 |

**Total Missing:** ~120 new endpoints needed

### Estimated Total Effort

| Phase | Endpoints | Hours |
|-------|-----------|-------|
| Phase 1 (Reference) | 20 | 14 |
| Phase 2 (Banking) | 11 | 12 |
| Phase 3 (Projects) | 21 | 16 |
| Phase 4 (Accounting) | 13 | 15 |
| Phase 5 (Purchase) | 20 | 19 |
| Phase 6 (Files) | 8 | 8 |
| Phase 7 (Payroll) | 9 | 10 |
| Phase 8 (Extended) | 15 | 9 |
| **TOTAL** | **~120** | **~100 hours** |

---

## Sources

**HIGH Confidence (Official):**
- [Bexio API Documentation](https://docs.bexio.com/) - Primary source for all endpoints
- [Bexio Developer Portal](https://developer.bexio.com/) - Authentication and getting started
- v1 source code analysis (`mcp_bexio-main-v1/src/server.ts`, `bexio-client.ts`)

**MEDIUM Confidence (Verified with multiple sources):**
- [Bexio API Tracker](https://apitracker.io/a/bexio) - API overview
- [bexio_api_client Elixir](https://hexdocs.pm/bexio_api_client/api-reference.html) - Module structure
- [Laravel Bexio Package](https://github.com/codebar-ag/laravel-bexio) - Endpoint examples

**LOW Confidence (Needs validation):**
- Specific payroll endpoint paths (requires Bexio payroll module to verify)
- Exact position type endpoint structure (KbPositionCustom vs KbPositionItem)
