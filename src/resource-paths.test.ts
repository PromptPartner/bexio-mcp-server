import { describe, it, expect } from "vitest";
import { BexioClient } from "./bexio-client.js";
import { handlers as taskHandlers } from "./tools/tasks/handlers.js";
import { handlers as referenceHandlers } from "./tools/reference/handlers.js";

/**
 * Some tools called resource names bexio does not have and always got a 404 (checked
 * live against a bexio company): contact sectors are /contact_branch, task priorities
 * and statuses are /todo_priority and /todo_status, document settings are
 * /kb_item_setting. The same naming applies to the task fields todo_priority_id and
 * todo_status_id, which create_task sent as task_*_id (bexio ignores unknown fields).
 */
function recordingClient(response: unknown = []) {
  const client = new BexioClient({ apiToken: "test" } as never);
  const calls: Array<{ method: string; endpoint: string; data?: unknown }> = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (client as any).makeRequest = async (method: string, endpoint: string, _params?: unknown, data?: unknown) => {
    calls.push({ method, endpoint, ...(data === undefined ? {} : { data }) });
    return response;
  };
  return { client, calls };
}

const PATHS: Array<[string, (c: BexioClient) => Promise<unknown>, string, string]> = [
  ["listContactSectors", (c) => c.listContactSectors(), "GET", "/contact_branch"],
  ["searchContactSectors", (c) => c.searchContactSectors("Bau"), "POST", "/contact_branch/search"],
  ["listTaskPriorities", (c) => c.listTaskPriorities(), "GET", "/todo_priority"],
  ["listTaskStatuses", (c) => c.listTaskStatuses(), "GET", "/todo_status"],
  ["listDocumentSettings", (c) => c.listDocumentSettings(), "GET", "/kb_item_setting"],
];

describe("resources use bexio's real names", () => {
  it.each(PATHS)("%s", async (_name, call, method, endpoint) => {
    const { client, calls } = recordingClient();
    await call(client);
    expect(calls.map(({ method, endpoint }) => ({ method, endpoint }))).toEqual([{ method, endpoint }]);
  });
});

describe("get_contact_sector (bexio has no GET /contact_branch/{id})", () => {
  it("picks the sector from the list", async () => {
    const { client, calls } = recordingClient([{ id: 1, name: "Bau" }, { id: 2, name: "IT" }]);
    expect(await referenceHandlers.get_contact_sector(client, { sector_id: 2 })).toEqual({ id: 2, name: "IT" });
    expect(calls).toEqual([{ method: "GET", endpoint: "/contact_branch" }]);
  });

  it("reports an unknown id as not found", async () => {
    const { client } = recordingClient([{ id: 1, name: "Bau" }]);
    await expect(referenceHandlers.get_contact_sector(client, { sector_id: 9 })).rejects.toThrow(/not found/i);
  });
});

describe("create_task sends bexio's todo_* field names", () => {
  it("maps task_priority_id and task_status_id", async () => {
    const { client, calls } = recordingClient({});
    await taskHandlers.create_task(client, { subject: "Beleg nachfordern", user_id: 1, task_priority_id: 3, task_status_id: 1 });
    expect(calls).toHaveLength(1);
    expect(calls[0].data).toMatchObject({ todo_priority_id: 3, todo_status_id: 1 });
    expect(calls[0].data).not.toHaveProperty("task_priority_id");
    expect(calls[0].data).not.toHaveProperty("task_status_id");
  });
});
