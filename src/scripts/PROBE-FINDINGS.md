# Phase-0 live-probe findings (v2.4.1 issue fixes)

Probed against the live Bexio **test** account on 2026-06-30 via `scripts/probe-v4.mjs`
(raw axios, token from `.env`, create→probe→delete throwaway records). Every record
created was deleted; account verified clean afterwards (`scripts/probe-cleanup.mjs`).

Reference IDs on the test account: supplier `contact id=1` (bexio AG), person
`contact id=3` (for `contact_partner_id`), purchase tax `id=8` (pre_tax_material 0%),
expense account `id=160` (4000), bank account `id=1` (UBS-CHF).

## #9 — create_bill (POST /4.0/purchase/bills) — CONFIRMED schema

Required top-level (from empty-body 400): `currency_code, address, item_net,
supplier_id, due_date, contact_partner_id, bill_date, manual_amount, line_items`.
Also `amount_calc` is required when `manual_amount === false`.

Working body (got 201):
```json
{
  "currency_code": "CHF",
  "address": { "lastname_company": "bexio AG", "type": "COMPANY",
               "address_line": "…", "postcode": "…", "city": "…", "country_code": "CH" },
  "item_net": true,
  "supplier_id": 1,
  "due_date": "2026-07-30",
  "contact_partner_id": 3,
  "bill_date": "2026-06-30",
  "manual_amount": false,
  "amount_calc": 100,
  "title": "…",
  "line_items": [ { "amount": 100, "position": 0, "title": "…", "tax_id": 8, "booking_account_id": 160 } ]
}
```
- `address` is an OBJECT (BillAddress), not a string. `type` ∈ {COMPANY, PRIVATE}.
- line_items use `booking_account_id` + `title` (NOT `account_id`/`description` — both
  rejected as "Unrecognized property").
- `manual_amount` is a BOOL. When true, send `amount_man` (the manual total); when false,
  send `amount_calc`.
- The current tool docs claiming `contact_id`/`positions` are flat wrong (`contact_id`
  is rejected as "Unrecognized property").

Created-bill response keys (the full GET shape):
`supplier_id, vendor_ref, title, currency_code, exchange_rate,
average_exchange_rate_enabled, base_currency_amount, contact_partner_id, bill_date,
due_date, item_net, amount_man, amount_calc, manual_amount, address, line_items,
discounts, payment, attachment_ids, document_no, split_into_line_items, id, status,
firstname_suffix, lastname_company, created_at, base_currency_code, pending_amount,
purchase_order_id, overdue, qr_bill_information`.

## #7 — update_bill (PUT /4.0/purchase/bills/{id}) — CONFIRMED fix

- PUTting the full GET body back → **400 "Unrecognized property: id"** (then
  `firstname_suffix`, …). The GET returns computed/denormalized fields the PUT rejects.
  So the fix is an **allowlist of writable fields**, not a blocklist.
