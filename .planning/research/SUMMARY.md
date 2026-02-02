# Research Summary: Bexio MCP v2

**Project:** Bexio MCP Server v2
**Research Date:** 2026-02-01
**Research Type:** Full Project Research
**Overall Confidence:** HIGH

---

## Executive Summary

The Bexio MCP v2 project requires a complete modernization of the existing v1 server (56 tools, SDK 0.5.0, 2,418-line monolith) to the current MCP ecosystem standard. The migration is **more complex than a simple SDK upgrade** - it requires architectural refactoring, MCPB bundle packaging, and significant feature expansion to achieve 100% API coverage.

**The good news:** The MCP ecosystem has matured significantly. The SDK is now at v1.25.2 with stable patterns, MCPB bundle format provides true one-click installation, and there's extensive community knowledge to draw from. The v1 codebase demonstrates solid understanding of the Bexio API and provides a proven foundation.

**The challenge:** This is essentially a v2 rewrite, not a migration. Key requirements include:
1. **SDK migration (0.5.0 to 1.25.2)** - Breaking changes in transport API, tool registration patterns, and Zod peer dependency requirements
2. **Architectural refactoring** - Breaking the 2,418-line monolith into modular domain-based structure
3. **Feature expansion** - Adding ~120 missing endpoints across 8 API categories (Projects, Banking, Accounting, Purchase Management, Files, Payroll, etc.)
4. **MCPB packaging** - Creating proper bundle with manifest.json for one-click installation
5. **Distribution strategy** - Supporting both MCPB (non-technical users) and npm (developers)

**Risk assessment:** The SDK migration presents the highest technical risk due to limited official migration documentation. The architectural refactoring is well-understood but time-intensive. Feature expansion is straightforward but requires significant development effort (~100 hours estimated).

**Recommended approach:** Phased migration starting with foundation (SDK upgrade, modular architecture) before feature expansion. This allows validating the new architecture with existing tools before adding 120+ new endpoints.

---

## Stack Recommendations

### Core Technologies (from STACK.md)

| Technology | Version | Rationale |
|------------|---------|-----------|
| **@modelcontextprotocol/sdk** | ^1.25.2 | Official SDK, actively maintained. 21,000+ projects using it. v1.x stable until v2 ships Q1 2026. |
| **TypeScript** | ^5.5.0 | Required for Zod strict mode and SDK type inference. |
| **Node.js** | >=20.0.0 | Modern ES modules support. Claude Desktop ships Node.js built-in. |
| **Zod** | ^3.25.0 | Peer dependency of SDK. Pin to 3.25.x to avoid v4 compatibility issues. |
| **axios** | ^1.7.0 | Proven Bexio API client from v1. Well-tested automatic transforms. |
| **esbuild** | ^0.24.0 | Bundle TypeScript into single file for MCPB. 100x faster than alternatives. |
| **@anthropic-ai/mcpb** | ^2.1.2 | Official Anthropic CLI for creating .mcpb bundles. |

### Transport Layer

- **StdioServerTransport** - Primary for Claude Desktop (local MCP servers)
- **StreamableHTTPServerTransport** - Replaced deprecated SSE transport (spec 2025-03-26)
- **DO NOT USE:** SSE transport (deprecated, backwards compatibility only)

### Breaking Changes from v1 (SDK 0.5.0 to 1.25.2)

1. **Import paths changed:** `@modelcontextprotocol/sdk/server` to `@modelcontextprotocol/sdk/server/mcp.js`
2. **Zod peer dependency:** No longer bundled, must be installed separately
3. **Transport API:** `server.connect(transport)` replaces existing transport, cannot register capabilities after connection
4. **SSE deprecated:** Migrate HTTP transport to Streamable HTTP if needed

**Confidence:** HIGH - Verified via official SDK repository and npm package metadata.

---

## Feature Gaps (from FEATURES.md)

