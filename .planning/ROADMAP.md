# Roadmap: Bexio MCP v2

## Overview

This roadmap transforms the v1 Bexio MCP server (83 tools, SDK 0.5.0, 2,418-line monolith) into a modern v2 distribution with one-click installation, complete API coverage, and modular architecture. The journey starts with SDK migration and architectural refactoring, expands to full Bexio API coverage across 8 feature domains, and culminates in MCPB packaging for zero-friction installation.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Migration** - SDK upgrade, modular architecture, existing 83 tools working
- [x] **Phase 2: Reference Data & Banking** - Foundational configuration data, Swiss banking/payments
- [x] **Phase 3: Projects & Accounting** - Time tracking, project management, chart of accounts, manual entries
- [x] **Phase 4: Purchase, Files & Payroll** - Bills, expenses, documents, HR (conditional)
- [ ] **Phase 5: UI & Packaging** - MCP Apps capability, MCPB bundle, npm package
- [ ] **Phase 6: Distribution** - MCP Registry, npm publish, GitHub release, documentation

## Phase Details

### Phase 1: Foundation & Migration
**Goal**: Establish stable v2 foundation with all 56 existing tools working on SDK 1.25.2 in modular architecture
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-05, FOUND-06, FOUND-07, EXIST-01 through EXIST-12
**Success Criteria** (what must be TRUE):
  1. Server starts with SDK 1.25.2 and accepts tool calls via stdio transport
  2. All 56 existing v1 tools respond correctly (backward compatible)
  3. Tool code is organized into domain modules (contacts/, invoices/, etc.) with <200 lines each
  4. HTTP transport works for n8n/remote access (dual transport maintained)
  5. No stdout contamination - all logs go to stderr only
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md - SDK Migration: Upgrade to 1.25.2, fix breaking changes, pin Zod 3.22.x
- [x] 01-02-PLAN.md - Modular Architecture: Create types/, shared/, tools/ structure with aggregation patterns
- [x] 01-03-PLAN.md - Tool Migration: Migrate all 83 tools to new structure, add HTTP transport, validate backward compatibility

### Phase 2: Reference Data & Banking
**Goal**: Complete foundational data APIs and Swiss-standard banking/payment tools
**Depends on**: Phase 1
**Requirements**: REFDATA-01 through REFDATA-10, BANK-01 through BANK-04
**Success Criteria** (what must be TRUE):
  1. User can list and manage contact groups, sectors, salutations, titles
  2. User can query countries, languages, currencies, units, payment types
  3. User can view and update company profile
  4. User can view bank accounts and create IBAN/QR payments (Swiss standards)
  5. Currency management works for multi-currency invoicing
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md - Reference Data Tools: Contact groups, sectors, salutations, titles, countries, languages, units (26 tools)
- [x] 02-02-PLAN.md - Company & Payments Config: Company profile, permissions, payment types (6 tools)
- [x] 02-03-PLAN.md - Banking Tools: Bank accounts, currencies, IBAN payments, QR payments (13 tools)

### Phase 3: Projects & Accounting
**Goal**: Complete project management, time tracking, and accounting foundation
**Depends on**: Phase 2 (currencies needed for accounting)
**Requirements**: PROJ-01 through PROJ-09, ACCT-01 through ACCT-07
**Success Criteria** (what must be TRUE):
  1. User can create and manage projects with types and statuses
  2. User can track time with timesheets linked to projects
  3. User can manage milestones and work packages within projects
  4. User can view chart of accounts and create manual journal entries
  5. User can query business years, calendar years, and VAT periods
**Plans**: 4 plans

Plans:
- [x] 03-01-PLAN.md - Projects Core: Projects CRUD, search, archive/unarchive, project types, project statuses (12 tools)
- [x] 03-02-PLAN.md - Project Nested Resources: Milestones, work packages (nested under projects) (9 tools)
- [x] 03-03-PLAN.md - Time Tracking: Timesheets, statuses, business activities, communication types (11 tools)
- [x] 03-04-PLAN.md - Accounting Foundation: Accounts, account groups, years, manual entries, VAT periods, journal (15 tools)

