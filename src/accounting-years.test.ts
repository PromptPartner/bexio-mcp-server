import { describe, it, expect } from "vitest";
import { BexioClient } from "./bexio-client.js";
import { handlers as accounting } from "./tools/accounting/handlers.js";

/** Business years, VAT periods and calendar years (v3.0 accounting). */
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

describe("single business year and VAT period", () => {
  const CASES: Array<[string, (c: BexioClient) => Promise<unknown>, Partial<Call>]> = [
    ["get_business_year", (c) => accounting.get_business_year(c, { business_year_id: 5 }), { method: "GET", endpoint: "/3.0/accounting/business_years/5" }],
    ["get_vat_period", (c) => accounting.get_vat_period(c, { vat_period_id: 7 }), { method: "GET", endpoint: "/3.0/accounting/vat_periods/7" }],
  ];

  it.each(CASES)("%s", async (_name, call, expected) => {
    const { client, calls } = recordingClient();
    await call(client);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject(expected);
  });
});

describe("create_calendar_year", () => {
  it("posts the year and its VAT settings", async () => {
    const { client, calls } = recordingClient();
    await accounting.create_calendar_year(client, { year: "2027", is_vat_subject: false });
    expect(calls).toEqual([
      { method: "POST", endpoint: "/3.0/accounting/calendar_years", params: undefined, data: { year: "2027", is_vat_subject: false } },
    ]);
  });

  it("rejects a year that is not four digits", async () => {
    const { client, calls } = recordingClient();
    await expect(accounting.create_calendar_year(client, { year: "27" })).rejects.toThrow();
    expect(calls).toEqual([]);
  });
});
