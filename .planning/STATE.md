# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-01)

**Core value:** Enable anyone to connect Claude Desktop to their Bexio accounting system with zero friction
**Current focus:** Phase 3 - Projects & Accounting (next)

## Current Position

Phase: 2 of 6 (Reference Data & Banking)
Plan: 3 of 3 in current phase
Status: **Phase 2 Complete, Verified** - 45 new tools (128 total)
Last activity: 2026-02-01 -- Phase 2 verified, ready for Phase 3

Progress: [######------------] 33%

## Performance Metrics

**Velocity:**
- Total plans completed: 6
- Average duration: 7.8 min
- Total execution time: 47 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-migration | 3/3 | 26 min | 8.7 min |
| 02-reference-data-banking | 3/3 | 21 min | 7.0 min |

**Recent Trend:**
- Last 5 plans: 01-03 (15 min), 02-01 (7 min), 02-02 (6 min), 02-03 (8 min)
- Trend: Consistent execution times, Phase 2 plans faster due to established patterns

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

### Pending Todos

None.

### Blockers/Concerns

- ~~SDK migration from 0.5.0 to 1.25.2 has limited official documentation~~ RESOLVED in 01-01
- ~~Swiss QR-invoice spec compliance needs research (Phase 2)~~ RESOLVED in 02-03
- MCP Apps (UI-*) based on SEP-1865 proposal, not yet stable (Phase 5 risk)

## Session Continuity

Last session: 2026-02-01 17:24 UTC
Stopped at: Completed 02-03-PLAN.md (Banking Tools)
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