### v1 Current Coverage
- **56 tools implemented** covering sales order management (contacts, invoices, quotes, orders, deliveries, payments, reminders)
- **Good coverage of:** Core invoicing workflow, contact management, document transformations
- **Missing:** Approximately 40-50% of Bexio API surface area

### Critical Missing Categories (Table Stakes for 100% Coverage)

| Category | Priority | Endpoints | Estimated Effort | Why Critical |
|----------|----------|-----------|-----------------|--------------|
| **Projects & Time Tracking** | P3 | ~21 | 16 hours | Core business functionality for service companies |
| **Banking** | P2 | ~11 | 12 hours | IBAN/QR payments are Swiss standard, bank accounts required for payments |
| **Accounting** | P4 | ~13 | 15 hours | Manual entries and chart of accounts are accounting foundation |
| **Purchase Management** | P5 | ~20 | 19 hours | Bills, expenses, purchase orders - complete procurement cycle |
| **Files** | P6 | ~8 | 8 hours | Document management and PDF storage/retrieval |
| **Reference Data** | P1 | ~27 | 14 hours | Contact groups, currencies, countries, units - foundational configuration |
| **Payroll & HR** | P7 | ~9 | 10 hours | Optional (requires Bexio payroll module subscription) |
| **Extended Features** | P8 | ~15 | 9 hours | Notes, tasks, users, company profile |

**Total missing:** ~120 new endpoints, ~100 hours development effort

### Feature Dependencies

Critical dependency chain for implementation order:
```
Reference Data (P1) → Contact Groups/Sectors → Enhanced Contacts
                    → Currencies → Multi-currency Invoices
                    → Countries/Languages → Localization

Banking (P2) → Bank Accounts → IBAN Payments
                             → QR Payments
                             → Outgoing Payments

Accounting (P4) → Accounts → Manual Entries
                           → Accounting Reports

Projects (P3) → Projects → Timesheets
                        → Milestones
                        → Work Packages

Purchase (P5) → Bills → Outgoing Payments
```

### Differentiators (v2+ Features)

Features not expected but provide competitive advantage:
- **Batch Operations** - Process multiple records in single call (client-side implementation)
- **Smart Search** - Cross-entity search (find all documents for customer)
- **PDF Generation/Download** - Get document PDFs via MCP (Files API enables)
- **Financial Dashboards** - Pre-built analytics queries
- **Contact Enrichment** - Combine contact + relations + addresses in single response
- **VAT Reporting** - Swiss VAT period summaries

### Anti-Features (Do NOT Build)

Explicitly avoid these common mistakes:
- **OAuth Flow Management** - MCP uses static tokens only
- **Webhook Receivers** - MCP is request-only, not a server
- **Caching Layer** - Stale data issues, direct API passthrough preferred
- **Bulk Delete** - Dangerous without undo, require individual deletes
- **Legacy Timesheet API** - Use new /2.0/timesheet endpoint only

**Confidence:** HIGH - Based on official docs.bexio.com and v1 source code analysis.

---

## Architecture Patterns (from ARCHITECTURE.md)

### Current State: The 2,418-Line Problem

v1 `server.ts` structure:
- **2,418 lines total**
- Tool definitions (lines 156-1619) - 1,463 lines
- Response formatting (lines 1622-1830) - 208 lines
- Tool handlers (lines 1832-2418) - 586 lines
- **Problems:** Unmaintainable, no domain boundaries, difficult to test, adding tools requires touching massive file

### Recommended Architecture: Domain-Organized Modules

