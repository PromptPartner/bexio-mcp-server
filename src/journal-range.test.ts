import { describe, it, expect } from "vitest";
import { BexioClient } from "./bexio-client.js";

/**
 * The journal's date filter parameters are named `from` and `to` (YYYY-MM-DD).
 * Bexio ignores unknown query parameters silently, so getting the names wrong does not
 * fail loudly - it returns the whole journal from the first entry, which paging caps
 * then truncate into a wrong answer. These tests pin the parameter names, and the
 * local re-check that keeps a period correct even if the server filter stops working.
 */

type Row = {
  id: number;
  date: string;
  debit_account_id: number;
  credit_account_id: number;
  amount: number;
};

const JOURNAL: Row[] = [
  { id: 1, date: "2018-01-03T00:00:00+01:00", debit_account_id: 77, credit_account_id: 92, amount: 1000 },
  { id: 2, date: "2018-06-30T00:00:00+02:00", debit_account_id: 77, credit_account_id: 92, amount: 500 },
  { id: 3, date: "2026-01-23T00:00:00+01:00", debit_account_id: 464, credit_account_id: 90, amount: 17312 },
  { id: 4, date: "2026-01-23T00:00:00+01:00", debit_account_id: 90, credit_account_id: 364, amount: 9402.15 },
  { id: 5, date: "2025-12-31T00:00:00+01:00", debit_account_id: 77, credit_account_id: 92, amount: 42 },
  // booked last, dated earlier: an early exit on date would lose it
  { id: 6, date: "2026-02-02T00:00:00+01:00", debit_account_id: 464, credit_account_id: 90, amount: 87.65 },
];

const ACCOUNTS = new Map([
  [464, { account_no: "5021", name: "Löhne Bereich Administration", account_group_id: 1, uuid: "uuid-5021" }],
  [90, { account_no: "1091", name: "Lohndurchlaufkonto", account_group_id: 1, uuid: "uuid-1091" }],
  [364, { account_no: "2271", name: "KK AHV, IV, EO, ALV", account_group_id: 1, uuid: "uuid-2271" }],
]);

/**
 * @param honourFilter when false the fake server ignores `from`/`to`, reproducing what
 *        happens if the parameter names are wrong or a proxy drops the query string.
 */
