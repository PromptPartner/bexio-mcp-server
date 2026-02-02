# Phase 3: Projects & Accounting - Research

**Researched:** 2026-02-01
**Domain:** Bexio API Projects, Time Tracking, and Accounting
**Confidence:** HIGH

## Summary

Phase 3 implements project management (projects, types, statuses, milestones, work packages), time tracking (timesheets, statuses, business activities, communication types), and accounting foundation (chart of accounts, account groups, manual entries, journal, calendar/business years, VAT periods). This phase builds on the 128 tools from Phases 1-2, adding 16 new requirements across approximately 40-45 new tools.

The project and timesheet endpoints follow the established Bexio API v2.0 patterns. Projects support full CRUD plus archive/unarchive operations. Timesheets include tracking attributes for stopwatch functionality. Accounting endpoints include read-only reference data (accounts, account groups, years, VAT periods) and full CRUD for manual journal entries. The manual entry endpoint requires structured nested objects (entries array with debit/credit account IDs and amounts).

**Primary recommendation:** Follow the existing domain module pattern from Phases 1-2. Create two new domain folders (`projects/` and `accounting/`) with definitions.ts, handlers.ts, and index.ts files. Manual entries require flat-to-nested parameter transformation similar to the banking handlers established in Phase 2.

## Standard Stack

The established libraries/tools for this domain:

### Core (Existing from Phases 1-2)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @modelcontextprotocol/sdk | 1.25.2 | MCP server implementation | Required, established in Phase 1 |
| zod | 3.22.5 | Runtime validation | Pinned version, established in Phase 1 |
| axios | ^1.7.x | HTTP client | Already in use for Bexio API calls |

### Supporting (No New Libraries Needed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| N/A | - | - | No new dependencies required |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom time parsing | dayjs/date-fns | Duration format is simple "HH:MM", no library needed |
| Custom accounting logic | N/A | Bexio handles double-entry bookkeeping server-side |

**Installation:**
```bash
# No new packages needed - Phase 3 uses existing dependencies
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── tools/
│   ├── projects/            # NEW: Projects & Time Tracking domain
│   │   ├── definitions.ts   # Tool definitions for projects, timesheets, milestones, etc.
│   │   ├── handlers.ts      # Handler implementations
│   │   └── index.ts         # Barrel export
│   ├── accounting/          # NEW: Accounting domain
│   │   ├── definitions.ts   # Tool definitions for accounts, manual entries, etc.
│   │   ├── handlers.ts      # Handler implementations
│   │   └── index.ts         # Barrel export
│   ├── reference/           # Existing (Phase 2)
│   ├── banking/             # Existing (Phase 2)
│   ├── contacts/            # Existing (Phase 1)
│   └── index.ts             # Update to include new domains
├── types/
│   └── schemas/
│       ├── projects.ts      # NEW: Project/timesheet schemas
│       ├── accounting.ts    # NEW: Accounting schemas
│       └── index.ts         # Update to export new schemas
└── bexio-client.ts          # Add new API methods
```

### Pattern 1: Simple CRUD Handler (Projects, Accounts)
**What:** Straightforward API passthrough with Zod validation
**When to use:** Projects, project types, project statuses, accounts, calendar years, business years, VAT periods
**Example:**
```typescript
// Source: Established pattern from tools/reference/handlers.ts
// tools/projects/handlers.ts
export const handlers: Record<string, HandlerFn> = {
  list_projects: async (client, args) => {
    const params = ListProjectsParamsSchema.parse(args);
    return client.listProjects(params);
  },

  get_project: async (client, args) => {
    const { project_id } = GetProjectParamsSchema.parse(args);
    const project = await client.getProject(project_id);
    if (!project) {
      throw McpError.notFound("Project", project_id);
    }
    return project;
  },

  create_project: async (client, args) => {
    const params = CreateProjectParamsSchema.parse(args);
    return client.createProject(params);
  },
};
```

### Pattern 2: Nested Resource Handler (Milestones, Work Packages)
**What:** Resources nested under projects requiring parent ID
**When to use:** Milestones (/project/{id}/milestone), Work packages (/project/{id}/workpackage)
**Example:**
```typescript
// tools/projects/handlers.ts
export const handlers: Record<string, HandlerFn> = {
  list_milestones: async (client, args) => {
    const { project_id, ...params } = ListMilestonesParamsSchema.parse(args);
    return client.listMilestones(project_id, params);
  },

  create_milestone: async (client, args) => {
    const { project_id, ...milestoneData } = CreateMilestoneParamsSchema.parse(args);
    return client.createMilestone(project_id, milestoneData);
  },

  delete_milestone: async (client, args) => {
    const { project_id, milestone_id } = DeleteMilestoneParamsSchema.parse(args);
    return client.deleteMilestone(project_id, milestone_id);
  },
};
```

