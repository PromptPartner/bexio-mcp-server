---
phase: 03-projects-accounting
plan: 02
status: complete
completed: 2026-02-01
duration: ~4min

subsystem: projects-nested
tags: [milestones, work-packages, nested-resources, projects]

dependency-graph:
  requires: [03-01]
  provides: [milestones-crud, work-packages-crud]
  affects: []

tech-stack:
  added: []
  patterns: [nested-resource-urls, parent-child-validation]

key-files:
  created: []
  modified:
    - src/types/schemas/projects.ts
    - src/bexio-client.ts
    - src/tools/projects/definitions.ts
    - src/tools/projects/handlers.ts
    - src/tools/index.ts

decisions:
  - id: PROJ-04
    choice: "Nested URL pattern for milestones"
    reason: "Bexio API requires /pr_project/{id}/milestone pattern"
  - id: PROJ-05
    choice: "estimated_time in HH:MM format"
    reason: "Consistent with Bexio API duration format used elsewhere"

metrics:
  tools-added: 9
  tool-count-before: 166
  tool-count-after: 175
  schemas-created: 9
  client-methods-added: 9
---

# Phase 3 Plan 2: Project Nested Resources Summary

**One-liner:** Milestones and work packages nested under projects with full CRUD operations via nested API URLs

## What Was Built

### Tools Added (9)

**Milestones (PROJ-04) - 4 tools:**
| Tool | Operation | API Endpoint |
|------|-----------|--------------|
| list_milestones | GET | /pr_project/{id}/milestone |
| get_milestone | GET | /pr_project/{id}/milestone/{mid} |
| create_milestone | POST | /pr_project/{id}/milestone |
| delete_milestone | DELETE | /pr_project/{id}/milestone/{mid} |

**Work Packages (PROJ-05) - 5 tools:**
| Tool | Operation | API Endpoint |
|------|-----------|--------------|
| list_work_packages | GET | /pr_project/{id}/workpackage |
| get_work_package | GET | /pr_project/{id}/workpackage/{wid} |
| create_work_package | POST | /pr_project/{id}/workpackage |
| update_work_package | PATCH | /pr_project/{id}/workpackage/{wid} |
| delete_work_package | DELETE | /pr_project/{id}/workpackage/{wid} |

### Schemas Created

All in `src/types/schemas/projects.ts`:

**Milestones:**
- ListMilestonesParamsSchema (project_id, limit, offset)
- GetMilestoneParamsSchema (project_id, milestone_id)
- CreateMilestoneParamsSchema (project_id, name, end_date?)
- DeleteMilestoneParamsSchema (project_id, milestone_id)

**Work Packages:**
- ListWorkPackagesParamsSchema (project_id, limit, offset)
- GetWorkPackageParamsSchema (project_id, workpackage_id)
- CreateWorkPackageParamsSchema (project_id, name, estimated_time?)
- UpdateWorkPackageParamsSchema (project_id, workpackage_id, workpackage_data)
- DeleteWorkPackageParamsSchema (project_id, workpackage_id)

### BexioClient Methods

9 new methods added to `src/bexio-client.ts`:
- Milestones: listMilestones, getMilestone, createMilestone, deleteMilestone
- Work Packages: listWorkPackages, getWorkPackage, createWorkPackage, updateWorkPackage, deleteWorkPackage

## Decisions Made

1. **Nested URL pattern** - All milestone and work package operations use `/pr_project/{projectId}/resource` pattern following Bexio API structure. This enforces parent-child relationship.

2. **HH:MM format for estimated_time** - Work package estimated_time uses the same HH:MM duration format as timesheets, validated via Zod regex pattern.

3. **project_id required on all operations** - Every nested resource operation requires project_id parameter to ensure proper scoping and prevent orphaned resources.

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

| Check | Result |
|-------|--------|
| npm run build | Pass |
| Tool count | 175 (166 + 9) |
| Handlers accessible | All 9 |
| console.log check | 0 found |
| Nested URL pattern | Verified in bexio-client.ts |

## Commits

| Hash | Description |
|------|-------------|
| e719279 | feat(03-02): add milestone and work package schemas and client methods |
| 0957082 | feat(03-02): add milestone and work package tool definitions and handlers |

## Next Phase Readiness

**Phase 3 complete.** All 47 new tools implemented:
- 03-01: Projects Core (12 tools)
- 03-02: Project Nested Resources (9 tools)
- 03-03: Time Tracking (11 tools)
- 03-04: Accounting Foundation (15 tools)

Projects domain now has 21 tools total (12 + 9).
