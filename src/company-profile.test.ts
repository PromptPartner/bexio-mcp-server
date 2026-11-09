import { describe, it, expect } from "vitest";
import { BexioClient } from "./bexio-client.js";
import { handlers as company } from "./tools/company/handlers.js";

/** get_company_profile returns the list of profiles, or one profile with profile_id. */
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

describe("get_company_profile", () => {
  it("lists the profiles without profile_id", async () => {
    const { client, calls } = recordingClient();
    await company.get_company_profile(client, {});
    expect(calls).toEqual([{ method: "GET", endpoint: "/2.0/company_profile", params: undefined, data: undefined }]);
  });

  it("fetches one profile with profile_id", async () => {
    const { client, calls } = recordingClient();
    await company.get_company_profile(client, { profile_id: 1 });
    expect(calls).toEqual([{ method: "GET", endpoint: "/2.0/company_profile/1", params: undefined, data: undefined }]);
  });
});
