---
phase: 04-purchase-files-payroll
plan: 04
subsystem: api
tags: [payroll, employees, absences, conditional-module, bexio]

# Dependency graph
requires:
  - phase: 01-foundation-migration
    provides: SDK 1.25.2, Zod schemas, BexioClient pattern
  - phase: 04-purchase-files-payroll/03
    provides: Files tools, BexioClient payroll methods
provides:
  - Payroll tool definitions (10 tools)
  - Module detection with probe-on-first-call caching
  - Friendly error messages for unavailable module
affects: [05-packaging-integration]

# Tech tracking
tech-stack:
  added: []
  patterns: [conditional-module-detection, probe-and-cache]

key-files:
  created:
    - src/tools/payroll/definitions.ts
    - src/tools/payroll/handlers.ts
    - src/tools/payroll/index.ts
  modified:
    - src/tools/index.ts

key-decisions:
  - "Probe-on-first-call pattern for module detection (not startup)"
  - "Cache availability result for session duration"
  - "Friendly multi-line error with upgrade instructions"

patterns-established:
  - "Conditional module: probe listX(limit=1), cache result, throw friendly error"

# Metrics
duration: 8min
completed: 2026-02-01
---

# Phase 4 Plan 4: Payroll Tools Summary

**Conditional payroll tools (10) with probe-on-first-call module detection and friendly upgrade error messages**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-01T21:38:00Z
- **Completed:** 2026-02-01T21:46:00Z
- **Tasks:** 2 (Task 1 pre-completed by 04-03)
- **Files modified:** 4

## Accomplishments

- 10 payroll tools: employees (4) + absences (5) + payroll documents (1)
- Module detection probes on first call, caches result for session
- User-friendly error explains payroll features and upgrade path
- Total tools now 218 (175 base + 43 Phase 4)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create payroll schemas and BexioClient methods** - Pre-completed in `8f30efb` (04-03)
2. **Task 2: Create payroll tool definitions and handlers** - `eda345b` (feat)

## Files Created/Modified

- `src/types/schemas/payroll.ts` - 10 Zod schemas (created in 04-03)
- `src/tools/payroll/definitions.ts` - 10 tool definitions
- `src/tools/payroll/handlers.ts` - Handlers with module detection (189 lines)
- `src/tools/payroll/index.ts` - Barrel export
- `src/tools/index.ts` - Aggregates payroll module (218 total tools)

## Decisions Made

- **Probe-on-first-call pattern:** Check module availability when first payroll tool is called, not at startup (avoids unnecessary API calls)
- **Cache result:** Store `payrollModuleAvailable` boolean for session (avoids repeated probes)
- **Friendly error message:** Multi-line explanation of what payroll provides, how to enable it, and link to Bexio pricing

## Deviations from Plan

None - plan executed exactly as written.

Note: Task 1 (schemas and client methods) was already completed as part of plan 04-03, which added both files.ts and payroll.ts schemas together for efficiency.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 4 complete: 43 new tools added (bills, expenses, purchase orders, outgoing payments, files, additional addresses, employees, absences, payroll documents)
- Total tools: 218
- Ready for Phase 5: Packaging & Integration

---
*Phase: 04-purchase-files-payroll*
*Completed: 2026-02-01*