### Pattern 3: Manual Entry Handler with Nested Structure
**What:** Manual entries require structured request body with entries array
**When to use:** Creating manual journal entries with debit/credit accounts
**Example:**
```typescript
// tools/accounting/handlers.ts
export const handlers: Record<string, HandlerFn> = {
  create_manual_entry: async (client, args) => {
    const params = CreateManualEntryParamsSchema.parse(args);

    // Transform flat params to Bexio API nested structure
    const entryData = {
      type: params.type,
      date: params.date,
      reference_nr: params.reference_nr,
      entries: [{
        debit_account_id: params.debit_account_id,
        credit_account_id: params.credit_account_id,
        tax_id: params.tax_id,
        tax_account_id: params.tax_account_id,
        description: params.description,
        amount: params.amount,
        currency_id: params.currency_id,
        currency_factor: params.currency_factor,
      }],
    };

    return client.createManualEntry(entryData);
  },
};
```

### Anti-Patterns to Avoid
- **Hand-rolling double-entry validation:** Bexio API validates debits=credits server-side. Don't duplicate.
- **Ignoring nested resource URLs:** Milestones and work packages use `/project/{id}/milestone` not `/milestone`.
- **Assuming all accounting data is writable:** Accounts and account groups are read-only in most cases.
- **Hardcoding timesheet status IDs:** Use the API endpoint to fetch current status values.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Double-entry validation | Check debits=credits | Bexio API validation | API enforces accounting rules |
| Time duration calculation | Custom HH:MM math | Simple string format | Bexio accepts "HH:MM" directly |
| Project status workflow | Custom state machine | Bexio status IDs | API manages valid transitions |
| Account number generation | Custom incrementer | Bexio auto-assign | Account numbering is configured in Bexio |
| VAT calculation | Custom VAT logic | Bexio tax_id reference | Tax rates change; use API reference data |

**Key insight:** The Bexio API handles Swiss accounting compliance (double-entry bookkeeping, VAT reporting, fiscal year management). The MCP server should pass through requests and let Bexio validate/process.

## Common Pitfalls

### Pitfall 1: Timesheet Duration Format
**What goes wrong:** Sending duration as minutes (e.g., 150) instead of "HH:MM" string
**Why it happens:** Developers assume numeric duration in minutes
**How to avoid:** Document "HH:MM" format in tool descriptions (e.g., "02:30" for 2.5 hours)
**Warning signs:** API returns validation error about duration format

### Pitfall 2: Project ID Required for Nested Resources
**What goes wrong:** Trying to list all milestones without project_id
**Why it happens:** Expecting flat endpoint like `/milestone`
**How to avoid:** Always require project_id parameter for milestones and work packages
**Warning signs:** 404 errors or empty responses

### Pitfall 3: Manual Entry Requires Entries Array
**What goes wrong:** Creating manual entry without entries array
**Why it happens:** Assuming flat structure like other endpoints
**How to avoid:** Structure request with `entries: [{ debit_account_id, credit_account_id, amount, ... }]`
**Warning signs:** 400 error about missing entries

### Pitfall 4: Read-Only vs Writable Confusion
**What goes wrong:** Attempting to create/update read-only resources
**Why it happens:** Not all accounting data supports full CRUD
**How to avoid:** Follow API docs exactly:
  - Accounts: list, get, search (create available but limited)
  - Account groups: list only (no create/update)
  - Business years: list, get only
  - VAT periods: list, get only (closing via different mechanism)
  - Calendar years: list, get, create, search
**Warning signs:** 405 Method Not Allowed errors

### Pitfall 5: Archive vs Delete for Projects
**What goes wrong:** Deleting projects instead of archiving
**Why it happens:** Not knowing archive/unarchive endpoints exist
**How to avoid:** Offer archive_project and unarchive_project tools in addition to delete
**Warning signs:** User complaints about lost data; delete may fail if project has linked data

