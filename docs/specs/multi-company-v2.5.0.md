# Spec: Multi-company support (v2.5.0)

> Authored autonomously 2026-07-01 from the customer question: "I have multiple
> companies in Bexio — do I need a token per company, and is there a way to run one
> server for all of them?" Answer: in Bexio every API token is bound to one company
> (mandate); there is no token that spans companies and no API company-switch. Today
> users must run N server instances (N× the ~314-tool context cost). This feature lets
> **one** instance hold several companies' tokens and switch between them, adding just
> two tools.

## Goals
- One server instance serves multiple Bexio companies, each via its own token.
- The model can discover companies and switch the active one in natural language
  ("in Globex, list open invoices").
- 100% backward compatible: existing single-`BEXIO_API_TOKEN` setups are unchanged.
- Never expose tokens in any tool output, log, or response.

## Non-goals (v2.5.0)
- Per-request company scoping for concurrent HTTP/n8n clients. The active company is
  **process-global** (correct for the stdio / Claude Desktop primary use case). HTTP
  multi-tenant users should still run one instance per company; documented as a caveat.
- OAuth. Static Personal Access Tokens only (as today).

## Configuration (env)
- `BEXIO_API_TOKEN` (existing): single company. Still works exactly as before.
- `BEXIO_API_TOKENS` (new): multiple companies. Two accepted formats (lenient parse):
  - JSON object: `{"Acme":"<token>","Globex":"<token>"}`
  - Delimited: `Acme:<token>,Globex:<token>` (labels and tokens have no `:`/`,`; Bexio
    PATs are JWT base64url + dots).
- `BEXIO_DEFAULT_COMPANY` (new, optional): label that is active at startup. Defaults to
  the first configured company.
- Precedence: tokens from `BEXIO_API_TOKENS` (in order) + , if `BEXIO_API_TOKEN` is also
  set and its implied label isn't already present, it is appended under
  `BEXIO_DEFAULT_COMPANY` or `"default"`. At least one token is required (unchanged).

## New tools (domain `companies`)
- `list_companies()` → `{ companies: [{ label, active, company_name? }], active }`.
  `company_name` is fetched from the company profile per client (lazy + cached). No tokens.
- `select_company({ company })` → sets the active company for subsequent tool calls;
  returns `{ active, company_name }`. Unknown label → `McpError.validation` listing the
  available labels.

All other tools operate against the **active** company. To reduce wrong-company mistakes,
the success-response `meta` block gains an `active_company` field.

## Architecture
- New `src/company-manager.ts`: a singleton `companyManager` holding an ordered
  `Map<label,{ token, client, profileName? }>` + `activeLabel`. Methods: `init(env)`,
  `listCompanies()`, `selectCompany(label)`, `getActiveClient()`, `getActiveLabel()`,
  `getCompanyName(label)`. Clients are created lazily on first use per label.
- `src/index.ts`: build the token list from env, `companyManager.init(...)`, then start
  the server. (Replaces constructing a single `BexioClient`.)
- `src/server.ts`: tool dispatch uses `companyManager.getActiveClient()` instead of a
  fixed `this.client`. `initialize()` no longer needs a client passed in.
- `src/transports/http.ts`: `createHandlerRegistry` resolves the active client per call
  via the manager (same global-active semantics).
- New `src/tools/companies/{definitions,handlers,index}.ts`; spread into
  `src/tools/index.ts`. The companies handlers use the `companyManager` singleton (they
  ignore the passed client).
- `src/shared/response.ts`: include `active_company` in `meta` (manager read, decoupled
  via a tiny accessor to avoid a hard import cycle).
- Zod schemas in `src/types/schemas/companies.ts`.

## Security
- Tokens live only in `companyManager` and `BexioClient`. `list_companies` returns
  labels + company names only. No token is ever logged or returned. Parsing failures
  report the bad label, never the value.

## Tests / verification
- Unit (`company-manager.test.ts`): parse JSON + delimited; order preserved; default
  active = first or `BEXIO_DEFAULT_COMPANY`; `selectCompany` valid/invalid; single-token
  backward-compat; tokens never appear in `listCompanies()` output.
- Live: with the one available test token, configure TWO labels pointing at it
  (`Primary` + `Secondary`) to exercise the switch mechanism end-to-end: `list_companies`
  shows both with the real company name, `select_company` flips the active label, and a
  subsequent real tool call routes through the active client. Re-run `verify-fixes.mjs`
  to confirm no regression to the existing lifecycle. (Two *distinct* companies' data
  isolation is guaranteed by Bexio per-token and already verified; the duplicate-label
  test proves the routing/switch code path, which is identical regardless of which token
  each label holds.)
- Build + `check-tools.mjs` (316 tools, no dupes) + full unit suite.

## Release
- Bump v2.5.0 in lockstep (package.json, server.json root + packages[0], manifest.json,
  SERVER_VERSION, CHANGELOG). Add a manifest `user_config` optional field for additional
  tokens (maps to `BEXIO_API_TOKENS`) so one-click `.mcpb` users can also go multi-company.
- README: new "Multiple companies" section.
- Publish: git + GitHub Release + `.mcpb` autonomously; npm (interactive passkey) +
  MCP Registry (after npm) handed to Lukas.
