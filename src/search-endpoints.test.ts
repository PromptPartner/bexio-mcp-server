import { describe, it, expect } from "vitest";
import { BexioClient } from "./bexio-client.js";
import { handlers as accounting } from "./tools/accounting/handlers.js";
import { handlers as reference } from "./tools/reference/handlers.js";
import { handlers as company } from "./tools/company/handlers.js";
import { handlers as timetracking } from "./tools/timetracking/handlers.js";
import { handlers as reminders } from "./tools/reminders/handlers.js";

/**
 * bexio searches by POSTing an array of criteria to {resource}/search. The name searches
 * send a single "like" criterion on name; calendar years and invoice reminders take the
 * caller's criteria as they are.
 */
type Call = { method: string; endpoint: string; params?: unknown; data?: unknown };

function recordingClient() {
  const client = new BexioClient({ apiToken: "test" } as never);
  const calls: Call[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = client as any;
  const record = (method: string, endpoint: string, params?: unknown, data?: unknown) => {
    calls.push({ method, endpoint, params, data });
    return [];
  };
  c.makeRequest = async (method: string, endpoint: string, params?: unknown, data?: unknown) =>
    record(method, `/2.0${endpoint}`, params, data);
  c.makeVersionedRequest = async (version: string, method: string, endpoint: string, params?: unknown, data?: unknown) =>
    record(method, `/${version}/${endpoint}`, params, data);
  return { client, calls };
}

const byName = (query: string) => [{ field: "name", value: query, criteria: "like" }];

const CASES: Array<[string, (c: BexioClient) => Promise<unknown>, Partial<Call>]> = [
  ["search_countries", (c) => reference.search_countries(c, { query: "Schweiz" }), { method: "POST", endpoint: "/2.0/country/search", data: byName("Schweiz") }],
  ["search_languages", (c) => reference.search_languages(c, { query: "Deutsch" }), { method: "POST", endpoint: "/2.0/language/search", data: byName("Deutsch") }],
  ["search_units", (c) => reference.search_units(c, { query: "Std" }), { method: "POST", endpoint: "/2.0/unit/search", data: byName("Std") }],
  ["search_payment_types", (c) => company.search_payment_types(c, { query: "Rechnung" }), { method: "POST", endpoint: "/2.0/payment_type/search", data: byName("Rechnung") }],
  ["search_business_activities", (c) => timetracking.search_business_activities(c, { query: "Admin" }), { method: "POST", endpoint: "/2.0/client_service/search", data: byName("Admin") }],
  ["search_communication_types", (c) => timetracking.search_communication_types(c, { query: "Tel" }), { method: "POST", endpoint: "/2.0/communication_kind/search", data: byName("Tel") }],
  [
    "search_calendar_years",
    (c) => accounting.search_calendar_years(c, { search_criteria: [{ field: "start", value: "2025-01-01", criteria: "=" }] }),
    { method: "POST", endpoint: "/3.0/accounting/calendar_years/search", params: { limit: 100, offset: 0 }, data: [{ field: "start", value: "2025-01-01", criteria: "=" }] },
  ],
  [
    "search_invoice_reminders",
    (c) => reminders.search_invoice_reminders(c, { invoice_id: 12, search_criteria: [{ field: "is_sent", value: "true", criteria: "=" }] }),
    { method: "POST", endpoint: "/2.0/kb_invoice/12/kb_reminder/search", data: [{ field: "is_sent", value: "true", criteria: "=" }] },
  ],
];

describe("search tools post their criteria to the resource's /search path", () => {
  it.each(CASES)("%s", async (_name, call, expected) => {
    const { client, calls } = recordingClient();
    await call(client);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject(expected);
  });
});