### Pitfall 6: Timesheet vs Monitoring Endpoint Confusion
**What goes wrong:** Using deprecated /monitoring endpoint instead of /timesheet
**Why it happens:** Old documentation references; some clients still use legacy endpoint
**How to avoid:** Use /2.0/timesheet endpoint exclusively
**Warning signs:** Deprecation warnings in API responses

## Code Examples

Verified patterns from official sources:

### BexioClient API Methods for Projects
```typescript
// Source: Bexio API docs (docs.bexio.com) + established BexioClient pattern
// Add to src/bexio-client.ts

// ===== PROJECTS =====
async listProjects(params: PaginationParams = {}): Promise<unknown[]> {
  return this.makeRequest("GET", "/pr_project", params);
}

async getProject(projectId: number): Promise<unknown> {
  return this.makeRequest("GET", `/pr_project/${projectId}`);
}

async createProject(data: {
  user_id: number;
  name: string;
  contact_id?: number;
  pr_state_id?: number;
  pr_project_type_id?: number;
  start_date?: string;
  end_date?: string;
  comment?: string;
}): Promise<unknown> {
  return this.makeRequest("POST", "/pr_project", undefined, data);
}

async updateProject(projectId: number, data: Record<string, unknown>): Promise<unknown> {
  return this.makeRequest("POST", `/pr_project/${projectId}`, undefined, data);
}

async deleteProject(projectId: number): Promise<unknown> {
  return this.makeRequest("DELETE", `/pr_project/${projectId}`);
}

async searchProjects(searchParams: Record<string, unknown>[]): Promise<unknown[]> {
  return this.makeRequest("POST", "/pr_project/search", undefined, searchParams);
}

async archiveProject(projectId: number): Promise<unknown> {
  return this.makeRequest("POST", `/pr_project/${projectId}/archive`);
}

async unarchiveProject(projectId: number): Promise<unknown> {
  return this.makeRequest("POST", `/pr_project/${projectId}/unarchive`);
}

// ===== PROJECT TYPES =====
async listProjectTypes(params: PaginationParams = {}): Promise<unknown[]> {
  return this.makeRequest("GET", "/pr_project_type", params);
}

async getProjectType(typeId: number): Promise<unknown> {
  return this.makeRequest("GET", `/pr_project_type/${typeId}`);
}

// ===== PROJECT STATUSES =====
async listProjectStatuses(params: PaginationParams = {}): Promise<unknown[]> {
  return this.makeRequest("GET", "/pr_project_state", params);
}

async getProjectStatus(statusId: number): Promise<unknown> {
  return this.makeRequest("GET", `/pr_project_state/${statusId}`);
}

// ===== MILESTONES =====
async listMilestones(projectId: number, params: PaginationParams = {}): Promise<unknown[]> {
  return this.makeRequest("GET", `/pr_project/${projectId}/milestone`, params);
}

async getMilestone(projectId: number, milestoneId: number): Promise<unknown> {
  return this.makeRequest("GET", `/pr_project/${projectId}/milestone/${milestoneId}`);
}

async createMilestone(projectId: number, data: {
  name: string;
  end_date?: string;
}): Promise<unknown> {
  return this.makeRequest("POST", `/pr_project/${projectId}/milestone`, undefined, data);
}

async deleteMilestone(projectId: number, milestoneId: number): Promise<unknown> {
  return this.makeRequest("DELETE", `/pr_project/${projectId}/milestone/${milestoneId}`);
}

// ===== WORK PACKAGES =====
async listWorkPackages(projectId: number, params: PaginationParams = {}): Promise<unknown[]> {
  return this.makeRequest("GET", `/pr_project/${projectId}/workpackage`, params);
}

async getWorkPackage(projectId: number, workpackageId: number): Promise<unknown> {
  return this.makeRequest("GET", `/pr_project/${projectId}/workpackage/${workpackageId}`);
}

async createWorkPackage(projectId: number, data: {
  name: string;
  estimated_time?: string;
}): Promise<unknown> {
  return this.makeRequest("POST", `/pr_project/${projectId}/workpackage`, undefined, data);
}

async updateWorkPackage(projectId: number, workpackageId: number, data: Record<string, unknown>): Promise<unknown> {
  return this.makeRequest("PATCH", `/pr_project/${projectId}/workpackage/${workpackageId}`, undefined, data);
}

async deleteWorkPackage(projectId: number, workpackageId: number): Promise<unknown> {
  return this.makeRequest("DELETE", `/pr_project/${projectId}/workpackage/${workpackageId}`);
}
```

