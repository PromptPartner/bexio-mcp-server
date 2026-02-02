# Phase 6: Distribution - Context

**Gathered:** 2026-02-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Publish the completed Bexio MCP server to distribution channels (npm registry, MCP Registry, GitHub releases) with comprehensive installation documentation. All code is complete — this phase handles packaging, publishing, and user-facing documentation.

</domain>

<decisions>
## Implementation Decisions

### Package Identity
- npm scope: `@promptpartner/bexio-mcp-server` (PromptPartner org owns this scope)
- Author: Lukas Hertig <lukas@promptpartner.ai>
- Repository: github.com/promptpartner/bexio-mcp-server (new repo to be created)
- License: MIT (already in place)

### Release Strategy
- Initial version: 2.0.0 (clear major version for the rewrite)
- Pre-release: None — straight to stable
- Changelog format: Keep A Changelog (Added/Changed/Fixed sections)
- GitHub release assets: MCPB bundle (.mcpb file) + auto-generated source archives

### Documentation Depth
- README scope: Quick start focused — install, configure, basic usage; link to docs for details
- Installation paths: All three methods documented (MCPB double-click, npx command, manual source setup)
- Tool documentation: Grouped by domain (invoices, contacts, projects, etc.)
- Troubleshooting: Include common issues (API token errors, connection issues, permissions)

### Registry Approach
- MCP Registry: Submit for inclusion in Claude Desktop's server browser
- Positioning: Swiss accounting focus — "Complete Swiss accounting integration for Bexio"
- Keywords: bexio, accounting, invoices, swiss, mcp, claude
- Category: Business/Finance

### Claude's Discretion
- Exact README structure and section ordering
- CHANGELOG initial content beyond "Initial release"
- MCP Registry submission process details (follow their guidelines)
- GitHub release notes wording

</decisions>

<specifics>
## Specific Ideas

- Package should be discoverable by users searching for "bexio" or "swiss accounting"
- README should get users from zero to working Claude Desktop integration quickly
- Repository is new — will need to be created and connected to local repo

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-distribution*
*Context gathered: 2026-02-02*
