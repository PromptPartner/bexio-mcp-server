# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-01)

**Core value:** Enable anyone to connect Claude Desktop to their Bexio accounting system with zero friction
**Current focus:** Phase 6 - Distribution (next)

## Current Position

Phase: 6 of 6 (Distribution)
Plan: 1 of 4 in current phase
Status: **In Progress** - Package configuration complete
Last activity: 2026-02-02 -- Completed 06-01 (Distribution Package Configuration)

Progress: [##################--] 95%

## Performance Metrics

**Velocity:**
- Total plans completed: 18
- Average duration: 6.1 min
- Total execution time: 109 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-migration | 3/3 | 26 min | 8.7 min |
| 02-reference-data-banking | 3/3 | 21 min | 7.0 min |
| 03-projects-accounting | 4/4 | 15 min | 3.8 min |
| 04-purchase-files-payroll | 4/4 | 22 min | 5.5 min |
| 05-ui-packaging | 3/3 | 29 min | 9.7 min |

**Recent Trend:**
- Last 5 plans: 05-01 (5 min), 05-02 (5 min), 05-03 (7 min), 05-02 (5 min), 06-01 (3 min)
- Trend: Consistent pace with infrastructure/packaging work

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: 6 phases derived from 67 requirements (Quick depth compression)
- [Roadmap]: FOUND-03/FOUND-04 assigned to Phase 5 (packaging after all tools)
- [Roadmap]: Payroll tools (PAY-*) conditional on Bexio module availability
- [Planning]: v1 has 83 tools (not 56 as initially documented) - updated all plans
- [Planning]: Zod pinned to exactly 3.22.5 (not ^3.22.0) to avoid v4 issues
- [Planning]: Wave structure: SDK (1) -> Architecture (2) -> Tools (3)
- [01-01]: SDK import from /server/mcp.js (not /server/index.js) per 1.25.2 convention
- [01-01]: All logging via console.error() to preserve stdout for JSON-RPC
- [01-02]: McpResponse needs index signature for SDK 1.25.2 compatibility
- [01-02]: Tool definitions use empty Zod schema; validation in handlers
- [01-03]: All 83 tool names preserved exactly from v1 for backward compatibility
- [01-03]: HTTP transport uses Fastify with CORS for n8n compatibility
- [01-03]: Reports computed from invoice data (no separate Bexio reports API)
- [02-01]: 26 reference tools (not 28) - sectors and languages have no delete API
- [02-03]: Flat MCP params transformed to nested Bexio API structure in handlers
- [02-03]: Structured addresses only (type S) for Swiss payments - combined deprecated
- [02-03]: Currency restricted to CHF/EUR for Swiss IBAN/QR payments
- [03-01]: Search criteria as array of {field, value, criteria?} for project search
- [03-01]: Archive/unarchive as separate tools (explicit user intent)
- [03-03]: Duration format HH:MM with Zod regex validation (Bexio API requirement)
- [03-04]: Flat MCP params for manual entries, handler transforms to nested entries array
- [03-04]: Read-only for account groups, business years, VAT periods (Bexio API limitation)
- [03-02]: Nested URL pattern /pr_project/{id}/resource for milestones and work packages
- [04-01]: Standard CRUD pattern for bills and expenses (mirrors sales invoices)
- [04-01]: Search criteria array for bills (consistent with project search)
- [04-02]: Outgoing payments use nested URL /kb_bill/{id}/payment (mirrors incoming payments)
- [04-02]: Purchase orders use flat /purchase_order endpoint
- [04-03]: Base64 encoding for file content (MCP JSON transport requirement)
- [04-03]: Additional addresses nested under contacts via contact_id parameter
- [04-04]: Probe-on-first-call pattern for payroll module detection (not startup)
- [04-04]: Cache module availability result for session duration
- [04-04]: Friendly multi-line error with upgrade instructions when payroll unavailable
- [05-01]: MCP Apps via @modelcontextprotocol/ext-apps for UI rendering
- [05-01]: vite-plugin-singlefile for bundling HTML/CSS/JS into single file
- [05-03]: @bexio/mcp-server scoped npm package name
- [05-03]: zod 3.25.76 (not 3.22.5) for ext-apps peer dependency compatibility
- [05-03]: Conditional build:ui to allow build before UI files exist
- [05-02]: MCPB manifest version 0.2 schema (current stable)
- [05-02]: Copy src/dist to root/dist for MCPB bundling
- [06-01]: Package scope changed from @bexio to @promptpartner
- [06-01]: Tool annotations not added (mcpb v2.1.2 schema unsupported)

### Pending Todos

None.

### Blockers/Concerns

- ~~SDK migration from 0.5.0 to 1.25.2 has limited official documentation~~ RESOLVED in 01-01
- ~~Swiss QR-invoice spec compliance needs research (Phase 2)~~ RESOLVED in 02-03
- ~~MCP Apps (UI-*) based on SEP-1865 proposal, not yet stable (Phase 5 risk)~~ RESOLVED in 05-01
- ~~UI files (src/ui/*) needed for 05-02~~ RESOLVED - bundle includes UI resources

## Session Continuity

Last session: 2026-02-02
Stopped at: Completed 06-01 (Distribution Package Configuration)
Resume file: None

## Phase 1 Plans (COMPLETE)

| Plan | Wave | Description | Status |
|------|------|-------------|--------|
| 01-01-PLAN.md | 1 | SDK Migration (1.25.2, Zod pin, logger) | COMPLETE |
| 01-02-PLAN.md | 2 | Modular Architecture (types, shared, contacts pattern) | COMPLETE |
| 01-03-PLAN.md | 3 | Tool Migration (83 tools) + HTTP transport | COMPLETE |

## Phase 2 Plans (COMPLETE)

| Plan | Wave | Description | Status |
|------|------|-------------|--------|
| 02-01-PLAN.md | 1 | Reference Data Tools (26 tools) | COMPLETE |
| 02-02-PLAN.md | 1 | Company & Payments Config (6 tools) | COMPLETE |
| 02-03-PLAN.md | 1 | Banking Tools (13 tools) | COMPLETE |

## Phase 3 Plans (COMPLETE)

| Plan | Wave | Description | Status |
|------|------|-------------|--------|
| 03-01-PLAN.md | 1 | Projects Core (12 tools) | COMPLETE |
| 03-02-PLAN.md | 2 | Project Nested Resources (9 tools) | COMPLETE |
| 03-03-PLAN.md | 1 | Time Tracking Tools (11 tools) | COMPLETE |
| 03-04-PLAN.md | 1 | Accounting Foundation (15 tools) | COMPLETE |

## Phase 4 Plans (COMPLETE)

| Plan | Wave | Description | Status |
|------|------|-------------|--------|
| 04-01-PLAN.md | 1 | Bills & Expenses (13 tools) | COMPLETE |
| 04-02-PLAN.md | 1 | Purchase Orders & Outgoing Payments (10 tools) | COMPLETE |
| 04-03-PLAN.md | 1 | Files & Additional Addresses (10 tools) | COMPLETE |
| 04-04-PLAN.md | 1 | Payroll with module detection (10 tools) | COMPLETE |

## Phase 5 Plans (COMPLETE)

| Plan | Wave | Description | Status |
|------|------|-------------|--------|
| 05-01-PLAN.md | 1 | MCP Apps UI Resources (3 UI tools) | COMPLETE |
| 05-02-PLAN.md | 2 | MCPB Bundle Packaging | COMPLETE |
| 05-03-PLAN.md | 1 | npm package configuration | COMPLETE |

## Phase 6 Plans (IN PROGRESS)

| Plan | Wave | Description | Status |
|------|------|-------------|--------|
| 06-01-PLAN.md | 1 | Distribution Package Configuration | COMPLETE |
| 06-02-PLAN.md | 1 | npm Publishing & GitHub Release | PENDING |
| 06-03-PLAN.md | 2 | MCP Registry Submission | PENDING |
| 06-04-PLAN.md | 2 | Final Documentation | PENDING |

## Phase 1 Deliverables

- 83 tools in 10 domain modules
- Dual transport: stdio (Claude Desktop) + HTTP (n8n)
- SDK 1.25.2 with Zod 3.22.5
- Type-safe handler architecture
- No console.log contamination

## Phase 2 Deliverables

- 26 reference data tools (contact groups, sectors, salutations, titles, countries, languages, units)
- 6 company tools (company profile, permissions, payment types)
- 13 banking tools (bank accounts, currencies, IBAN payments, QR payments)
- Swiss payment compliance (ISO 20022, QR-bill v2.3, structured addresses)
- Total tools: 128 (83 base + 45 Phase 2)

## Phase 3 Deliverables

- 12 project tools (projects CRUD, archive/unarchive, search, types, statuses)
- 9 nested resource tools (milestones, work packages)
- 11 time tracking tools (timesheets CRUD, search, statuses, business activities, communication types)
- 15 accounting tools (accounts, account groups, years, manual entries, VAT periods, journal)
- Duration validation: HH:MM format enforced via Zod regex
- Flat-to-nested transformation for manual entries
- Total tools: 175 (128 + 47 Phase 3)

## Phase 4 Deliverables

- 8 bill tools (list, get, create, update, delete, search, issue, mark_as_paid)
- 5 expense tools (list, get, create, update, delete)
- 5 purchase order tools (list, get, create, update, delete)
- 5 outgoing payment tools (list, get, create, update, delete - nested under bills)
- 6 file tools (list, get, upload, download, update, delete)
- 4 additional address tools (list, get, create, delete - nested under contacts)
- 4 employee tools (list, get, create, update - conditional)
- 5 absence tools (list, get, create, update, delete - conditional)
- 1 payroll documents tool (list - conditional)
- Conditional module detection with probe-on-first-call caching
- Total tools: 218 (175 + 43 Phase 4)

## Phase 5 Deliverables

- MCP Apps SDK integration (@modelcontextprotocol/ext-apps)
- Vite build configuration for single-file HTML apps
- npm package configuration (@bexio/mcp-server)
- CLI binary (bexio-mcp-server)
- LICENSE (MIT) and README.md for npm
- 3 UI tools with HTML resources:
  - preview_invoice (invoice-preview.html)
  - show_contact_card (contact-card.html)
  - show_dashboard (dashboard.html)
- MCPB bundle packaging (manifest.json, icon.png, packaging scripts)
- Bundle: 82.6KB compressed, 328.6KB unpacked, 100 files
- Total tools: 221 (218 base + 3 UI)

## Phase 6 Deliverables (Partial)

- Package identity: @promptpartner/bexio-mcp-server
- Author: Lukas Hertig <lukas@promptpartner.ai>
- Repository: github.com/promptpartner/bexio-mcp-server
- Manifest v0.3 with privacy_policies for MCP Registry
- Comprehensive README with 3 installation methods
- CHANGELOG in Keep A Changelog format