### Phase 4: Purchase, Files & Payroll
**Goal**: Complete procurement cycle, document management, and conditional payroll
**Depends on**: Phase 3 (accounting required for bills/expenses)
**Requirements**: PURCH-01 through PURCH-05, FILES-01 through FILES-03, PAY-01 through PAY-03
**Success Criteria** (what must be TRUE):
  1. User can create and manage bills (creditor invoices) with issue/paid actions
  2. User can track expenses and purchase orders
  3. User can manage outgoing payments linked to bills
  4. User can upload, list, and download files/documents
  5. User can manage employees and absences (when Bexio payroll module is active)
**Plans**: 4 plans

Plans:
- [x] 04-01-PLAN.md - Bills & Expenses: Bills CRUD, search, actions (issue, mark paid), expenses CRUD (13 tools)
- [x] 04-02-PLAN.md - Purchase Orders & Outgoing Payments: Purchase orders CRUD, outgoing payments linked to bills (10 tools)
- [x] 04-03-PLAN.md - Files & Documents: Files CRUD, download, additional addresses (10 tools)
- [x] 04-04-PLAN.md - Payroll (Conditional): Employees, absences, payroll documents with module detection (10 tools)

### Phase 5: UI & Packaging
**Goal**: Add MCP Apps UI elements and create distribution-ready MCPB bundle
**Depends on**: Phase 4 (all tools must be implemented before bundling)
**Requirements**: UI-01 through UI-04, FOUND-03, FOUND-04
**Success Criteria** (what must be TRUE):
  1. Server declares MCP Apps capability with ui:// resources
  2. Invoice preview renders as rich HTML when requested
  3. Contact card displays formatted contact information
  4. MCPB bundle passes validation and installs with double-click
  5. npm package runs correctly via npx @bexio/mcp-server
**Plans**: 3 plans

Plans:
- [ ] 05-01-PLAN.md - MCP Apps Implementation: UI tools (preview_invoice, show_contact_card, show_dashboard), HTML templates, Vite bundling
- [ ] 05-02-PLAN.md - MCPB Bundle: manifest.json, icon, user_config, mcpb pack validation
- [ ] 05-03-PLAN.md - npm Package: Scoped package name, bin field, shebang, LICENSE, README

### Phase 6: Distribution
**Goal**: Publish to all distribution channels with installation documentation
**Depends on**: Phase 5 (bundle and package must be ready)
**Requirements**: DIST-01 through DIST-04
**Success Criteria** (what must be TRUE):
  1. MCPB bundle is listed in MCP Registry and discoverable
  2. npm package is published to public registry and installable
  3. GitHub release contains source code and .mcpb bundle
  4. Installation documentation covers all three channels (MCPB, npm, source)
**Plans**: TBD

Plans:
- [ ] 06-01: Registry & npm - Submit to MCP Registry, publish npm package
- [ ] 06-02: GitHub & Docs - Create release with assets, write installation guide for all channels

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Migration | 3/3 | **Complete** | 2026-02-01 |
| 2. Reference Data & Banking | 3/3 | **Complete** | 2026-02-01 |
| 3. Projects & Accounting | 4/4 | **Complete** | 2026-02-01 |
| 4. Purchase, Files & Payroll | 4/4 | **Complete** | 2026-02-01 |
| 5. UI & Packaging | 0/3 | Not started | - |
| 6. Distribution | 0/2 | Not started | - |

---
*Roadmap created: 2026-02-01*
*Phase 1 complete: 2026-02-01*
*Phase 2 complete: 2026-02-01*
*Phase 3 complete: 2026-02-01*
*Phase 4 complete: 2026-02-01*
*Total requirements: 67 | Phases: 6 | Plans: 19 (estimated)*
