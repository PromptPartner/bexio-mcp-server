---
phase: 05-ui-packaging
plan: 03
subsystem: packaging
tags: [npm, publishing, cli, npx]
requires: [05-01]
provides: [npm-package-config, cli-binary, license, readme]
affects: [05-04]
tech-stack:
  patterns: [scoped-npm-package, shebang-cli, conditional-build]
key-files:
  modified: [src/package.json]
  created: [src/LICENSE, src/README.md]
decisions:
  - id: PKG-01
    choice: "@bexio/mcp-server scoped name"
    reason: "npm scoping for organization ownership"
  - id: PKG-02
    choice: "zod 3.25.76 (not 3.22.5)"
    reason: "ext-apps peer dependency requires ^3.25.0"
  - id: PKG-03
    choice: "Conditional build:ui script"
    reason: "Allow build to succeed before UI files exist"
metrics:
  duration: 7 min
  completed: 2026-02-01
---

# Phase 05 Plan 03: npm Package Configuration Summary

npm package configured for publishing with npx support and proper CLI distribution.

## One-liner

Scoped @bexio/mcp-server package with bin CLI, LICENSE, and README for npx distribution.

## What Was Done

### Task 1: Configure package.json for npm publishing
- Changed package name to scoped format: `@bexio/mcp-server`
- Added bin field: `"bexio-mcp-server": "dist/index.js"`
- Added files array: `["dist", "README.md", "LICENSE"]`
- Added repository, homepage, bugs fields for npm page
- Added prepublishOnly script to ensure build before publish
- Expanded keywords for discoverability (claude, accounting, invoices, swiss)
- Added publishConfig with public access for scoped package

### Task 2: Ensure shebang in entry point
- Verified `#!/usr/bin/env node` is first line of src/index.ts
- Confirmed shebang survives TypeScript compilation to dist/index.js
- Made build:ui script conditional (skip if src/ui doesn't exist)
- Fixed vite-plugin-singlefile version to ^2.3.0 (v3 doesn't exist)

### Task 3: Create LICENSE and verify npm pack
- Created MIT LICENSE file at src/LICENSE
- Created README.md with installation instructions:
  - npx usage: `npx @bexio/mcp-server`
  - Global install: `npm install -g @bexio/mcp-server`
  - Claude Desktop configuration example
  - Environment variables documentation
  - HTTP mode for n8n integration
- Verified npm pack includes only intended files

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed vite-plugin-singlefile version**
- **Found during:** Task 2
- **Issue:** Package specified ^3.0.0 but latest is 2.3.0
- **Fix:** Changed to ^2.3.0
- **Files modified:** src/package.json
- **Commit:** 2b90af1

**2. [Rule 3 - Blocking] Fixed zod version for ext-apps compatibility**
- **Found during:** Task 2
- **Issue:** Project decision pinned zod to 3.22.5, but ext-apps@1.0.1 requires ^3.25.0
- **Fix:** Updated to 3.25.76 (latest stable 3.x)
- **Files modified:** src/package.json
- **Commit:** 2b90af1

**3. [Rule 3 - Blocking] Made build:ui conditional**
- **Found during:** Task 2
- **Issue:** vite build fails because src/ui directory doesn't exist yet (created in 05-02)
- **Fix:** Added check to skip vite build if src/ui not found
- **Files modified:** src/package.json
- **Commit:** 2b90af1

**4. [Rule 1 - Bug] Fixed ui-resources.ts TypeScript errors**
- **Found during:** Verification
- **Issue:** Type instantiation too deep with Zod schemas and ext-apps generics
- **Fix:** Used type assertions to bypass deep type inference
- **Files modified:** src/ui-resources.ts
- **Commit:** 7749ca3

**5. [Rule 3 - Blocking] Committed missing 05-01 files**
- **Found during:** Verification
- **Issue:** ui-resources.ts and server.ts changes from 05-01 were never committed
- **Fix:** Committed as fix for 05-01
- **Files modified:** src/ui-resources.ts, src/server.ts
- **Commit:** 7749ca3

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| PKG-01 | Use @bexio/mcp-server scoped name | npm scoping for organization ownership and namespace |
| PKG-02 | Update zod to 3.25.76 | ext-apps peer dependency requires ^3.25.0, backwards compatible |
| PKG-03 | Conditional build:ui script | Allow full build before UI files exist (Plan 05-02) |

## Verification Results

| Check | Status | Output |
|-------|--------|--------|
| Build succeeds | PASS | tsc && build:ui (skipped) |
| Shebang present | PASS | #!/usr/bin/env node |
| Package name | PASS | @bexio/mcp-server |
| Bin field | PASS | bexio-mcp-server -> dist/index.js |
| Files array | PASS | ["dist", "README.md", "LICENSE"] |
| publishConfig | PASS | access: "public" |
| npm pack | PASS | 199 files, 67.5kB |

## Artifacts

| File | Purpose |
|------|---------|
| src/package.json | npm package configuration |
| src/LICENSE | MIT license text |
| src/README.md | Installation and usage documentation |

## npm Package Contents

```
@bexio/mcp-server@2.0.0
- LICENSE (1.1kB)
- README.md (1.3kB)
- dist/ (all compiled JavaScript)
- package.json (1.8kB)
Total: 199 files, 67.5kB packed
```

## Next Phase Readiness

**Ready for 05-04 (Claude Desktop Integration Guide):**
- Package is fully configured for npm publishing
- README has basic installation instructions to expand
- Claude Desktop config example is ready to be detailed
