import { describe, it, expect } from "vitest";
import { BexioClient } from "./bexio-client.js";
import { handlers as reference } from "./tools/reference/handlers.js";
import { handlers as timetracking } from "./tools/timetracking/handlers.js";
import { handlers as projects } from "./tools/projects/handlers.js";

/**
 * bexio's edit endpoints (POST /{resource}/{id}) reject a payload that lacks the
 * resource's required fields, even for a partial edit. The edit tools read the current
 * record first and fill those fields, so a caller sends only what changes.
 */
type Call = { method: string; endpoint: string; params?: unknown; data?: unknown };

function recordingClient(current: Record<string, unknown> = {}) {
  const client = new BexioClient({ apiToken: "test" } as never);
  const calls: Call[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = client as any;
  const record = (method: string, endpoint: string, params?: unknown, data?: unknown) => {
    calls.push({ method, endpoint, params, data });
    return method === "GET" ? current : {};
  };
  c.makeRequest = async (method: string, endpoint: string, params?: unknown, data?: unknown) =>
    record(method, `/2.0${endpoint}`, params, data);
  c.makeVersionedRequest = async (version: string, method: string, endpoint: string, params?: unknown, data?: unknown) =>
    record(method, `/${version}/${endpoint}`, params, data);
  return { client, calls };
}

describe("edits fill bexio's required fields from the current record", () => {
  it("update_country keeps name_short and iso code when only the name changes", async () => {
    const { client, calls } = recordingClient({ id: 3, name: "Schweiz", name_short: "CH", iso3166_alpha2: "CH" });
    await reference.update_country(client, { country_id: 3, country_data: { name: "Suisse" } });
    expect(calls.map((c) => [c.method, c.endpoint])).toEqual([["GET", "/2.0/country/3"], ["POST", "/2.0/country/3"]]);
    expect(calls[1].data).toEqual({ name: "Suisse", name_short: "CH", iso3166_alpha2: "CH" });
  });

  it("update_unit posts the new name (its only field)", async () => {
    const { client, calls } = recordingClient();
    await reference.update_unit(client, { unit_id: 4, name: "Stunden" });
    expect(calls).toEqual([{ method: "POST", endpoint: "/2.0/unit/4", params: undefined, data: { name: "Stunden" } }]);
  });

  it("update_timesheet carries user_id, client_service_id and allowable_bill", async () => {
    const { client, calls } = recordingClient({ id: 9, user_id: 1, client_service_id: 2, allowable_bill: true, text: "alt" });
    await timetracking.update_timesheet(client, { timesheet_id: 9, timesheet_data: { text: "neu" } });
    expect(calls[1]).toMatchObject({ method: "POST", endpoint: "/2.0/timesheet/9" });
    expect(calls[1].data).toEqual({ user_id: 1, client_service_id: 2, allowable_bill: true, text: "neu" });
  });

  it("update_milestone keeps the name and posts to the v3.0 milestone", async () => {
    const { client, calls } = recordingClient({ id: 6, name: "Rohbau", end_date: "2026-06-30" });
    await projects.update_milestone(client, { project_id: 2, milestone_id: 6, milestone_data: { end_date: "2026-07-31" } });
    expect(calls[1]).toMatchObject({ method: "POST", endpoint: "/3.0/projects/2/milestones/6" });
    expect(calls[1].data).toEqual({ name: "Rohbau", end_date: "2026-07-31" });
  });
});
