import { describe, it, expect, afterEach, vi } from "vitest";
import axios from "axios";
import { BexioClient } from "./bexio-client.js";
import { handlers as purchase } from "./tools/purchase/handlers.js";
import { handlers as banking } from "./tools/banking/handlers.js";

/**
 * v4.0 endpoints the server did not cover: booking/reopening and duplicating expenses,
 * duplicating bills, document number checks, and bexio's current payment API
 * (/4.0/banking/payments, which replaces the deprecated 3.0 iban/qr payments).
 */
type Call = { method: string; endpoint: string; params?: unknown; data?: unknown };

function recordingClient(response: unknown = {}) {
  const client = new BexioClient({ apiToken: "test" } as never);
  const calls: Call[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (client as any).makeVersionedRequest = async (version: string, method: string, endpoint: string, params?: unknown, data?: unknown) => {
    calls.push({ method, endpoint: `/${version}/${endpoint}`, params, data });
    return response;
  };
  return { client, calls };
}

const EXP = "f0cc58cb-3b71-42c7-b28b-aeed4aa0493f";
const BILL = "166dcef6-91c8-487f-b135-64dbf9d395a7";
const PAY = "8d0f5a3e-6f1b-4c3c-9a59-2a4d3c1b7e10";

const CASES: Array<[string, (c: BexioClient) => Promise<unknown>, Partial<Call>]> = [
  ["book_expense", (c) => purchase.book_expense(c, { expense_id: EXP }), { method: "PUT", endpoint: `/4.0/expenses/${EXP}/bookings/DONE` }],
  ["revert_expense_to_draft", (c) => purchase.revert_expense_to_draft(c, { expense_id: EXP }), { method: "PUT", endpoint: `/4.0/expenses/${EXP}/bookings/DRAFT` }],
  ["duplicate_expense", (c) => purchase.duplicate_expense(c, { expense_id: EXP }), { method: "POST", endpoint: `/4.0/expenses/${EXP}/actions`, data: { action: "DUPLICATE" } }],
  ["check_expense_document_number", (c) => purchase.check_expense_document_number(c, { document_no: "AG-7" }), { method: "GET", endpoint: "/4.0/expenses/documentnumbers", params: { document_no: "AG-7" } }],
  ["duplicate_bill", (c) => purchase.duplicate_bill(c, { bill_id: BILL }), { method: "POST", endpoint: `/4.0/purchase/bills/${BILL}/actions`, data: { action: "DUPLICATE" } }],
  ["check_bill_document_number", (c) => purchase.check_bill_document_number(c, { document_no: "LR-7" }), { method: "GET", endpoint: "/4.0/purchase/documentnumbers/bills", params: { document_no: "LR-7" } }],
  ["get_banking_payment", (c) => banking.get_banking_payment(c, { payment_id: PAY }), { method: "GET", endpoint: `/4.0/banking/payments/${PAY}` }],
  ["create_banking_payment", (c) => banking.create_banking_payment(c, { payment_data: { type: "iban", amount: 10 } }), { method: "POST", endpoint: "/4.0/banking/payments", data: { type: "iban", amount: 10 } }],
  ["update_banking_payment", (c) => banking.update_banking_payment(c, { payment_id: PAY, payment_data: { amount: 12 } }), { method: "PUT", endpoint: `/4.0/banking/payments/${PAY}`, data: { amount: 12 } }],
  ["cancel_banking_payment", (c) => banking.cancel_banking_payment(c, { payment_id: PAY }), { method: "POST", endpoint: `/4.0/banking/payments/${PAY}/cancel` }],
  ["delete_banking_payment", (c) => banking.delete_banking_payment(c, { payment_id: PAY }), { method: "DELETE", endpoint: `/4.0/banking/payments/${PAY}` }],
];

describe("v4.0 expense, bill and payment endpoints", () => {
  it.each(CASES)("%s", async (_name, call, expected) => {
    const { client, calls } = recordingClient();
    await call(client);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject(expected);
  });

  it("list_banking_payments maps the parameters to bexio's dashed names", async () => {
    const { client, calls } = recordingClient({ results: [] });
    await banking.list_banking_payments(client, { filter_by: "execution_date:2025-01-01_2025-12-31", page: 0, per_page: 20 });
    expect(calls[0]).toMatchObject({
      method: "GET",
      endpoint: "/4.0/banking/payments",
      params: { "filter-by": "execution_date:2025-01-01_2025-12-31", page: 0, "per-page": 20 },
    });
  });

  it("payment ids are UUIDs", async () => {
    const { client } = recordingClient();
    await expect(banking.get_banking_payment(client, { payment_id: 5 })).rejects.toThrow();
  });
});

describe("get_employee_payslip_pdf uses the download endpoint", () => {
  afterEach(() => vi.restoreAllMocks());

  it("requests paystub-pdf-download with Accept: application/json (bexio answers 415 to application/pdf)", async () => {
    const get = vi.spyOn(axios, "get").mockResolvedValue({ data: Buffer.from("%PDF-1.4") });
    const client = new BexioClient({ apiToken: "test" } as never);
    const result = (await client.getEmployeePayslipPdf("emp-uuid", 2025, 12)) as Record<string, unknown>;
    expect(get).toHaveBeenCalledWith(
      "https://api.bexio.com/4.0/payroll/employees/emp-uuid/paystub-pdf-download/2025/12",
      expect.objectContaining({ headers: expect.objectContaining({ Accept: "application/json" }) })
    );
    expect(result).toMatchObject({ content: Buffer.from("%PDF-1.4").toString("base64"), content_type: "application/pdf" });
  });
});
