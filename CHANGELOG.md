# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.3.0] - 2026-05-28

### Added
- `BEXIO_ENABLED_CATEGORIES` env var: comma-separated whitelist of tool categories to register, to reduce system-prompt token usage for focused workflows or smaller models. Empty/unset registers all tools (backward compatible). Thanks to @Fabrik4 (#5).

### Fixed (write operations & schemas, from live API testing)
Incorporated fixes from @ueliwyss (#4), verified against the live Bexio API:
- Edit operations (quote/order/invoice) use a writable-field whitelist and supply Bexio-required defaults (`nb_decimals_amount`, `nb_decimals_price`, `is_compact_view`) that GET doesn't return, fixing PUT rejections.
- Copy (quote/invoice) sends the required `contact_id` (fetched from the source document).
- Subtotal/pagebreak position creation sends the non-empty body Bexio requires.
- `search_bills` uses GET (Bexio v4.0 rejects POST /search for bills); `search_*` tools accept a `query`/`field`/`operator`/`filters` shape.
- Schema corrections: `create_project` required fields; `create_fictional_user` (`email` required, `salutation_type` male/female); `create_additional_address` uses `street_name`/`house_number`; `create_note` only sends `is_public` when provided; `update_contact_relation` fetch-then-merge for partial updates; `create_timesheet` uses the nested `tracking` object; comments are nested under their document.

### Fixed (Bexio API v3.0/v4.0 endpoint migration)
Bexio retired a large set of v2.0 endpoints; the tools below were calling dead paths (404/400) and now target the current API. Verified live against a real Bexio account except where noted.

- Currencies → `/3.0/currencies`; bank accounts → `/3.0/banking/accounts`
- Calendar years, business years, VAT periods → `/3.0/accounting/{calendar_years,business_years,vat_periods}`
- Permissions → `/3.0/permissions`; current user → `/3.0/users/me`; fictional users → `/3.0/fictional_users` (update is PATCH)
- Document templates → `/3.0/document_templates`; files → `/3.0/files` (update is PATCH; upload/download hit v3.0 directly)
- Invoice reminders → `/2.0/kb_invoice/{id}/kb_reminder` (was `/reminder`, 404)
- Expenses → `/4.0/expenses` (moved out of `/4.0/purchase/expenses`)
- Employees → `/4.0/payroll/employees`; **employee IDs are now UUID strings** (were integers)
- Absences → nested `/4.0/payroll/employees/{employee_id}/absences`; `list_absences` now requires `employee_id` and `business_year`; absence IDs are strings
- `list_outgoing_payments` now requires `bill_id` (Bexio lists outgoing payments per bill; previously returned HTTP 400)
- IBAN/QR payments → nested `/3.0/banking/bank_accounts/{bank_account_id}/...`; `get_*`/`update_*` now require `bank_account_id`
- Project milestones → `/3.0/projects/{id}/milestones`; work packages → `/3.0/projects/{id}/packages`; project unarchive action renamed to `reactivate`
- Quote actions corrected to Bexio's names: decline→`reject`, revert→`revertIssue`, create-order→`order`, create-invoice→`invoice`; order create-delivery→`delivery`, create-invoice→`invoice`
- Contact restore now uses PATCH
- `list_payroll_documents` returns a clear error (Bexio v4.0 has no payroll-documents list endpoint)
- `makeVersionedRequest` now normalizes errors to `McpError` (status-based recovery hints; fixes payroll module availability detection)

### Notes
- **Not live-verified on the test account (HTTP 403 — module/scope restricted):** purchase orders (`/3.0/purchase_orders`), stock locations/areas (`/2.0/stock_place`, `/2.0/stock`). Paths follow the current Bexio API; confirm with an account that has these modules enabled.
- Endpoints still served on v2.0 (contacts, invoices, orders, quotes, accounts, items, notes, tasks, reference data) are unchanged.

## [2.2.1] - 2026-05-27

### Fixed
- **Tool parameters were silently dropped for all parametrized tools.** Tools were registered with an empty input schema, so `tools/list` advertised `properties: {}` to MCP clients (e.g. Claude Desktop). Clients stripped every argument before sending, and handlers then reported each required field as `undefined`. Only parameterless tools worked. Tool definitions' JSON-Schema `inputSchema` is now converted to a Zod shape and passed to the SDK, so the full parameter schema is exposed to clients and arguments reach the handlers (new `src/schema-converter.ts`).
- Stringified numbers sent by clients (e.g. `"170"`, `"100.00"`) are now coerced to numbers at the schema boundary, so write tools like `create_manual_entry` accept them.
- `get_journal` now uses `GET /3.0/accounting/journal` (was the non-existent v2.0 `/journal`, which returned 404).
- Manual entries (`list/create/update/delete_manual_entry`) now use `/3.0/accounting/manual_entries` (was the non-existent v2.0 `/manual_entry`, which returned 404). `get_manual_entry` resolves an entry from the list, since Bexio has no single-entry show endpoint.

## [2.2.0] - 2026-03-03

### Added
- Contact CRUD operations: create, edit, delete, and bulk-delete for contacts and companies
- Tasks domain with 8 tools for task management
- Notes domain with 6 tools for contact and company notes
- Sales document completion: quote, order, invoice, and reminder gap tools for full lifecycle coverage
- Position management for all 7 document types (quotes, orders, invoices): default, item, text, subtotal, discount, pagebreak, and sub-position CRUD
- Stock locations and stock areas management
- Real users listing and document settings tools
- Additional reference data tools: edit/search for countries, languages, currencies, titles, salutations

### Fixed
- editOrder, editOrderRepetition, and editInvoice now correctly use PUT instead of POST

### Changed
- Tool count expanded from 221 to 310 tools across 25 domain modules

## [2.1.0] - 2026-02-23

### Fixed
- Bills, expenses, and outgoing payments now use Bexio v4.0 API (`/4.0/purchase/bills`, `/4.0/purchase/expenses`, `/4.0/purchase/payments`) — fixes 404 errors from deprecated v2.0 endpoints
- Purchase orders now use Bexio v3.0 API (`/3.0/purchase_order`)

### Changed
- Bill, expense, and outgoing payment IDs are now UUID strings (previously integers) to match v4.0 API
- Outgoing payments use a flat endpoint (no longer nested under bills)
- All v3.0/v4.0 purchase endpoints use PUT for updates (previously POST)
- Added reusable `makeVersionedRequest` helper for non-v2.0 API calls; refactored tax endpoints to use it

## [2.0.11] - 2026-02-06

### Changed
- Restructured README with clearer install instructions
- MCPB extension download from Releases is now the primary install option
- Added Claude Desktop install path (Extensions > Advanced Settings > Install Extension)

## [2.0.9] - 2026-02-02

### Fixed
- Corrected `mcpName` case to match GitHub organization (`PromptPartner`)
- Shortened server.json description to meet registry 100-char limit

## [2.0.8] - 2026-02-02

### Added
- MCP Registry support with `mcpName` identifier
- `server.json` manifest for registry submission
- `PUBLISHING.md` guide for release workflow

## [2.0.0] - 2026-02-02

### Added
- Complete Bexio API coverage with 221 tools across all domains
- Interactive UI previews for invoices, contacts, and dashboard
- Swiss QR-bill and IBAN payment support (ISO 20022 compliant)
- Project management with milestones, work packages, and time tracking
- Accounting tools: chart of accounts, manual entries, VAT periods
- Purchase cycle: bills, expenses, purchase orders, outgoing payments
- File management with upload/download capabilities
- Payroll tools with automatic module detection
- MCPB bundle for one-click Claude Desktop installation
- Dual transport: stdio (Claude Desktop) and HTTP (n8n/automation)

### Changed
- Complete rewrite with MCP SDK 1.25.2
- Modular architecture with domain-organized code
- Zod 3.25.76 for improved validation

### Technical
- 221 tools organized into 10 domain modules
- TypeScript with strict mode
- Vitest for testing
- Vite for UI bundling

## [1.0.0] - 2025

Initial implementation by [Sebastian Bryner](https://www.linkedin.com/in/sebastian-bryner/) of [bryner.tech](https://bryner.tech/).

### Added
- Initial Bexio MCP server with 83 tools
- Core domains: contacts, invoices, quotes, orders, payments
- MCP SDK 0.5.0 integration
- Basic Bexio API client

[unreleased]: https://github.com/promptpartner/bexio-mcp-server/compare/v2.2.0...HEAD
[2.2.0]: https://github.com/promptpartner/bexio-mcp-server/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/promptpartner/bexio-mcp-server/compare/v2.0.11...v2.1.0
[2.0.11]: https://github.com/promptpartner/bexio-mcp-server/compare/v2.0.10...v2.0.11
[2.0.9]: https://github.com/promptpartner/bexio-mcp-server/compare/v2.0.8...v2.0.9
[2.0.8]: https://github.com/promptpartner/bexio-mcp-server/compare/v2.0.0...v2.0.8
[2.0.0]: https://github.com/promptpartner/bexio-mcp-server/releases/tag/v2.0.0
[1.0.0]: https://bryner.tech/