function fakeClient(rows: Row[], { honourFilter = true, pageSize = 2 } = {}) {
  const client = new BexioClient({ apiToken: "test" } as never);
  const queries: Array<Record<string, unknown>> = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (client as any).makeVersionedRequest = async (
    _version: string,
    _method: string,
    endpoint: string,
    params?: Record<string, unknown>
  ) => {
    expect(endpoint).toBe("accounting/journal");
    const q = params ?? {};
    queries.push(q);
    const from = q["from"] as string | undefined;
    const to = q["to"] as string | undefined;
    const uuid = q["account_uuid"] as string | undefined;
    let visible = rows;
    if (honourFilter) {
      if (from) visible = visible.filter((r) => r.date.slice(0, 10) >= from);
      if (to) visible = visible.filter((r) => r.date.slice(0, 10) <= to);
      if (uuid) {
        const id = [...ACCOUNTS.entries()].find(([, m]) => m.uuid === uuid)?.[0];
        visible = visible.filter((r) => r.debit_account_id === id || r.credit_account_id === id);
      }
    }
    const offset = (q["offset"] as number) ?? 0;
    const limit = (q["limit"] as number) ?? pageSize;
    return visible.slice(offset, offset + limit);
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (client as any).fetchAllAccounts = async () => ACCOUNTS;
  return { client, queries };
}

describe("journal date range", () => {
  it("sends the range as bexio's `from`/`to`, not start_date/end_date", async () => {
    const { client, queries } = fakeClient(JOURNAL);
    await client.getJournal({ start_date: "2026-01-01", end_date: "2026-12-31" });
    expect(queries[0]).toMatchObject({ from: "2026-01-01", to: "2026-12-31" });
    expect(queries[0]).not.toHaveProperty("start_date");
    expect(queries[0]).not.toHaveProperty("end_date");
  });

  it("returns only the requested period and marks the server filter as working", async () => {
    const { client } = fakeClient(JOURNAL);
    const res = (await client.getJournal({
      start_date: "2026-01-01",
      end_date: "2026-12-31",
    })) as { total_matched: number; entries: Row[]; server_side_filter: boolean };
    expect(res.entries.map((r) => r.id)).toEqual([3, 4, 6]);
    expect(res.total_matched).toBe(3);
    expect(res.server_side_filter).toBe(true);
  });

  it("still enforces the range - and says so - if the server ignores the filter", async () => {
    const { client } = fakeClient(JOURNAL, { honourFilter: false });
    const res = (await client.getJournal({
      start_date: "2026-01-01",
      end_date: "2026-12-31",
    })) as { entries: Row[]; server_side_filter: boolean; scanned_rows: number };
    expect(res.entries.map((r) => r.id)).toEqual([3, 4, 6]);
    expect(res.server_side_filter).toBe(false);
    expect(res.scanned_rows).toBe(JOURNAL.length);
  });

  it("keeps backdated rows that were booked after later-dated ones", async () => {
    const { client } = fakeClient(JOURNAL);
    const res = (await client.getJournal({ start_date: "2026-02-01", end_date: "2026-02-28" })) as {
      entries: Row[];
    };
    expect(res.entries.map((r) => r.id)).toEqual([6]);
  });

  it("passes account_uuid through to narrow the journal", async () => {
    const { client, queries } = fakeClient(JOURNAL);
    const res = (await client.getJournal({
      start_date: "2026-01-01",
      end_date: "2026-12-31",
      account_uuid: "uuid-2271",
    })) as { entries: Row[] };
    expect(queries[0]).toMatchObject({ account_uuid: "uuid-2271" });
    expect(res.entries.map((r) => r.id)).toEqual([4]);
  });

  it("applies limit/offset to the filtered result, not to the raw journal", async () => {
    const { client } = fakeClient(JOURNAL);
    const res = (await client.getJournal({
      start_date: "2026-01-01",
      end_date: "2026-12-31",
      limit: 2,
      offset: 1,
    })) as { total_matched: number; entries: Row[] };
    expect(res.total_matched).toBe(3);
    expect(res.entries.map((r) => r.id)).toEqual([4, 6]);
  });

  it("sends only the bound the caller gave, never a placeholder date", async () => {
    const { client, queries } = fakeClient(JOURNAL);
    const res = (await client.getJournal({ end_date: "2018-12-31" })) as {
      entries: Row[];
      start_date: string | null;
      end_date: string | null;
    };
    expect(queries[0]).toMatchObject({ to: "2018-12-31" });
    expect(queries[0]).not.toHaveProperty("from");
    expect(res.entries.map((r) => r.id)).toEqual([1, 2]);
    expect(res.start_date).toBeNull();
    expect(res.end_date).toBe("2018-12-31");

    const { client: c2, queries: q2 } = fakeClient(JOURNAL);
    const res2 = (await c2.getJournal({ start_date: "2026-02-01" })) as { entries: Row[] };
    expect(q2[0]).toMatchObject({ from: "2026-02-01" });
    expect(q2[0]).not.toHaveProperty("to");
    expect(res2.entries.map((r) => r.id)).toEqual([6]);
  });

  it("passes the raw journal through when no range is given", async () => {
    const { client } = fakeClient(JOURNAL);
    const res = (await client.getJournal({ limit: 2, offset: 0 })) as Row[];
    expect(Array.isArray(res)).toBe(true);
    expect(res.map((r) => r.id)).toEqual([1, 2]);
  });
});

describe("account balances", () => {
  it("aggregates only the rows inside the range and reports scan statistics", async () => {
    const { client } = fakeClient(JOURNAL);
    const res = (await client.getAccountBalances({
      start_date: "2026-01-01",
      end_date: "2026-12-31",
    })) as {
      accounts: Array<{ account_no: string; debit_total: number; balance: number }>;
      matched_rows: number;
      truncated: boolean;
      server_side_filter: boolean;
    };

    expect(res.matched_rows).toBe(3);
    expect(res.truncated).toBe(false);
    expect(res.server_side_filter).toBe(true);

    const byNo = Object.fromEntries(res.accounts.map((a) => [a.account_no, a]));
    expect(byNo["5021"].debit_total).toBe(17399.65);
    expect(byNo["1091"].balance).toBe(-7997.5);
    const net = res.accounts.reduce((sum, a) => sum + a.balance, 0);
    expect(Math.round(net * 100) / 100).toBe(0);
  });

  it("narrows the journal query by uuid when a single account is requested", async () => {
    const { client, queries } = fakeClient(JOURNAL);
    const res = (await client.getAccountBalances({
      start_date: "2026-01-01",
      end_date: "2026-12-31",
      account_id: 464,
    })) as { accounts: Array<{ account_no: string; balance: number }> };
    expect(queries[0]).toMatchObject({ account_uuid: "uuid-5021" });
    expect(res.accounts).toHaveLength(1);
    expect(res.accounts[0].balance).toBe(17399.65);
  });

  it("does not report a recently-used account as having no balance", async () => {
    // The regression this replaces: the range never reached 2026, so 5021 was absent
    // from the result entirely and read as "no movement" instead of "17'399.65".
    const { client } = fakeClient(JOURNAL);
    const res = (await client.getAccountBalances({
      start_date: "2026-01-01",
      end_date: "2026-12-31",
      account_id: 464,
    })) as { account_count: number };
    expect(res.account_count).toBe(1);
  });
});
