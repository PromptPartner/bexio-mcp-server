---
phase: 05-ui-packaging
plan: 01
subsystem: ui
tags: [mcp-apps, vite, ui-resources, html, typescript]

dependency-graph:
  requires: [01-foundation-migration]
  provides: [ui-resources, preview-invoice, show-contact-card, show-dashboard]
  affects: [05-02-mcpb-bundle]

tech-stack:
  added:
    - "@modelcontextprotocol/ext-apps ^1.0.1"
    - "vite ^6.0.0"
    - "vite-plugin-singlefile ^2.3.0"
    - "concurrently ^8.0.0"
  patterns:
    - "registerAppTool for UI-linked tools"
    - "registerAppResource for HTML delivery"
    - "ui:// URI scheme for resources"

key-files:
  created:
    - src/ui-resources.ts
    - src/ui/invoice-preview/invoice-preview.html
    - src/ui/invoice-preview/mcp-app.ts
    - src/ui/contact-card/contact-card.html
    - src/ui/contact-card/mcp-app.ts
    - src/ui/dashboard/dashboard.html
    - src/ui/dashboard/mcp-app.ts
    - src/vite.config.ts
  modified:
    - src/package.json
    - src/server.ts

decisions:
  - id: UI-01
    choice: "Use (registerAppTool as any) for Zod 3.25.x type compatibility"
    why: "Zod 3.25.x type inference too deep with ext-apps generics causing TS2589"
  - id: UI-02
    choice: "Use useRecommendedBuildConfig: false in vite-plugin-singlefile"
    why: "Allows multiple entry points - inlineDynamicImports conflicts with MPA"
  - id: UI-03
    choice: "Upgrade zod to 3.25.76 from 3.22.5"
    why: "Required by ext-apps peer dependency (^3.25.0 || ^4.0.0)"

metrics:
  duration: "17 min"
  completed: "2026-02-01"
---

# Phase 5 Plan 01: MCP Apps UI Resources Summary

## One-liner

MCP Apps UI resources with preview_invoice, show_contact_card, show_dashboard tools using ext-apps SDK and Vite single-file bundling.

## What Was Built

### UI Resource Architecture

Implemented MCP Apps extension for interactive UI rendering in Claude conversations:

1. **Invoice Preview UI** (`preview_invoice` tool)
   - Displays invoice header (number, title, dates)
   - Contact section with bill-to information
   - Line items table (description, qty, price, amount)
   - Total section with currency formatting
   - Status badge (Draft/Pending/Sent/Paid/Overdue/Cancelled)

2. **Contact Card UI** (`show_contact_card` tool)
   - Avatar with initials and gradient header
   - Contact type badge (Company/Person)
   - Contact details (email, phone, mobile, fax)
   - Address section with country lookup

3. **Dashboard UI** (`show_dashboard` tool)
   - Open invoices count and total
   - Overdue invoices count and total
   - Recent contacts list with avatars
   - Responsive 3-column grid layout

### Build Pipeline

- Vite 6.x with vite-plugin-singlefile for HTML bundling
- Multi-entry point configuration for 3 HTML files
- Inline CSS and JS for self-contained resources
- Build outputs to `dist/ui/ui/<name>/<name>.html`

### Server Integration

- `registerUIResources(server, client)` function in ui-resources.ts
- Called from server.ts during initialization
- Uses `ui://bexio/*.html` URI scheme for resources
- Tools return JSON data; UI resources read from dist

## Key Files

| File | Purpose |
|------|---------|
| `src/ui-resources.ts` | Tool + resource registration using ext-apps SDK |
| `src/ui/invoice-preview/invoice-preview.html` | Invoice preview template |
| `src/ui/invoice-preview/mcp-app.ts` | Invoice App client logic |
| `src/ui/contact-card/contact-card.html` | Contact card template |
| `src/ui/contact-card/mcp-app.ts` | Contact App client logic |
| `src/ui/dashboard/dashboard.html` | Dashboard template |
| `src/ui/dashboard/mcp-app.ts` | Dashboard App client logic |
| `src/vite.config.ts` | Multi-entry Vite configuration |

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 7ede15e | feat | Add MCP Apps dependencies and Vite config |
| fb4ebd7 | feat | Create UI HTML templates and MCP App scripts |
| 7749ca3 | fix | Complete UI resources registration |
| 8db229e | feat | Register UI resources and tools in server |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Zod peer dependency conflict**
- **Found during:** Task 1 (npm install)
- **Issue:** ext-apps requires zod ^3.25.0, project had 3.22.5
- **Fix:** Updated zod to 3.25.76
- **Files modified:** src/package.json

**2. [Rule 3 - Blocking] vite-plugin-singlefile version**
- **Found during:** Task 1 (npm install)
- **Issue:** Plan specified ^3.0.0, latest is 2.3.0
- **Fix:** Used ^2.3.0 instead
- **Files modified:** src/package.json

**3. [Rule 3 - Blocking] Zod 3.25.x type inference issue**
- **Found during:** Task 3 (type-check)
- **Issue:** TS2589 "Type instantiation excessively deep" with registerAppTool
- **Fix:** Use `(registerAppTool as any)` with eslint-disable comment
- **Files modified:** src/ui-resources.ts

**4. [Rule 3 - Blocking] vite-plugin-singlefile multiple entry conflict**
- **Found during:** Task 3 (build)
- **Issue:** inlineDynamicImports: true conflicts with multiple inputs
- **Fix:** Set useRecommendedBuildConfig: false, manually configure build options
- **Files modified:** src/vite.config.ts

## Verification Results

- [x] `npm run build` completes successfully
- [x] `npm run type-check` passes
- [x] 3 HTML files in dist/ui/ui/*/*.html
- [x] registerUIResources imported and called in server.ts
- [x] ext-apps and vite dependencies in package.json

## Next Phase Readiness

**Ready for 05-02 (MCPB Bundle):**
- UI resources bundled and ready
- dist/ output structure established
- Build pipeline functional

**Potential concerns:**
- Output path `dist/ui/ui/...` has extra nesting (cosmetic)
- ext-apps SDK is v1.0.1 (new, watch for updates)

## Tool Count

**Added:** 3 UI tools (preview_invoice, show_contact_card, show_dashboard)
**Total:** 221 tools (218 base + 3 UI)