### BexioClient API Methods for Time Tracking
```typescript
// Source: Bexio API docs + established pattern
// Add to src/bexio-client.ts

// ===== TIMESHEETS =====
async listTimesheets(params: PaginationParams = {}): Promise<unknown[]> {
  return this.makeRequest("GET", "/timesheet", params);
}

async getTimesheet(timesheetId: number): Promise<unknown> {
  return this.makeRequest("GET", `/timesheet/${timesheetId}`);
}

async createTimesheet(data: {
  user_id: number;
  client_service_id?: number;
  pr_project_id?: number;
  pr_package_id?: number;
  pr_milestone_id?: number;
  date: string;
  duration: string;  // "HH:MM" format
  text?: string;
  allowable_bill?: boolean;
  tracking_type?: number;
}): Promise<unknown> {
  return this.makeRequest("POST", "/timesheet", undefined, data);
}

async updateTimesheet(timesheetId: number, data: Record<string, unknown>): Promise<unknown> {
  return this.makeRequest("POST", `/timesheet/${timesheetId}`, undefined, data);
}

async deleteTimesheet(timesheetId: number): Promise<unknown> {
  return this.makeRequest("DELETE", `/timesheet/${timesheetId}`);
}

async searchTimesheets(searchParams: Record<string, unknown>[]): Promise<unknown[]> {
  return this.makeRequest("POST", "/timesheet/search", undefined, searchParams);
}

// ===== TIMESHEET STATUSES =====
async listTimesheetStatuses(): Promise<unknown[]> {
  return this.makeRequest("GET", "/timesheet_status");
}

// ===== BUSINESS ACTIVITIES =====
async listBusinessActivities(params: PaginationParams = {}): Promise<unknown[]> {
  return this.makeRequest("GET", "/client_service", params);
}

async getBusinessActivity(activityId: number): Promise<unknown> {
  return this.makeRequest("GET", `/client_service/${activityId}`);
}

async createBusinessActivity(data: { name: string }): Promise<unknown> {
  return this.makeRequest("POST", "/client_service", undefined, data);
}

// ===== COMMUNICATION TYPES =====
async listCommunicationTypes(params: PaginationParams = {}): Promise<unknown[]> {
  return this.makeRequest("GET", "/communication_kind", params);
}

async getCommunicationType(typeId: number): Promise<unknown> {
  return this.makeRequest("GET", `/communication_kind/${typeId}`);
}
```

### BexioClient API Methods for Accounting
```typescript
// Source: Bexio API docs + established pattern
// Add to src/bexio-client.ts

// ===== ACCOUNTS (Chart of Accounts) =====
async listAccounts(params: PaginationParams = {}): Promise<unknown[]> {
  return this.makeRequest("GET", "/accounts", params);
}

async getAccount(accountId: number): Promise<unknown> {
  return this.makeRequest("GET", `/accounts/${accountId}`);
}

async createAccount(data: {
  account_no: number;
  name: string;
  account_group_id: number;
  is_active?: boolean;
  tax_id?: number;
}): Promise<unknown> {
  return this.makeRequest("POST", "/accounts", undefined, data);
}

async searchAccounts(searchParams: Record<string, unknown>[]): Promise<unknown[]> {
  return this.makeRequest("POST", "/accounts/search", undefined, searchParams);
}

// ===== ACCOUNT GROUPS =====
async listAccountGroups(params: PaginationParams = {}): Promise<unknown[]> {
  return this.makeRequest("GET", "/account_groups", params);
}

// ===== CALENDAR YEARS =====
async listCalendarYears(params: PaginationParams = {}): Promise<unknown[]> {
  return this.makeRequest("GET", "/calendar_year", params);
}

async getCalendarYear(yearId: number): Promise<unknown> {
  return this.makeRequest("GET", `/calendar_year/${yearId}`);
}

// ===== BUSINESS YEARS =====
async listBusinessYears(params: PaginationParams = {}): Promise<unknown[]> {
  return this.makeRequest("GET", "/business_year", params);
}

// ===== MANUAL ENTRIES =====
async listManualEntries(params: PaginationParams = {}): Promise<unknown[]> {
  return this.makeRequest("GET", "/manual_entry", params);
}

async getManualEntry(entryId: number): Promise<unknown> {
  return this.makeRequest("GET", `/manual_entry/${entryId}`);
}

async createManualEntry(data: {
  type: string;  // 'manual_single_entry'
  date: string;
  reference_nr?: string;
  entries: Array<{
    debit_account_id: number;
    credit_account_id: number;
    tax_id?: number;
    tax_account_id?: number;
    description: string;
    amount: number;
    currency_id?: number;
    currency_factor?: number;
  }>;
}): Promise<unknown> {
  return this.makeRequest("POST", "/manual_entry", undefined, data);
}

async updateManualEntry(entryId: number, data: Record<string, unknown>): Promise<unknown> {
  return this.makeRequest("PUT", `/manual_entry/${entryId}`, undefined, data);
}

async deleteManualEntry(entryId: number): Promise<unknown> {
  return this.makeRequest("DELETE", `/manual_entry/${entryId}`);
}

// ===== VAT PERIODS =====
async listVatPeriods(params: PaginationParams = {}): Promise<unknown[]> {
  return this.makeRequest("GET", "/vat_period", params);
}

// ===== ACCOUNTING JOURNAL =====
async getJournal(params: {
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}): Promise<unknown[]> {
  return this.makeRequest("GET", "/journal", params);
}
```

