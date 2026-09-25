# Known issues

Defects and gaps found but not (yet) fixed. Each one names what is affected and the
intended fix, so it can be picked up without re-deriving it. Remove an entry in the
commit that resolves it.

_Last reviewed: 2026-09-24 (v2.6.0 audit)._

## Security

### HTTP mode is unauthenticated unless `BEXIO_HTTP_TOKEN` is set
- **Affected:** `--mode http`. Binds `0.0.0.0` by default; CORS reflects any origin.
- **Now (v2.6.0):** opt-in bearer auth via `BEXIO_HTTP_TOKEN`, plus a startup warning that
  names the exposure. Local file paths over HTTP need `BEXIO_FILE_DIR`.
- **Intended (next major):** secure by default. Bind `127.0.0.1` unless `--host` is given,
  refuse a non-loopback bind without a token, and restrict CORS to an allow-list
  (`BEXIO_HTTP_CORS_ORIGINS`). This breaks setups that rely on the defaults, hence a major.

### Path guard has a check-then-use window
- **Affected:** `shared/path-guard.ts` (upload `file_path`, download `output_path`).
- A symlink swapped in between the check and the read/write could escape
  `BEXIO_FILE_DIR`. It needs write access inside that directory, so the risk is low.
- **Intended:** open with `O_NOFOLLOW` on the final component and re-check the resolved fd.

## Correctness / robustness

### Tool definitions can advertise fields the handler's schema strips
- **Class:** a handler parses args with a strict `z.object`, so any advertised property
  missing from the zod schema is silently dropped. This caused #2 (all args), #17
  (contact street fields) and the additional-address street fields (fixed in v2.6.0).
- **Intended:** one generic test that calls every handler with every advertised property
  set and asserts each one reaches the `BexioClient` call.

### `create_contact` `owner_id` passthrough is dead code
- `tools/contacts/handlers.ts` reads `fields.owner_id`, but `ContactCreateFieldsSchema`
  has no `owner_id`, so the value is always stripped and `owner_id` falls back to `user_id`.
- **Intended:** add `owner_id` to the schema and the definitions, or drop the read.

### `get_journal` with a date range reads every matching page
- Since #22, `limit`/`offset` page the filtered result, so a `limit: 100` call over a
  busy year still fetches all matching rows (2000 per request) before slicing.
- **Intended:** when bexio honours `from`/`to` (the normal case), pass `limit`/`offset`
  through and only fall back to the full scan when a row outside the range shows up.

### `edit_invoice` / `edit_quote` / `edit_order` read-merge lists are unnecessary
- Written for PUT (a full overwrite). **Live result 2026-09-25:** with POST, a bare
  `POST /2.0/kb_invoice/{id} {title}` changed the title and kept `reference` and
  `contact_id`. bexio's POST is a true partial edit.
- **Intended:** drop the merge lists (one API call fewer per edit, no stale-overwrite
  race, no risk of re-sending a field the edit form rejects, as with esr_id). Verify
  quotes and orders live the same way first. Deferred from v2.6.0 because every live
  run on the production mandate uses up a document number.

### Multi-company: the active company is process-global in HTTP mode
- Documented in README. Concurrent HTTP clients share one active company.

## Operational

### Live secrets inside the Dropbox-synced working copy
- `src/.env` (a bexio token, now revoked) and `.mcpregistry_*_token` sit in the Dropbox
  folder. They are gitignored, but the workspace rule is "no secrets in Dropbox".
- **Intended:** keep tokens in the macOS keychain and pass them via env at run time
  (see `scripts/verify-v2.6.0.mjs` for the pattern).
