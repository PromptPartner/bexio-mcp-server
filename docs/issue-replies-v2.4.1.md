# Draft issue replies — v2.4.1

> DRAFTS for owner approval. Do NOT post until Lukas approves. After release, post each
> reply on the matching issue and close it. All fixes were verified end-to-end against
> the live Bexio API through the real built handlers (create → update → book → pay →
> update-payment), with throwaway records cleaned up.

---

## #6 — issue_bill / mark_bill_as_paid POST to non-existent v4 endpoints (404)

Fixed in **v2.4.1**. Thanks @schafrod — you were exactly right.

- `issue_bill` now books a DRAFT bill via `PUT /4.0/purchase/bills/{id}/bookings/BOOKED` (the `/issue` sub-path doesn't exist on v4). Verified: a DRAFT bill transitions to BOOKED.
- Bexio v4 genuinely has **no** mark-as-paid endpoint — a bill is marked paid by recording a payment against it. So `mark_bill_as_paid` now returns clear guidance to call `create_outgoing_payment` with the bill's `bill_id`, which flips the bill to **PAID** (verified live), instead of firing a request that always 404s. The tool description carries the same guidance so the model self-corrects.

---

## #7 — update_bill full-PUT silently nulls omitted fields (loses document_no)

Fixed in **v2.4.1**. This was the worst of the batch — thanks for the precise diagnosis.

`update_bill` is now a **safe partial update**: it GETs the current bill, deep-merges your changes, and PUTs back only the writable fields — so omitted fields (including `document_no`) are preserved. Verified live: updating only `title` keeps `document_no` intact, and the bill still books afterward.

One caveat from the API's behavior: `line_items` is replaced wholesale by the v4 PUT, so to change one line you must send the **full** `line_items` array; omit `line_items` to leave all lines untouched. This is now documented in the tool description.

---

## #8 — update_outgoing_payment always returns 405

Fixed in **v2.4.1**. The 405 was a wrong URL shape.

The update is a `PUT` to the **collection** path `/4.0/purchase/outgoing-payments` with `payment_id` in the **body** — not `PUT /…/{id}` (which 405s, as does PATCH). The client now targets the correct endpoint and reduces the body to the fields Bexio accepts on update (so passing a full payment object back no longer fails with "Unrecognized property"). Verified live: the request now reaches Bexio's business logic instead of 405.

Note: Bexio only permits updating **IBAN/QR** payments — MANUAL payments are immutable and the API rejects updating them ("Only Payment with payment type IBAN or QR can be updated"). That's a Bexio rule, not the tool; the description now says so.

---

## #9 — create_bill / create_outgoing_payment misleading descriptions & undocumented required fields

Fixed in **v2.4.1**. The schemas were genuinely wrong; corrected against the live API.

- `create_bill`: the real fields are `supplier_id` (not `contact_id`), `line_items` (not `positions`) with `booking_account_id` (not `account_id`) and `title` (not `description`) per line, a structured `address` object, plus `contact_partner_id`, `bill_date`, `due_date`, `currency_code`, `item_net`, `manual_amount` and `amount_calc` (when `manual_amount` is false). All are now documented as typed properties.
- `create_outgoing_payment`: documents `bill_id`, `payment_type` (IBAN/QR/MANUAL), `amount`, `currency_code`, `exchange_rate`, `execution_date`, `is_salary_payment`, `sender_bank_account_id` (required for MANUAL), `fee_type`, and the QR-vs-IBAN split (`reference_no` for QR, `message` for IBAN).

Schemas stay permissive (extra fields pass through), so nothing you send today breaks — you just get accurate guidance now.

---

## #10 — download_file returns entire file as inline base64, overflowing client context

Fixed in **v2.4.1**. Thanks — this was a real context-killer (the test file we used was 1.6 MB).

Files above a threshold (default **64 KB** decoded, override with `BEXIO_DOWNLOAD_INLINE_MAX_BYTES`) are now written to disk and the tool returns `file_path` + `size_bytes` instead of inline base64. Small files still inline for backward compatibility. A new optional `output_path` lets you choose the destination. Verified live across all three paths (inline / temp-file / explicit path).

Heads-up for HTTP/n8n deployments: the returned path is on the **server** host, not the client machine — noted in the tool description.

---

## #11 — Orphaned server processes busy-loop at ~100% CPU after client disconnect (stdio)

Fixed in **v2.4.1**. Thanks @georgesleuenberger.

In stdio mode the server now shuts down and exits when the client disconnects (stdin `end`/`close`) or on SIGINT/SIGTERM, instead of spinning on EOF. Verified: after the client closes stdin, the process exits cleanly (code 0) in ~100 ms — no orphan, no busy-loop. HTTP mode is unaffected (it never used this path).

---

## #12 — create_iban_payment produces a standalone payment with no bill link

Fixed in **v2.4.1** (documentation/guidance). Thanks @schafrod.

`create_iban_payment` and `create_qr_payment` create **standalone** bank payments that are not linked to any bill and can't be attached to one afterward (Bexio returns 403). Their descriptions now warn about this and steer you to `create_outgoing_payment` with a `bill_id` when you actually mean to settle a supplier bill (that records the payment against the bill and marks it PAID — works for both IBAN and QR). The success response also carries a `_hint` to the same effect, and `update_iban_payment` notes the after-the-fact attach limitation.

---

_All of the above shipped in v2.4.1 (npm `@promptpartner/bexio-mcp-server@2.4.1`, MCP Registry, and the `.mcpb` bundle)._