```
src/
├── index.ts                    # Entry point, transport selection
├── server.ts                   # Core server setup, tool registration (~200 lines max)
├── bexio-client.ts            # API client (keep as-is initially)
├── types/                      # Shared types
│   ├── index.ts               # Barrel export
│   ├── common.ts              # Pagination, response types
│   └── schemas/               # Split current types.ts by domain
│       ├── contacts.ts
│       ├── invoices.ts
│       └── ...
├── tools/                      # Tool modules by domain
│   ├── index.ts               # Aggregates all tools for registration
│   ├── contacts/
│   │   ├── index.ts           # Barrel: exports definitions + handlers
│   │   ├── definitions.ts     # Tool definitions (inputSchema)
│   │   └── handlers.ts        # Handler implementations
│   ├── invoices/
│   ├── orders/
│   ├── quotes/
│   ├── payments/
│   └── ... (11 domains total)
├── shared/                     # Shared utilities
│   ├── errors.ts              # McpError, error formatting
│   ├── response.ts            # Response formatting
│   └── validation.ts          # Shared validation helpers
└── transports/                 # Transport implementations
    ├── stdio.ts
    └── http.ts (optional)
```

### Key Patterns to Follow

1. **Separation of Definitions from Handlers**
   - Tool definitions (metadata) in `definitions.ts` - pure data
   - Handler logic in `handlers.ts` - business logic
   - Enables easier testing, clear contracts, parallel development

2. **Centralized Tool Registration**
   - Single `tools/index.ts` aggregates all domain tools
   - Server imports from one location
   - Domain modules remain independent

3. **Logic Throws, Server Catches**
   - Handlers throw `McpError` for failures
   - Server catches and formats responses
   - Centralized error handling, pure handlers

4. **Response Formatting Centralization**
   - `shared/response.ts` handles all response formatting
   - Consistent structure across all tools
   - Single place to modify format

### Domain Organization (11 Domains)

Based on 56 existing tools:
- contacts (7 tools)
- invoices (13 tools)
- orders (6 tools)
- quotes (10 tools)
- payments (4 tools)
- reminders (8 tools)
- deliveries (6 tools)
- items (5 tools)
- reports (9 tools)
- users (6 tools)
- comments (3 tools)
- relations (6 tools)

### Anti-Patterns to Avoid

1. **Handler Registration Inside Handlers** - Keep definitions as pure data
2. **Direct BexioClient Dependency** - Use dependency injection via factory functions
3. **Shared Mutable State** - Pass dependencies explicitly
4. **Giant Switch Statement** - Use handler registry object with tool name as key

**Confidence:** MEDIUM-HIGH - Patterns verified via multiple MCP server examples and TypeScript best practices.

---

## Key Pitfalls (from PITFALLS.md)

### Critical Pitfalls (Can Cause Rewrites)

1. **SDK API Breaking Changes (0.5.0 to 1.25+)**
   - **Risk:** All 56 tools fail to register, server won't start
   - **Prevention:** Study migration docs, create checklist, migrate incrementally
   - **Phase:** Foundation (first thing to address)

2. **Manifest Values Not Matching Runtime**
   - **Risk:** MCPB bundle fails validation, one-click install blocked
   - **Prevention:** Generate manifest FROM tool definitions, use `mcpb pack` validation
   - **Phase:** MCPB Packaging

3. **Zod v3/v4 Compatibility Issues**
   - **Risk:** `w._parse is not a function` runtime errors, all tool calls fail
   - **Prevention:** Pin Zod to `3.22.x` (not `^3.22.0`), lock with package-lock.json
   - **Phase:** Foundation

4. **stdout Contamination**
   - **Risk:** JSON-RPC message stream corrupted, protocol errors
   - **Prevention:** ONLY stderr for logs, never console.log(), add pre-commit hook
   - **Phase:** Every phase - establish logging convention first

5. **Tool Name Changes Breaking Backward Compatibility**
   - **Risk:** Users' existing conversations stop working
   - **Prevention:** Never rename tools in migration, add aliases if needed
   - **Phase:** Foundation (API contract decision)

### Moderate Pitfalls (Cause Delays/Debt)

6. **API Wrapper One-on-One Anti-Pattern**
   - **Risk:** 56 tools become 100+, AI accuracy drops logarithmically
   - **Prevention:** Target 15-30 tools max, use parameters instead of separate tools
   - **Phase:** Architecture