### Zod Schemas for Projects
```typescript
// Source: Bexio API docs
// src/types/schemas/projects.ts
import { z } from "zod";

// ===== PROJECTS (PROJ-01) =====
export const ListProjectsParamsSchema = z.object({
  limit: z.number().int().positive().default(100),
  offset: z.number().int().min(0).default(0),
});

export const GetProjectParamsSchema = z.object({
  project_id: z.number().int().positive(),
});

export const CreateProjectParamsSchema = z.object({
  user_id: z.number().int().positive(),
  name: z.string().min(1, "Project name is required"),
  contact_id: z.number().int().positive().optional(),
  pr_state_id: z.number().int().positive().optional(),
  pr_project_type_id: z.number().int().positive().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  comment: z.string().optional(),
});

export const UpdateProjectParamsSchema = z.object({
  project_id: z.number().int().positive(),
  project_data: z.record(z.unknown()),
});

export const DeleteProjectParamsSchema = z.object({
  project_id: z.number().int().positive(),
});

export const ArchiveProjectParamsSchema = z.object({
  project_id: z.number().int().positive(),
});

// ===== TIMESHEETS (PROJ-06) =====
export const ListTimesheetsParamsSchema = z.object({
  limit: z.number().int().positive().default(100),
  offset: z.number().int().min(0).default(0),
});

export const GetTimesheetParamsSchema = z.object({
  timesheet_id: z.number().int().positive(),
});

export const CreateTimesheetParamsSchema = z.object({
  user_id: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  duration: z.string().regex(/^\d{2}:\d{2}$/, "Duration must be HH:MM format"),
  pr_project_id: z.number().int().positive().optional(),
  pr_package_id: z.number().int().positive().optional(),
  pr_milestone_id: z.number().int().positive().optional(),
  client_service_id: z.number().int().positive().optional(),
  text: z.string().optional(),
  allowable_bill: z.boolean().default(true),
});

export const DeleteTimesheetParamsSchema = z.object({
  timesheet_id: z.number().int().positive(),
});

// ===== MILESTONES (PROJ-04) =====
export const ListMilestonesParamsSchema = z.object({
  project_id: z.number().int().positive(),
  limit: z.number().int().positive().default(100),
  offset: z.number().int().min(0).default(0),
});

export const GetMilestoneParamsSchema = z.object({
  project_id: z.number().int().positive(),
  milestone_id: z.number().int().positive(),
});

export const CreateMilestoneParamsSchema = z.object({
  project_id: z.number().int().positive(),
  name: z.string().min(1, "Milestone name is required"),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const DeleteMilestoneParamsSchema = z.object({
  project_id: z.number().int().positive(),
  milestone_id: z.number().int().positive(),
});

// ===== WORK PACKAGES (PROJ-05) =====
export const ListWorkPackagesParamsSchema = z.object({
  project_id: z.number().int().positive(),
  limit: z.number().int().positive().default(100),
  offset: z.number().int().min(0).default(0),
});

export const GetWorkPackageParamsSchema = z.object({
  project_id: z.number().int().positive(),
  workpackage_id: z.number().int().positive(),
});

export const CreateWorkPackageParamsSchema = z.object({
  project_id: z.number().int().positive(),
  name: z.string().min(1, "Work package name is required"),
  estimated_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

export const UpdateWorkPackageParamsSchema = z.object({
  project_id: z.number().int().positive(),
  workpackage_id: z.number().int().positive(),
  workpackage_data: z.record(z.unknown()),
});

export const DeleteWorkPackageParamsSchema = z.object({
  project_id: z.number().int().positive(),
  workpackage_id: z.number().int().positive(),
});
```