- **CRITICAL:** `document_no` IS writable and **must be included** in the update body.
  An allowlist PUT that omitted `document_no` set it to **null**, which then **broke
  booking** (a bill with no number can't be booked). Including the GET's `document_no`
  preserves it. This is the core of issue #7.
- A correct read-modify-write (GET → merge patch → PUT allowlisted body incl.
  `document_no`) returned 200, changed only `title`, and **preserved `document_no`**.

Writable top-level allowlist (BILL_WRITABLE), proven accepted by PUT:
```
supplier_id, contact_partner_id, address, bill_date, due_date, line_items, title,
manual_amount, amount_man, amount_calc, currency_code, exchange_rate,
base_currency_amount, item_net, purchase_order_id, qr_bill_information, attachment_ids,
discounts, vendor_ref, average_exchange_rate_enabled, split_into_line_items, document_no
```
`split_into_line_items` is required on update ("must not be null" if omitted).
address sub-allowlist: `lastname_company, type, title, salutation, firstname_suffix,
address_line, postcode, city, country_code, main_contact_id, contact_address_id`.
line_items sub-allowlist: `amount, position, title, tax_id, booking_account_id`.
Arrays (line_items) are replaced wholesale by PUT.

## #6 — finalize / mark-as-paid — CONFIRMED

- Current code `POST /4.0/purchase/bills/{id}/issue` and `…/mark_as_paid` → **404**
  (the sub-paths don't exist). This is the bug.
- Finalize = **`PUT /4.0/purchase/bills/{id}/bookings/{status}`** (no body), status from
  the BillStatus enum. `…/bookings/BOOKED` flips DRAFT→BOOKED (200). `…/bookings/DRAFT`
  reverts (used in cleanup).
- BillStatus enum: `DRAFT, BOOKED, PARTIALLY_CREATED, CREATED, PARTIALLY_SENT, SENT,
  PARTIALLY_DOWNLOADED, DOWNLOADED, PARTIALLY_PAID, PAID, PARTIALLY_FAILED, FAILED`.
- mark-as-paid: there is **no** dedicated endpoint. Creating a (MANUAL) outgoing payment
  with `bill_id` flips the bill to **PAID** (probe observed status=PAID right after the
  payment POST). So `mark_bill_as_paid` should either create such a payment or be
  deprecated pointing at `create_outgoing_payment`.

## #8 — update_outgoing_payment — CONFIRMED fixable (not a dead end)

- Current code `PUT /4.0/purchase/outgoing-payments/{id}` → **405** (also PATCH → 405).
  Wrong URL shape = the bug.
- Correct update = **`PUT /4.0/purchase/outgoing-payments`** (collection path, NO `/{id}`)
  with `payment_id` in the **body**. The probe's call reached validation (400
  "is_salary_payment must not be null"), proving the endpoint exists and accepts PUT.
- Update body (from gigerIT `toUpdateApi`): `payment_id, execution_date, amount,
  fee_type, is_salary_payment, reference_no, message, receiver_iban, receiver_name,
  receiver_street, receiver_house_no, receiver_city, receiver_postcode,
  receiver_country_code`. `is_salary_payment` is required.

## #9 — create_outgoing_payment (POST /4.0/purchase/outgoing-payments) — CONFIRMED

Required (empty-body 400): `execution_date, bill_id, is_salary_payment, payment_type,
amount, currency_code, exchange_rate`. For `payment_type=MANUAL`,
`sender_bank_account_id` is also mandatory ("sender_bank_account_id is mandatory for
[MANUAL] payment type").

Working MANUAL body (got 201, bill→PAID):
```json
{ "bill_id": "<uuid>", "payment_type": "MANUAL", "execution_date": "2026-06-30",
  "amount": 100, "currency_code": "CHF", "exchange_rate": 1,
  "is_salary_payment": false, "sender_bank_account_id": 1 }
```
- `payment_type` enum (BillPaymentType): `IBAN, QR, MANUAL`.
- QR vs IBAN field split: `reference_no` (QR reference) vs `message` (IBAN remittance);
  `fee_type` (e.g. NO_FEE); sender/receiver address fields are `sender_house_no`,
  `sender_postcode`, `receiver_house_no`, etc. (full list in the OutgoingPayment DTO).
- Payment response keys: `bill_id, payment_type, execution_date, amount, currency_code,
  exchange_rate, note, sender_bank_account_id, sender_iban … receiver_* …, fee_type,
  is_salary_payment, reference_no, message, booking_text, id, status,
  banking_payment_id, banking_payment_entry_id, created_at, transaction_id,
  sender_bank_booking_account_id`.

## Cleanup note

A PAID bill cannot be deleted; deleting its payment(s) reverts it to BOOKED, then
`…/bookings/DRAFT` + DELETE removes it. The bills LIST endpoint did not return the
stuck bill — a direct GET by id was needed. `scripts/probe-cleanup.mjs` handles this.

Schema cross-checked against the `gigerIT/bexio-api-client` PHP client (Saloon
request classes encode the exact method + path; DTOs encode field names).
