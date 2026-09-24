import { describe, it, expect } from "vitest";
import { BexioClient } from "./bexio-client.js";

/**
 * Manual entries need a currency_id. The default must be the tenant's own base
 * currency (company_profile.base_currency_id), not a hard-coded 1: in a mandate whose
 * base currency is EUR, id 1 can be CHF, which would book the amount in the wrong
 * currency without any error.
 */
function fakeClient(profile: unknown) {
  const client = new BexioClient({ apiToken: "test" } as never);
  let requests = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (client as any).makeRequest = async (method: string, endpoint: string) => {
    expect(method).toBe("GET");
    expect(endpoint).toBe("/company_profile");
    requests++;
    return profile;
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

  it("falls back to 1 when the profile carries no base currency", async () => {
    const { client } = fakeClient([{ id: 1, name: "Muster AG" }]);
    expect(await client.getBaseCurrencyId()).toBe(1);
  });

  it("asks bexio only once per client", async () => {
    const { client, requests } = fakeClient([{ base_currency_id: 3 }]);
    await client.getBaseCurrencyId();
    await client.getBaseCurrencyId();
    expect(requests()).toBe(1);
  });
});
