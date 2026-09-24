import { describe, it, expect } from "vitest";
import { handlers } from "./handlers.js";

/**
 * bexio answers a bare "422 validation failed" when a posting line carries no date or
 * currency, which is impossible to diagnose from the response alone. These tests pin
 * the inheritance that keeps callers from hitting it.
 */
// A non-1 base currency, so a hard-coded default of 1 cannot pass by accident
// (an EUR mandate's base currency is not necessarily id 1).
const BASE_CURRENCY_ID = 7;

function captureClient() {
  const calls: Array<{ method: string; payload: unknown }> = [];
  const client = {
    baseCurrencyLookups: 0,
    getBaseCurrencyId: async () => {
      client.baseCurrencyLookups++;
      return BASE_CURRENCY_ID;
    },
    createManualGroupEntry: async (payload: unknown) => {
      calls.push({ method: "createManualGroupEntry", payload });
      return { id: 1 };
    },
    createManualEntry: async (payload: unknown) => {
      calls.push({ method: "createManualEntry", payload });
      return { id: 2 };
    },
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { client: client as any, calls };
}

describe("create_manual_group_entry", () => {
  it("sends type manual_group_entry and inherits date and the base currency onto every line", async () => {
    const { client, calls } = captureClient();
    await handlers.create_manual_group_entry(client, {
      date: "2026-01-23",
      reference_nr: "LL-202601-M",
      entries: [
        { debit_account_id: 464, credit_account_id: 90, amount: 17312, description: "Löhne Bereich Administration / 01.26" },
        { debit_account_id: 90, credit_account_id: 364, amount: 9402.15, description: "Lohndurchlaufkonto / 01.26" },
      ],
    });

    const payload = calls[0].payload as {
      date: string;
      reference_nr: string;
      entries: Array<{ date: string; currency_id: number; currency_factor: number }>;
    };
    expect(calls[0].method).toBe("createManualGroupEntry");
    expect(payload.reference_nr).toBe("LL-202601-M");
    expect(payload.entries).toHaveLength(2);
    for (const line of payload.entries) {
      expect(line.date).toBe("2026-01-23");
      expect(line.currency_id).toBe(BASE_CURRENCY_ID);
      expect(line.currency_factor).toBe(1);
    }
  });

  it("lets a line override the document date and currency", async () => {
    const { client, calls } = captureClient();
    await handlers.create_manual_group_entry(client, {
      date: "2026-01-23",
      currency_id: 1,
      entries: [
        { debit_account_id: 464, credit_account_id: 90, amount: 10, description: "a" },
        { debit_account_id: 464, credit_account_id: 90, amount: 20, description: "b", date: "2026-01-31", currency_id: 2, currency_factor: 0.93 },
      ],
    });
    const payload = calls[0].payload as { entries: Array<{ date: string; currency_id: number; currency_factor: number }> };
    expect(payload.entries[0]).toMatchObject({ date: "2026-01-23", currency_id: 1, currency_factor: 1 });
    expect(payload.entries[1]).toMatchObject({ date: "2026-01-31", currency_id: 2, currency_factor: 0.93 });
    // an explicit document currency means no company-profile lookup
    expect(client.baseCurrencyLookups).toBe(0);
  });

  it("rejects an empty entries array instead of posting an empty voucher", async () => {
    const { client } = captureClient();
    await expect(
      handlers.create_manual_group_entry(client, { date: "2026-01-23", entries: [] })
    ).rejects.toThrow();
  });
});

describe("create_manual_entry", () => {
  it("defaults currency_id to the company's base currency so bexio does not answer 422", async () => {
    const { client, calls } = captureClient();
    await handlers.create_manual_entry(client, {
      date: "2026-01-23",
      debit_account_id: 464,
      credit_account_id: 90,
      amount: 17312,
      description: "Löhne Bereich Administration / 01.26",
    });
    const payload = calls[0].payload as { entries: Array<{ currency_id: number; currency_factor: number }> };
    expect(payload.entries[0].currency_id).toBe(BASE_CURRENCY_ID);
    expect(payload.entries[0].currency_factor).toBe(1);
  });

  it("keeps an explicit currency_id without looking up the base currency", async () => {
    const { client, calls } = captureClient();
    await handlers.create_manual_entry(client, {
      date: "2026-01-23",
      debit_account_id: 464,
      credit_account_id: 90,
      amount: 10,
      description: "x",
      currency_id: 2,
    });
    const payload = calls[0].payload as { entries: Array<{ currency_id: number }> };
    expect(payload.entries[0].currency_id).toBe(2);
    expect(client.baseCurrencyLookups).toBe(0);
  });
});
