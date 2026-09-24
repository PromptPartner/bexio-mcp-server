# Issue replies — v2.6.0

> Posted after the v2.6.0 release (GitHub writes authorized for this session). Lines
> marked **[LIVE]** are confirmed by `src/scripts/verify-v2.6.0.mjs` against a live
> bexio company before posting. Adjust any claim the live run does not support.

---

## #19: `edit_invoice` always fails (PUT vs POST), and the #19 audit comment

Fixed in **v2.6.0**. Thank you @NataliWinOn365 for the three-part diagnosis, and @ButtonGmbh for
the audit. The `edit_item` finding was the most important thing in this thread.

All three points are in:

1. **PUT → POST on every v2.0 edit.** bexio's OpenAPI spec documents POST as the only edit
   verb on every 2.0 path we were sending PUT to. Your audit table plus three it missed:
   `edit_invoice`, `edit_quote`, `edit_order`, `edit_item`, `update_contact_group`,
   `update_salutation`, `update_title`, and also `update_note`, `update_additional_address`
   and `edit_order_repetition`. The last one also used a path bexio doesn't have
   (`/repetition/{id}`); an order's repetition is `/kb_order/{id}/repetition`. A guard test
   now fails the build if a v2.0 PUT is ever reintroduced.
2. **`esr_id` / `qr_invoice_id` are no longer re-sent** by `edit_invoice`.
3. **bexio's `errors[]` are now surfaced**, on every transport path including upload,
   download and the v3/v4 calls. A validation failure now reads e.g. "The form could not be
   saved due to the following errors: Widget schema does not include the following
   field(s): esr_id, qr_invoice_id" instead of "…errors:.".

**[LIVE]** Verified on a live company with throwaway records: `edit_item` changing one
field leaves prices, code and description intact; `edit_invoice` / `edit_quote` /
`edit_order` / `update_note` / group / salutation / title all apply partial edits.

---

## #18: EPIPE feedback loop in the global uncaughtException handler

Fixed in **v2.6.0**. Thank you @georgesleuenberger. The deterministic repro made this easy
to pin down.

The fix follows your suggestion, with one deliberate difference:
- The logger stops writing once stderr fails, and the `uncaughtException` handler drops
  broken-pipe errors instead of logging them. That breaks the loop.
- A dead **stdout** in stdio mode means the client is gone, so the server exits (as #11 does
  on stdin close).
- A dead **stderr alone** only silences the logger and does not exit. A client that drops
  stderr but still talks over stdout keeps a working server.

`src/scripts/verify-shutdown.mjs` now ports your repro to Node. Before the fix: still alive
after 3 s at 99% CPU. After: exits in ~100 ms. It also covers the stderr-only case (keeps
serving, 0% CPU). If you want to run it against your setup: `npm run build && node
scripts/verify-shutdown.mjs` from `src/`.

---

## #17: `address` rejected; writable fields are `street_name` / `house_number`

Fixed in **v2.6.0**. Thanks @lexsulzer. We did both of your options:

- `create_contact` and `bulk_create_contacts` now advertise `street_name`, `house_number`
  and `address_addition`.
- `address` still works, deprecated, and is split server-side ("Bahnhofstrasse 12a" →
  `street_name` "Bahnhofstrasse", `house_number` "12a"; no trailing number → all
  `street_name`). `update_contact` applies the same mapping.

One thing that made it worse than it looked: the create schema was a strict object, so
`street_name` / `house_number` were being **stripped** before reaching bexio. Passing them
through didn't work in 2.5.0 either. Additional addresses had the same defect and are
fixed too. The empty-422 problem is also addressed: bexio's `errors[]` are now included
in error messages (see #19).

---

## #16: `upload_file`: accept a local file path

Implemented in **v2.6.0**. Thanks @lexsulzer, it's the right shape.

`upload_file` takes an optional `file_path`, mutually exclusive with `content_base64`. The
server reads the file and uploads the bytes directly, so they never pass through the
model. `name` and `content_type` default from the file.

One constraint we added: a caller-chosen local path is only safe when the caller is the
local user. So:
- **stdio:** any path, as you'd expect.
- **HTTP:** only inside `BEXIO_FILE_DIR`, resolved after symlinks, with `../` and
  symlink escapes refused. Without that variable, local paths are refused.

The same rule now applies to `download_file`'s `output_path`, which previously could write
anywhere on an HTTP server's host.

---

## #20: `upload_file` always fails with HTTP 415 (closed via #21)

Shipped in **v2.6.0**. Thanks again @gilles-stack for the precise root cause and the PR. As
a follow-up, upload/download errors now go through the same normalization as every other
call, so a bexio error like this one reads as the actual bexio message instead of
"Request failed with status code 415".

---

## #15: Optional receipt-gating for irreversible writes

Thank you @FutureEnterprises for the careful write-up and for designing it around the
usual objections. We've decided not to take this into the server, so I'm closing it as
not planned. The reasoning, for transparency:

- Approval of each action already happens in the MCP client: Claude Desktop and similar
  hosts ask before each tool call, and the destructive tools carry `destructiveHint`.
  Deployers who want fewer write paths can restrict the surface with
  `BEXIO_ENABLED_CATEGORIES`.
- A cryptographic gate would be a security component we'd have to own and review, even as
  a copied single file. For a protocol that is still an individual draft, that's more
  surface than we want to maintain here.
- Where a deployment needs signed human approval, the cleaner place for it is a policy
  proxy in front of the server, which works for every MCP server, not just this one.

If the draft moves forward in the IETF and hosts start supporting it natively, we're happy
to revisit.

---

## PR #21 (merged)

Merged. Thank you! The comment wording was good as-is. Shipped in v2.6.0.

## PR #22 (merged)

Merged. Thank you @jschwertfeger, especially for the local re-check and the scan statistics,
which make a wrong period visible. Two small follow-ups landed on top in v2.6.0:
- An open-ended range (only `start_date` or only `end_date`) now sends only the given bound,
  instead of the placeholders `0000-01-01` / `9999-12-31`.
- `currency_id` for manual entries now defaults to the company's **base currency**
  (`company_profile.base_currency_id`) instead of `1`. In a mandate whose base currency is
  EUR, id `1` can be CHF, and the entry would be booked in the wrong currency without an
  error.