7. **Vague Error Messages for LLM Recovery**
   - **Risk:** AI cannot self-correct, users must intervene manually
   - **Prevention:** Error messages should be prompts with recovery suggestions
   - **Phase:** Implementation

8. **Missing npm Package Pre-Publication**
   - **Risk:** Registry submission rejected, wasted time
   - **Prevention:** Publish to npm FIRST, then submit to registry
   - **Phase:** Distribution

9. **Monolithic Server Architecture**
   - **Risk:** Already at 2,418 lines, unmaintainable
   - **Prevention:** Domain modules from the start
   - **Phase:** Architecture (first refactoring)

10. **Testing Only Happy Paths**
    - **Risk:** Production failures from edge cases
    - **Prevention:** Mock Bexio API, test auth failures/rate limits/timeouts
    - **Phase:** Every phase

### Security Pitfalls

16. **Prompt Injection via Tool Parameters**
    - **Risk:** Attackers manipulate AI behavior, data exfiltration
    - **Prevention:** Static tool descriptions only, validate with Zod, sanitize user data

17. **Over-Permissioned Tool Access**
    - **Risk:** Attack surface expanded, compliance violations
    - **Prevention:** Least privilege principle, scope API tokens, validate paths

**Confidence:** MEDIUM-HIGH - Based on official docs, community guides, and issue trackers.

---

## Future: MCP Apps/UI (from Additional Research)

### SEP-1865: MCP Apps Proposal

**Status:** Proposed extension (not yet merged)
**Source:** https://github.com/modelcontextprotocol/modelcontextprotocol/pull/1865

**Key Features:**
- `ui://` URI scheme for predeclaring UI resources
- Servers reference UI resources through tool metadata
- Hosts prefetch templates before tool execution
- Sandboxed iframes with restricted permissions
- HTML resources with media type `text/html;profile=mcp-app`
- Communication via existing JSON-RPC protocol
- Optional, backwards-compatible extension via capability mechanism
- Reference implementations in MCP-UI client/server SDKs

### Potential Use Cases for Bexio MCP

If/when MCP Apps lands, consider these v2.x+ features:
- **Invoice Preview Widget** - Rich HTML preview before creation/sending
- **Contact Card UI** - Visual contact details with inline editing
- **Dashboard Widgets** - Revenue charts, payment status timelines
- **Form Builders** - Complex invoice position builders with visual feedback
- **Document Viewer** - PDF preview of generated documents

**Recommendation:** Monitor SEP-1865 status. Do NOT implement in v2.0 roadmap (not stable yet). Flag as potential v2.x feature after MCP Apps reaches stable release.

**Confidence:** MEDIUM - Proposal is well-documented but not yet merged/standardized.

---

## Roadmap Implications

### Recommended Phase Structure

Based on combined research findings, the roadmap should follow this structure:

#### Phase 1: Foundation & SDK Migration (2-3 weeks)
**Rationale:** Must establish stable base before any feature work.

**Deliverables:**
- Upgrade to SDK 1.25.2 with proper Zod peer dependency
- Create modular directory structure (shared/, types/, tools/)
- Establish logging convention (stderr only)
- Set up Vitest testing infrastructure
- Pin dependencies (especially Zod 3.22.x)

**Features:** None (foundation only)

