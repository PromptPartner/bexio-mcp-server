/**
 * Purchase tool definitions.
 * Contains MCP tool metadata for bills, expenses, purchase orders, and outgoing payments.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const toolDefinitions: Tool[] = [
  // ===== BILLS (Creditor Invoices — v4.0 API) =====
  {
    name: "list_bills",
    description: "List all bills (creditor invoices) with optional pagination",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          description: "Maximum number of bills to return (default: 50)",
        },
        offset: {
          type: "integer",
          description: "Number of bills to skip (default: 0)",
        },
      },
    },
  },
  {
    name: "get_bill",
    description: "Get a specific bill (creditor invoice) by UUID",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        bill_id: {
          type: "string",
          description: "The UUID of the bill to retrieve",
        },
      },
      required: ["bill_id"],
    },
  },
  {
    name: "create_bill",
    description:
      "Create a new bill (creditor invoice) from a supplier (Bexio v4.0). IMPORTANT field names: use supplier_id (NOT contact_id), line_items (NOT positions), and booking_account_id on each line (NOT account_id); 'address' is a structured object. The API also requires contact_partner_id, bill_date, due_date, currency_code, item_net and manual_amount (+ amount_calc when manual_amount is false). New bills are created as DRAFT — use issue_bill to book them, then create_outgoing_payment to mark them paid.",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        bill_data: {
          type: "object",
          description: "Bill payload. Unlisted fields are passed through to Bexio unchanged.",
          properties: {
            supplier_id: { type: "integer", description: "Contact ID of the supplier/creditor (use list_contacts). Required." },
            contact_partner_id: { type: "integer", description: "Contact ID of the responsible person at the supplier. Required by the API." },
            bill_date: { type: "string", description: "Bill date, format YYYY-MM-DD. Required by the API." },
            due_date: { type: "string", description: "Payment due date, format YYYY-MM-DD. Required by the API." },
            currency_code: { type: "string", description: "ISO currency code, e.g. 'CHF'. Required by the API." },
            title: { type: "string", description: "Free-text title/reference shown on the bill." },
            item_net: { type: "boolean", description: "true if line amounts are net (excl. VAT), false if gross. Required by the API." },
            manual_amount: { type: "boolean", description: "false = total is calculated from line_items (then also send amount_calc); true = total set manually via amount_man. Required by the API." },
            amount_calc: { type: "number", description: "Calculated gross total. Required when manual_amount is false." },
            amount_man: { type: "number", description: "Manually-entered total. Used when manual_amount is true." },
            address: {
              type: "object",
              description: "Supplier address block (structured object, NOT a string).",
              properties: {
                lastname_company: { type: "string", description: "Company name or last name. Required within address." },
                type: { type: "string", enum: ["COMPANY", "PRIVATE"], description: "'COMPANY' or 'PRIVATE'." },
                address_line: { type: "string", description: "Street and house number." },
                postcode: { type: "string", description: "Postal/ZIP code." },
                city: { type: "string", description: "City." },
                country_code: { type: "string", description: "ISO country code, e.g. 'CH'." },
              },
            },
            line_items: {
              type: "array",
              description: "Bill line items (at least one). Required.",
              items: {
                type: "object",
                properties: {
                  amount: { type: "number", description: "Line amount. Required." },
                  position: { type: "integer", description: "0-based ordering position." },
                  title: { type: "string", description: "Line description (the field is 'title', NOT 'description')." },
                  tax_id: { type: "integer", description: "Tax ID from list_taxes (a pre_tax/Vorsteuer tax for purchases)." },
                  booking_account_id: { type: "integer", description: "Expense account ID from list_accounts (the field is 'booking_account_id', NOT 'account_id')." },
                },
                required: ["amount"],
              },
            },
          },
          required: ["supplier_id", "line_items"],
        },
      },
      required: ["bill_data"],
    },
  },
  {
    name: "update_bill",
    description:
      "Update an existing bill (creditor invoice). This is a SAFE PARTIAL update: the server fetches the current bill, merges your changes, and preserves untouched fields (including document_no), so you only need to send the fields you want to change. EXCEPTION: line_items is replaced wholesale — to change one line you must send the FULL line_items array, or omit line_items to leave them unchanged.",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        bill_id: {
          type: "string",
          description: "The UUID of the bill to update",
        },
        bill_data: {
          type: "object",
          description: "Only the bill fields you want to change (e.g. { title }). Omitted fields are preserved. Send the full line_items array if you change any line.",
        },
      },
      required: ["bill_id", "bill_data"],
    },
  },
  {
    name: "delete_bill",
    description: "Delete a bill (creditor invoice)",
    annotations: { destructiveHint: true },
    inputSchema: {
      type: "object",
      properties: {
        bill_id: {
          type: "string",
          description: "The UUID of the bill to delete",
        },
      },
      required: ["bill_id"],
    },
  },
  {
    name: "search_bills",
    description: "Search/filter bills (creditor invoices) by criteria. Uses GET with query params (Bexio v4.0 does not support POST /search for bills).",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        criteria: {
          type: "array",
          description: "Array of search criteria objects with field, value, and optional operator",
        },
        limit: {
          type: "integer",
          description: "Maximum number of results",
        },
        offset: {
          type: "integer",
          description: "Number of results to skip",
        },
      },
      required: ["criteria"],
    },
  },
  {
    name: "issue_bill",
    description:
      "Finalize (book) a DRAFT bill (creditor invoice): transitions it from DRAFT to BOOKED so it posts to the ledger and can be paid. Bexio v4.0 books bills via PUT /purchase/bills/{id}/bookings/BOOKED (there is no POST /issue endpoint).",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        bill_id: {
          type: "string",
          description: "The UUID of the bill to book (DRAFT -> BOOKED)",
        },
      },
      required: ["bill_id"],
    },
  },
  {
    name: "mark_bill_as_paid",
    description:
      "Mark a bill as paid. NOTE: Bexio v4.0 has no mark-as-paid endpoint — a bill is marked paid by recording a payment against it. Use create_outgoing_payment with payment_data.bill_id set to this bill's UUID (that flips the bill to PAID). Calling this tool returns that guidance rather than performing a no-op request.",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        bill_id: {
          type: "string",
          description: "The UUID of the bill to mark as paid (pay it via create_outgoing_payment with this bill_id)",
        },
      },
      required: ["bill_id"],
    },
  },

  // ===== EXPENSES (v4.0 API) =====
  {
    name: "list_expenses",
    description: "List all expenses with optional pagination",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          description: "Maximum number of expenses to return (default: 50)",
        },
        offset: {
          type: "integer",
          description: "Number of expenses to skip (default: 0)",
        },
      },
    },
  },
  {
    name: "get_expense",
    description: "Get a specific expense by UUID",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        expense_id: {
          type: "string",
          description: "The UUID of the expense to retrieve",
        },
      },
      required: ["expense_id"],
    },
  },
  {
    name: "create_expense",
    description: "Create a new expense record",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        expense_data: {
          type: "object",
          description: "Expense data including title, amount, date, etc.",
        },
      },
      required: ["expense_data"],
    },
  },
  {
    name: "update_expense",
    description: "Update an existing expense",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        expense_id: {
          type: "string",
          description: "The UUID of the expense to update",
        },
        expense_data: {
          type: "object",
          description: "Expense data to update",
        },
      },
      required: ["expense_id", "expense_data"],
    },
  },
  {
    name: "delete_expense",
    description: "Delete an expense",
    annotations: { destructiveHint: true },
    inputSchema: {
      type: "object",
      properties: {
        expense_id: {
          type: "string",
          description: "The UUID of the expense to delete",
        },
      },
      required: ["expense_id"],
    },
  },

  // ===== PURCHASE ORDERS (v3.0 API, integer IDs) =====
  {
    name: "list_purchase_orders",
    description: "List all purchase orders with optional pagination",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          description: "Maximum number of purchase orders to return (default: 50)",
        },
        offset: {
          type: "integer",
          description: "Number of purchase orders to skip (default: 0)",
        },
      },
    },
  },
  {
    name: "get_purchase_order",
    description: "Get a specific purchase order by ID",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        purchase_order_id: {
          type: "integer",
          description: "The ID of the purchase order to retrieve",
        },
      },
      required: ["purchase_order_id"],
    },
  },
  {
    name: "create_purchase_order",
    description: "Create a new purchase order to a supplier",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        purchase_order_data: {
          type: "object",
          description: "Purchase order data including contact_id, title, positions, etc.",
        },
      },
      required: ["purchase_order_data"],
    },
  },
  {
    name: "update_purchase_order",
    description: "Update an existing purchase order",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        purchase_order_id: {
          type: "integer",
          description: "The ID of the purchase order to update",
        },
        purchase_order_data: {
          type: "object",
          description: "Purchase order data to update",
        },
      },
      required: ["purchase_order_id", "purchase_order_data"],
    },
  },
  {
    name: "delete_purchase_order",
    description: "Delete a purchase order",
    annotations: { destructiveHint: true },
    inputSchema: {
      type: "object",
      properties: {
        purchase_order_id: {
          type: "integer",
          description: "The ID of the purchase order to delete",
        },
      },
      required: ["purchase_order_id"],
    },
  },

  // ===== OUTGOING PAYMENTS (v4.0 API, requires bill_id) =====
  {
    name: "list_outgoing_payments",
    description: "List outgoing payments for a specific bill. Bexio requires a bill_id (payments are listed per bill).",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        bill_id: {
          type: "string",
          description: "UUID of the bill whose outgoing payments to list (use list_bills to find)",
        },
        limit: {
          type: "integer",
          description: "Maximum number of payments to return (default: 50)",
        },
        offset: {
          type: "integer",
          description: "Number of payments to skip (default: 0)",
        },
      },
      required: ["bill_id"],
    },
  },
  {
    name: "get_outgoing_payment",
    description: "Get a specific outgoing payment by UUID",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        payment_id: {
          type: "string",
          description: "The UUID of the payment to retrieve",
        },
      },
      required: ["payment_id"],
    },
  },
  {
    name: "create_outgoing_payment",
    description:
      "Create an outgoing payment for a supplier bill (Bexio v4.0). This is how you PAY/settle a bill: creating a payment linked via bill_id marks that bill PAID. Required fields: bill_id, payment_type (IBAN | QR | MANUAL), amount, currency_code, exchange_rate (1 for same currency), execution_date and is_salary_payment. For payment_type MANUAL, sender_bank_account_id is also required. QR payments carry reference_no (the QR reference); IBAN payments carry message (the remittance text). fee_type (e.g. 'NO_FEE' for domestic) and receiver_* address fields apply to real bank transfers.",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        payment_data: {
          type: "object",
          description: "Outgoing payment payload. Unlisted fields are passed through to Bexio unchanged.",
          properties: {
            bill_id: { type: "string", description: "UUID of the bill being paid. Required." },
            payment_type: { type: "string", enum: ["IBAN", "QR", "MANUAL"], description: "Payment type. Required." },
            amount: { type: "number", description: "Payment amount. Required." },
            currency_code: { type: "string", description: "ISO currency code, e.g. 'CHF'. Required by the API." },
            exchange_rate: { type: "number", description: "Exchange rate to base currency (1 when same currency). Required by the API." },
            execution_date: { type: "string", description: "Execution date YYYY-MM-DD (a valid SIC banking day for real transfers). Required by the API." },
            is_salary_payment: { type: "boolean", description: "Whether this is a salary payment. Required by the API." },
            sender_bank_account_id: { type: "integer", description: "Paying bank account ID (use list_bank_accounts). Required when payment_type is MANUAL." },
            fee_type: { type: "string", description: "Bank-fee handling, e.g. 'NO_FEE' for domestic payments." },
            reference_no: { type: "string", description: "QR reference number (use with payment_type QR)." },
            message: { type: "string", description: "Remittance message/text (use with payment_type IBAN)." },
            receiver_iban: { type: "string", description: "Recipient IBAN (for real IBAN transfers)." },
            receiver_name: { type: "string", description: "Recipient name." },
            receiver_street: { type: "string", description: "Recipient street." },
            receiver_house_no: { type: "string", description: "Recipient house number (field is 'house_no')." },
            receiver_city: { type: "string", description: "Recipient city." },
            receiver_postcode: { type: "string", description: "Recipient postal code." },
            receiver_country_code: { type: "string", description: "Recipient ISO country code." },
          },
          required: ["bill_id", "payment_type", "amount"],
        },
      },
      required: ["payment_data"],
    },
  },
  {
    name: "update_outgoing_payment",
    description:
      "Update an existing outgoing payment (Bexio v4.0). The update is a PUT to the collection with the id in the body (there is no per-id update URL). The API requires execution_date, amount and is_salary_payment, and also accepts fee_type, reference_no (QR) / message (IBAN) and receiver_* fields. NOTE: currency_code and exchange_rate are NOT updatable (they are set at creation) — they are ignored if sent. Omitting a required field returns a validation error. If you only need to change the amount or date, it is often simpler to delete_outgoing_payment and create a new one.",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        payment_id: {
          type: "string",
          description: "The UUID of the payment to update (sent in the request body)",
        },
        payment_data: {
          type: "object",
          description: "Full payment fields (execution_date, amount, currency_code, exchange_rate, is_salary_payment, fee_type, and reference_no/message + receiver_* as applicable).",
        },
      },
      required: ["payment_id", "payment_data"],
    },
  },
  {
    name: "delete_outgoing_payment",
    description: "Delete an outgoing payment",
    annotations: { destructiveHint: true },
    inputSchema: {
      type: "object",
      properties: {
        payment_id: {
          type: "string",
          description: "The UUID of the payment to delete",
        },
      },
      required: ["payment_id"],
    },
  },
];
