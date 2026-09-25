import { describe, it, expect } from "vitest";
import { BexioClient } from "./bexio-client.js";

/**
 * Manual entries need a currency_id. The default must be the tenant's own base
 * currency, not a hard-coded 1: currency ids are global (1 = CHF, 2 = EUR, ...), so in
 * an EUR mandate id 1 would book the amount in CHF without any error.
 *
 * bexio's spec lists company_profile.base_currency_id, but the live API does not
 * return it (checked 2026-09-24). Every journal row carries base_currency_id, so one
 * journal row is the reliable source.
 */
function fakeClient(profile: unknown, journal: unknown[] = []) {
  const client = new BexioClient({ apiToken: "test" } as never);
  let requests = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (client as any).makeRequest = async (method: string, endpoint: string) => {
    expect(method).toBe("GET");
    expect(endpoint).toBe("/company_profile");
    requests++;
    return profile;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (client as any).makeVersionedRequest = async (_v: string, method: string, endpoint: string, params?: Record<string, unknown>) => {
    expect(method).toBe("GET");
    expect(endpoint).toBe("accounting/journal");
    expect(params?.["limit"]).toBe(1);
    requests++;
    return journal;
  };
  return { client, requests: () => requests };
}

describe("getBaseCurrencyId", () => {
  it("reads base_currency_id from the company profile", async () => {
    const { client } = fakeClient([{ id: 1, name: "Muster GmbH", base_currency_id: 3 }]);
    expect(await client.getBaseCurrencyId()).toBe(3);
  });

  it("falls back to the nested base_currency.id", async () => {
    const { client } = fakeClient([{ id: 1, base_currency: { id: 5, name: "EUR" } }]);
    expect(await client.getBaseCurrencyId()).toBe(5);
  });

  it("reads base_currency_id from a journal row when the profile has none (the live API)", async () => {
    const { client } = fakeClient([{ id: 1, name: "Muster GmbH" }], [{ id: 9, currency_id: 2, base_currency_id: 2 }]);
    expect(await client.getBaseCurrencyId()).toBe(2);
  });

  it("falls back to 1 when neither the profile nor the journal has one (empty mandate)", async () => {
    const { client } = fakeClient([{ id: 1, name: "Muster AG" }], []);
    expect(await client.getBaseCurrencyId()).toBe(1);
  });

  it("asks bexio only once per client", async () => {
    const { client, requests } = fakeClient([{ base_currency_id: 3 }]);
    await client.getBaseCurrencyId();
    await client.getBaseCurrencyId();
    expect(requests()).toBe(1);
  });
});
