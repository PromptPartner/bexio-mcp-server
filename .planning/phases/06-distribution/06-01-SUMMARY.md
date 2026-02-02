---
phase: 06-distribution
plan: 01
subsystem: distribution
tags: [npm, manifest, documentation, changelog]
dependency-graph:
  requires: [05-02, 05-03]
  provides: ["PromptPartner package identity", "MCP Registry manifest v0.3", "User documentation"]
  affects: [06-02]
tech-stack:
  added: []
  patterns: ["Keep A Changelog format", "Scoped npm package"]
key-files:
  created:
    - CHANGELOG.md
  modified:
    - src/package.json
    - manifest.json
    - src/README.md
decisions:
  - id: D-06-01-01
    description: "Package scope changed from @bexio to @promptpartner"
    rationale: "Organization ownership for npm publication"
  - id: D-06-01-02
    description: "Tool annotations not added to manifest (mcpb v2.1.2 schema unsupported)"
    rationale: "Current mcpb validator rejects annotations field - manifest v0.3 with privacy_policies sufficient for MCP Registry"
metrics:
  duration: 3 min
  completed: 2026-02-02
---

# Phase 06 Plan 01: Distribution Package Configuration Summary

Package identity updated to @promptpartner/bexio-mcp-server with manifest v0.3 and comprehensive user documentation.

## What Was Built

### Package Identity
- npm scope: `@promptpartner/bexio-mcp-server` (from @bexio/mcp-server)
- Author: Lukas Hertig <lukas@promptpartner.ai>
- Repository: github.com/promptpartner/bexio-mcp-server
- Public access for scoped package publishing

### Manifest v0.3 Compliance
- Upgraded manifest_version from 0.2 to 0.3
- Added privacy_policies array with Bexio privacy policy URL
- Updated author and homepage to PromptPartner identity
- Passes mcpb validate without errors

### User Documentation
- README.md with all three installation methods:
  - MCPB bundle (recommended, double-click)
  - npm/npx command
  - From source (git clone)
- 221 tools documented by domain
- Troubleshooting section for common issues
- Environment variable reference

### Changelog
- Keep A Changelog format
- v2.0.0 release entry with all features
- GitHub release links

## Key Changes

| File | Change |
|------|--------|
| src/package.json | @promptpartner scope, author, repository URLs |
| manifest.json | v0.3, privacy_policies, author update |
| src/README.md | Complete rewrite with 3 install methods |
| CHANGELOG.md | Created with v2.0.0 release notes |

## Decisions Made

1. **D-06-01-01: Package scope @promptpartner** - Required for npm organization ownership
2. **D-06-01-02: No tool annotations** - mcpb v2.1.2 validator doesn't support annotations field in tools schema; manifest v0.3 with privacy_policies is sufficient

## Deviations from Plan

### Schema Limitation

**1. [Rule 3 - Blocking] Tool annotations rejected by mcpb validator**
- **Found during:** Task 2
- **Issue:** Plan specified adding readOnlyHint/destructiveHint annotations to tools, but mcpb v2.1.2 schema doesn't allow annotations field
- **Fix:** Removed annotations to pass validation; v0.3 compliance achieved via privacy_policies
- **Files modified:** manifest.json
- **Impact:** None for MCP Registry submission (privacy_policies is the v0.3 requirement)

## Verification Results

- [x] src/package.json has @promptpartner scope and correct author/repository
- [x] manifest.json is v0.3 with privacy_policies
- [x] mcpb validate passes without errors
- [x] README covers MCPB, npm, and source installation paths
- [x] CHANGELOG follows Keep A Changelog format
- [x] All files reference github.com/promptpartner/bexio-mcp-server

## Next Phase Readiness

Ready for 06-02: npm Publishing & GitHub Release
- Package identity configured for @promptpartner scope
- Manifest ready for MCP Registry submission
- CHANGELOG ready for release notes
- README ready for npm package page