**Pitfalls to avoid:** SDK API changes (#1), Zod compatibility (#3), stdout contamination (#4)

**Research needs:** /gsd:research-phase for SDK migration patterns (limited official docs)

#### Phase 2: Architectural Refactoring (3-4 weeks)
**Rationale:** Validate modular architecture with existing tools before expansion.

**Deliverables:**
- Migrate contacts domain (7 tools) to new structure
- Create tools/index.ts aggregation pattern
- Refactor server.ts to use handler registry
- Extract shared/errors.ts and shared/response.ts
- Migrate remaining 10 domains incrementally

**Features:** All 56 existing v1 tools working in new architecture

**Pitfalls to avoid:** Monolithic structure (#9), tool name changes (#5), giant switch (#4 anti-pattern)

**Research needs:** Standard patterns, well-documented

#### Phase 3: Reference Data Foundation (1-2 weeks)
**Rationale:** Dependency foundation for other features (contacts need groups, invoices need currencies).

**Deliverables:**
- Contact Groups/Sectors (5 tools)
- Currencies (4 tools)
- Countries/Languages (4 tools)
- Units (3 tools)
- Salutations/Titles (6 tools)
- Payment Types (2 tools)
- Company Profile/Permissions (3 tools)

**Features from FEATURES.md:** Priority 1 Reference Data (~27 endpoints)

**Pitfalls to avoid:** API wrapper one-on-one (#6), vague errors (#7)

**Research needs:** Standard patterns, skip research

#### Phase 4: Banking & Payments (2 weeks)
**Rationale:** Swiss QR/IBAN payments are critical for Swiss businesses.

**Deliverables:**
- Bank Accounts (read-only, 1 tool)
- IBAN Payments (3 tools)
- QR Payments (3 tools)
- Enhanced currency support integration

**Features from FEATURES.md:** Priority 2 Banking (~11 endpoints)

**Pitfalls to avoid:** Testing only happy paths (#10), security (#16-17)

**Research needs:** /gsd:research-phase for Swiss QR-invoice spec compliance

#### Phase 5: Projects & Time Tracking (2-3 weeks)
**Rationale:** Core functionality for service companies, largest feature set.

**Deliverables:**
- Projects CRUD (4 tools)
- Timesheets (3 tools)
- Milestones (3 tools)
- Work Packages (4 tools)
- Business Activities (2 tools)
- Project Types/Statuses (4 tools)

**Features from FEATURES.md:** Priority 3 Projects (~21 endpoints)

**Pitfalls to avoid:** Session state assumptions (#15), vague errors (#7)

**Research needs:** Standard patterns, skip research

#### Phase 6: Accounting (2 weeks)
**Rationale:** Manual entries and accounts complete the accounting foundation.

**Deliverables:**
- Chart of Accounts (3 tools)
- Manual Entries (4 tools)
- Business Years/Calendar (3 tools)
- VAT Periods (1 tool)
- Accounting Reports (2 tools)

**Features from FEATURES.md:** Priority 4 Accounting (~13 endpoints)

**Pitfalls to avoid:** Testing only happy paths (#10), hardcoded base URLs (#13)

**Research needs:** /gsd:research-phase for Swiss accounting compliance (account numbering, VAT rules)

#### Phase 7: Purchase Management (2-3 weeks)
**Rationale:** Completes the procurement cycle (bills, expenses, purchase orders).

**Deliverables:**
- Bills CRUD + actions (6 tools)
- Expenses (6 tools)
- Purchase Orders (4 tools)
- Outgoing Payments (5 tools)

**Features from FEATURES.md:** Priority 5 Purchase (~20 endpoints)

**Pitfalls to avoid:** Vague errors (#7), testing only happy paths (#10)

**Research needs:** Standard patterns, skip research

#### Phase 8: Files & Documents (1 week)
**Rationale:** Document management enables PDF operations.

**Deliverables:**
- Files CRUD (4 tools)
- Document Templates (1 tool)
- Additional Addresses (3 tools)

**Features from FEATURES.md:** Priority 6 Files (~8 endpoints)

**Pitfalls to avoid:** Bundle size bloat (#14), over-permissioned access (#17)

**Research needs:** Standard patterns, skip research

#### Phase 9: MCPB Packaging & Distribution (1-2 weeks)
**Rationale:** Enable one-click installation for non-technical users.

**Deliverables:**
- Create manifest.json with user_config for API token
- Set up esbuild bundling to single file
- Create .mcpb bundle with mcpb CLI
- Test one-click installation flow
- Create icon.png (256x256)
- Prepare npm package.json for dual distribution

**Features:** None (distribution only)

**Pitfalls to avoid:** Manifest mismatch (#2), bundle bloat (#14), npm before registry (#8)

**Research needs:** /gsd:research-phase for MCPB manifest.json best practices

#### Phase 10: Extended Features (Optional, 1-2 weeks)
**Rationale:** Nice-to-have features for complete API coverage.

**Deliverables:**
- Notes (4 tools)
- Tasks (5 tools)
- Users v3 API (4 tools)
- Payroll/HR if needed (9 tools, requires subscription)

**Features from FEATURES.md:** Priority 7-8 Extended (~24 endpoints)

**Pitfalls to avoid:** API wrapper one-on-one (#6)

**Research needs:** Standard patterns, skip research

### Phase Dependencies

```
Phase 1 (Foundation)
    ↓
Phase 2 (Architecture) ← Must complete before any feature expansion
    ↓
    ├─→ Phase 3 (Reference Data) ← Foundational for all other phases
    |       ↓
    |   Phase 4 (Banking) ← Requires currencies from Phase 3
    |       ↓
    |   Phase 5 (Projects) ← Independent of Banking
    |       ↓
    |   Phase 6 (Accounting) ← Requires accounts
    |       ↓
    |   Phase 7 (Purchase) ← Requires accounting + banking
    |       ↓
    |   Phase 8 (Files) ← Independent
    |       ↓
    └──────┴─→ Phase 9 (MCPB) ← Requires all features complete
            ↓
        Phase 10 (Extended) ← Optional, can run parallel to Phase 9
```

### Research Flags

**Phases needing /gsd:research-phase:**
- Phase 1: SDK migration patterns (limited official docs)
- Phase 4: Swiss QR-invoice specification compliance
- Phase 6: Swiss accounting compliance (account numbering, VAT rules)
- Phase 9: MCPB manifest.json best practices

**Phases with standard patterns (skip research):**
- Phase 2: Well-documented modular architecture patterns
- Phase 3: Simple CRUD operations
- Phase 5: Standard project/timesheet patterns
- Phase 7: Standard purchase management patterns
- Phase 8: File management patterns
- Phase 10: Standard CRUD patterns

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Stack** | HIGH | Official SDK documentation, npm package metadata, active community |
| **Features** | HIGH | Based on official docs.bexio.com API reference and v1 source analysis |
| **Architecture** | MEDIUM-HIGH | Patterns verified via multiple MCP examples, some MCP-specific patterns less documented |
| **Pitfalls** | MEDIUM-HIGH | Official docs + community guides + issue trackers, some learnings from project experience |
| **Overall** | HIGH | Strong foundation for roadmap creation |

### Gaps to Address

1. **SDK Migration Path:** Limited official migration guide from 0.5.0 to 1.25.2. Recommend creating detailed migration checklist during Phase 1 research.

2. **Swiss Compliance:** QR-invoice spec and accounting standards need phase-specific research (Phase 4 and 6).

3. **MCPB Best Practices:** While manifest spec is documented, real-world patterns for config schema design need research (Phase 9).

4. **Tool Count Optimization:** Current 56 tools may need consolidation. Target 15-30 tools for optimal AI accuracy. Requires careful design during Architecture phase.

5. **v1 Test Coverage:** Unknown test coverage of existing v1 implementation. Recommend audit during Phase 2 to understand what behavior must be preserved.

---

## Open Questions for Roadmap Planning

1. **Should we consolidate tools during migration?** Current 56 tools may be too many for optimal AI accuracy. Consider combining related operations (e.g., single `search_invoices` with filters vs separate search_invoices/search_invoices_by_customer).

2. **HTTP transport: Keep or remove?** v1 has HTTP mode via Fastify. SDK 1.25.2 includes StreamableHTTPServerTransport. Do we still need custom HTTP server?

3. **Testing strategy: Unit vs E2E?** Should we mock Bexio API completely or allow optional E2E tests against sandbox? What's the CI/CD strategy?

4. **Versioning strategy:** How to handle backward compatibility for existing v1 users? Separate v1 and v2 packages? Migration guide?

5. **Payroll module handling:** Payroll APIs require separate Bexio subscription. How to handle gracefully when users don't have access?

6. **Rate limiting:** Bexio API has rate limits. Should we implement client-side rate limiting or rely on 429 retry logic only?

7. **Multi-company support:** Some Bexio accounts have multiple companies. How to handle company_id configuration in MCPB user_config?

---

## Sources

### Technology Stack (HIGH Confidence)
- [npm: @modelcontextprotocol/sdk v1.25.2](https://www.npmjs.com/package/@modelcontextprotocol/sdk)
- [GitHub: modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk)
- [npm: @anthropic-ai/mcpb v2.1.2](https://www.npmjs.com/package/@anthropic-ai/mcpb)
- [MCP Specification Changelog](https://modelcontextprotocol.io/specification/2025-11-25/changelog)
- [GitHub: mcpb MANIFEST.md](https://github.com/modelcontextprotocol/mcpb/blob/main/MANIFEST.md)
- [Anthropic Engineering: Desktop Extensions](https://www.anthropic.com/engineering/desktop-extensions)

### Feature Landscape (HIGH Confidence)
- [Bexio API Documentation](https://docs.bexio.com/)
- [Bexio Developer Portal](https://developer.bexio.com/)
- v1 source code analysis (server.ts, bexio-client.ts)

### Architecture Patterns (MEDIUM-HIGH Confidence)
- [MCP TypeScript SDK Repository](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Build a Server Guide](https://modelcontextprotocol.io/docs/develop/build-server)
- [mcp-ts-template](https://github.com/cyanheads/mcp-ts-template)
- [mcp-framework](https://github.com/QuantGeekDev/mcp-framework)
- [MCP Server Testing Guide](https://mcpcat.io/guides/writing-unit-tests-mcp-servers/)

### Pitfalls & Best Practices (MEDIUM-HIGH Confidence)
- [MCP Security Best Practices](https://modelcontextprotocol.io/specification/draft/basic/security_best_practices)
- [Docker MCP Best Practices](https://www.docker.com/blog/mcp-server-best-practices/)
- [Snyk MCP Best Practices](https://snyk.io/articles/5-best-practices-for-building-mcp-servers/)
- [Stainless Error Handling Guide](https://www.stainless.com/mcp/error-handling-and-debugging-mcp-servers)
- [Alpic AI Error Recovery](https://alpic.ai/blog/better-mcp-tool-call-error-responses-ai-recover-gracefully)
- [Merge MCP Testing](https://www.merge.dev/blog/mcp-server-testing)

### MCP Apps (MEDIUM Confidence)
- [GitHub PR #1865: MCP Apps SEP](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/1865)

### Issue Trackers (HIGH Confidence)
- [Zod v4 Compatibility #1429](https://github.com/modelcontextprotocol/modelcontextprotocol/issues/1429)
- [VS Code Zod v4 #251315](https://github.com/microsoft/vscode/issues/251315)
- [Tool Versioning #1915](https://github.com/modelcontextprotocol/modelcontextprotocol/issues/1915)

---

## Ready for Requirements Definition

This research summary provides comprehensive foundation for creating detailed requirements and roadmap. Key insights:

1. **Scope is clear:** SDK migration + architectural refactor + 120 new endpoints + MCPB packaging
2. **Risks are identified:** SDK migration complexity, Zod compatibility, manifest synchronization
3. **Dependencies are mapped:** Phase structure reflects technical dependencies
4. **Effort is estimated:** ~100 hours for feature expansion, additional time for foundation/architecture
5. **Patterns are proven:** Modular architecture verified via multiple production MCP servers

**Recommendation:** Proceed to requirements definition with focus on:
- Detailed SDK migration checklist (Phase 1)
- Tool consolidation strategy (Architecture phase)
- Testing infrastructure requirements
- MCPB manifest design
- Backward compatibility approach

---

*Research synthesis completed: 2026-02-01*
*Synthesized from: STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md, and MCP Apps research*