### Zod Schemas for Accounting
```typescript
// Source: Bexio API docs + Laravel Bexio package examples
// src/types/schemas/accounting.ts
import { z } from "zod";

// ===== ACCOUNTS (ACCT-01) =====
export const ListAccountsParamsSchema = z.object({
  limit: z.number().int().positive().default(100),
  offset: z.number().int().min(0).default(0),
});

export const GetAccountParamsSchema = z.object({
  account_id: z.number().int().positive(),
});

export const CreateAccountParamsSchema = z.object({
  account_no: z.number().int().positive(),
  name: z.string().min(1, "Account name is required"),
  account_group_id: z.number().int().positive(),
  is_active: z.boolean().default(true),
  tax_id: z.number().int().positive().optional(),
});

// ===== ACCOUNT GROUPS (ACCT-02) =====
export const ListAccountGroupsParamsSchema = z.object({
  limit: z.number().int().positive().default(100),
  offset: z.number().int().min(0).default(0),
});

// ===== CALENDAR YEARS (ACCT-03) =====
export const ListCalendarYearsParamsSchema = z.object({
  limit: z.number().int().positive().default(100),
  offset: z.number().int().min(0).default(0),
});

export const GetCalendarYearParamsSchema = z.object({
  year_id: z.number().int().positive(),
});

// ===== BUSINESS YEARS (ACCT-04) =====
export const ListBusinessYearsParamsSchema = z.object({
  limit: z.number().int().positive().default(100),
  offset: z.number().int().min(0).default(0),
});

// ===== MANUAL ENTRIES (ACCT-05) =====
export const ListManualEntriesParamsSchema = z.object({
  limit: z.number().int().positive().default(100),
  offset: z.number().int().min(0).default(0),
});

export const GetManualEntryParamsSchema = z.object({
  entry_id: z.number().int().positive(),
});

export const CreateManualEntryParamsSchema = z.object({
  type: z.literal("manual_single_entry").default("manual_single_entry"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  reference_nr: z.string().optional(),
  debit_account_id: z.number().int().positive(),
  credit_account_id: z.number().int().positive(),
  amount: z.number().positive(),
  description: z.string().min(1, "Description is required"),
  tax_id: z.number().int().positive().optional(),
  tax_account_id: z.number().int().positive().optional(),
  currency_id: z.number().int().positive().optional(),
  currency_factor: z.number().positive().default(1),
});

export const UpdateManualEntryParamsSchema = z.object({
  entry_id: z.number().int().positive(),
  entry_data: z.record(z.unknown()),
});

export const DeleteManualEntryParamsSchema = z.object({
  entry_id: z.number().int().positive(),
});

// ===== VAT PERIODS (ACCT-06) =====
export const ListVatPeriodsParamsSchema = z.object({
  limit: z.number().int().positive().default(100),
  offset: z.number().int().min(0).default(0),
});

// ===== JOURNAL (ACCT-07) =====
export const GetJournalParamsSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.number().int().positive().default(100),
  offset: z.number().int().min(0).default(0),
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| /monitoring endpoint | /timesheet endpoint | v2.0 API | Legacy endpoint deprecated |
| pr_project_id in timesheets | project_id in some contexts | v2.0 | Use pr_project_id for linking |
| Manual double-entry validation | API-side validation | Always | Let API validate debits=credits |

**Deprecated/outdated:**
- Legacy /monitoring endpoint: Use /timesheet instead (response includes deprecation warning)
- Direct project status manipulation: Use archive/unarchive endpoints for project lifecycle

## Open Questions

Things that couldn't be fully resolved:

1. **Account Creation Restrictions**
   - What we know: POST /accounts endpoint exists
   - What's unclear: Whether account creation is restricted by Bexio subscription tier
   - Recommendation: Implement the tool; API will return clear error if not allowed

2. **Timesheet Tracking Object**
   - What we know: Timesheets include "tracking" attribute with stopwatch info
   - What's unclear: Whether tracking can be started/stopped via API
   - Recommendation: Implement basic CRUD first; tracking may be UI-only feature

3. **Journal Entry Read Access**
   - What we know: GET /journal returns read-only journal entries
   - What's unclear: Full parameter specification for date filtering
   - Recommendation: Implement with start_date/end_date optional params; test with API

4. **Business Activity Endpoint Name**
   - What we know: Documentation refers to "business activities" and "client services"
   - What's unclear: Exact endpoint path (likely /client_service)
   - Recommendation: Test /client_service endpoint; may also be /business_activity

## Sources

### Primary (HIGH confidence)
- [Bexio API Documentation](https://docs.bexio.com/) - Main endpoint reference for all resources
- Existing v2 codebase patterns (tools/reference/, tools/banking/, bexio-client.ts)

### Secondary (MEDIUM confidence)
- [Laravel Bexio Package](https://github.com/codebar-ag/laravel-bexio) - DTO structures for manual entries
- [Rollout Bexio Integration Guide](https://rollout.com/integration-guides/bexio/sdk/step-by-step-guide-to-building-a-bexio-api-integration-in-java) - Timesheet field examples
- [bexio_api_client Elixir](https://hexdocs.pm/bexio_api_client/) - Module structure reference

### Tertiary (LOW confidence)
- WebSearch results for specific field names (validated against docs where possible)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies, established patterns
- Architecture: HIGH - Follows Phase 1-2 patterns exactly
- Pitfalls: MEDIUM - Most from official docs, some from community sources
- API endpoints: HIGH - Verified against docs.bexio.com

**Research date:** 2026-02-01
**Valid until:** 2026-03-01 (30 days - stable endpoints, accounting rules rarely change)

## Tool Inventory

Phase 3 implements the following tools (approximately 42 total):

### Projects & Time Tracking Tools (PROJ-01 through PROJ-09)
| Requirement | Tools | API Operations |
|-------------|-------|----------------|
| PROJ-01 | list_projects, get_project, create_project, update_project, delete_project, archive_project, unarchive_project, search_projects | 8 |
| PROJ-02 | list_project_types, get_project_type | 2 |
| PROJ-03 | list_project_statuses, get_project_status | 2 |
| PROJ-04 | list_milestones, get_milestone, create_milestone, delete_milestone | 4 |
| PROJ-05 | list_work_packages, get_work_package, create_work_package, update_work_package, delete_work_package | 5 |
| PROJ-06 | list_timesheets, get_timesheet, create_timesheet, delete_timesheet, search_timesheets | 5 |
| PROJ-07 | list_timesheet_statuses | 1 |
| PROJ-08 | list_business_activities, get_business_activity, create_business_activity | 3 |
| PROJ-09 | list_communication_types, get_communication_type | 2 |

**Projects & Time Tracking Subtotal:** ~32 tools

### Accounting Tools (ACCT-01 through ACCT-07)
| Requirement | Tools | API Operations |
|-------------|-------|----------------|
| ACCT-01 | list_accounts, get_account, create_account, search_accounts | 4 |
| ACCT-02 | list_account_groups | 1 |
| ACCT-03 | list_calendar_years, get_calendar_year | 2 |
| ACCT-04 | list_business_years | 1 |
| ACCT-05 | list_manual_entries, get_manual_entry, create_manual_entry, update_manual_entry, delete_manual_entry | 5 |
| ACCT-06 | list_vat_periods | 1 |
| ACCT-07 | get_journal | 1 |

**Accounting Subtotal:** ~15 tools

**Phase 3 Total:** ~42-47 tools (some requirements may need fewer tools if API doesn't support all operations)

## Suggested Plan Structure

Based on dependencies and complexity:

### Plan 03-01: Projects Core
- Projects CRUD (list, get, create, update, delete, archive, unarchive, search)
- Project types (list, get)
- Project statuses (list, get)
- ~12 tools

### Plan 03-02: Project Nested Resources
- Milestones (list, get, create, delete)
- Work packages (list, get, create, update, delete)
- ~9 tools

### Plan 03-03: Time Tracking
- Timesheets (list, get, create, delete, search)
- Timesheet statuses (list)
- Business activities (list, get, create)
- Communication types (list, get)
- ~11 tools

### Plan 03-04: Accounting Foundation
- Accounts (list, get, create, search)
- Account groups (list)
- Calendar years (list, get)
- Business years (list)
- Manual entries (list, get, create, update, delete)
- VAT periods (list)
- Journal (get)
- ~15 tools
