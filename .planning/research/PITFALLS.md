# MCP Server Development Pitfalls

**Domain:** MCP Server Migration (v1 to v2) + MCPB Distribution
**Project:** Bexio MCP v2
**Researched:** 2026-02-01
**Confidence:** MEDIUM-HIGH (verified against official sources and community patterns)

---

## Critical Pitfalls

Mistakes that cause rewrites, broken installations, or major issues.

---

### Pitfall 1: SDK API Breaking Changes (0.5.0 to 1.25+)

**What goes wrong:** The v1 codebase uses `Server` class with `setRequestHandler()` pattern. SDK 1.x introduces `McpServer` class with different patterns (`registerTool`, `registerResource`). Direct upgrade breaks all tool handlers.

**Why it happens:**
- The SDK evolved significantly between 0.5.0 and 1.x
- Import paths changed (e.g., `@modelcontextprotocol/sdk/server/index.js` vs new module structure)
- Handler registration API changed fundamentally
- Transport initialization patterns differ

**Consequences:**
- All 56 tools fail to register
- Server won't start
- No clear error messages (just crashes)

**Warning signs:**
- TypeScript errors on import statements
- `setRequestHandler` method not found
- `CallToolRequestSchema` import fails

**Prevention:**
1. Read the v1.x to v2 migration docs at [typescript-sdk v1.x branch](https://github.com/modelcontextprotocol/typescript-sdk/tree/v1.x)
2. Create a migration checklist before starting:
   - [ ] Map old import paths to new
   - [ ] Map `setRequestHandler` to new patterns
   - [ ] Verify transport API compatibility
3. Set up parallel test environment running both versions
4. Migrate incrementally: one tool category at a time

**Phase mapping:** Foundation Phase (first thing to address)

**Confidence:** HIGH - Verified via official SDK documentation

---

### Pitfall 2: Manifest Values Not Matching Runtime Values

**What goes wrong:** MCPB manifest.json declares tools, but server's `initialize` response or `tools/list` returns different values. The MCP client blocks the server from running in default mode.

**Why it happens:**
- Manifest written once, then server code evolves
- Tool names/descriptions updated without manifest sync
- Version strings drift between package.json and manifest.json
- Forgetting to regenerate manifest after adding tools

**Consequences:**
- One-click installation fails silently
- Server blocked by client validation
- Users see generic "MCP server has invalid tools" errors

**Warning signs:**
- Server works in development (no manifest validation) but fails in MCPB bundle
- Error: "Tool has invalid JSON parameters"
- Tools appear missing after bundle installation

**Prevention:**
1. Use `mcpb init` then `mcpb pack` workflow - it validates consistency
2. Automate manifest generation from tool definitions
3. Add CI check: compare manifest tools vs runtime tools/list response
4. Single source of truth: generate manifest FROM tool definitions, not separately

**Phase mapping:** MCPB Packaging Phase

**Confidence:** HIGH - [Official MCPB documentation](https://github.com/modelcontextprotocol/mcpb/blob/main/MANIFEST.md) explicitly states this requirement

---

### Pitfall 3: Zod v3/v4 Compatibility Issues

**What goes wrong:** MCP SDK versions have specific Zod version requirements. Using Zod v4 with older SDK, or vice versa, causes cryptic runtime errors.

**Why it happens:**
- Zod v4 adds `$schema` property to all JSON Schema outputs
- SDK uses internal Zod APIs (`_parse`) that changed between versions
- npm may auto-update to incompatible Zod version

**Consequences:**
- `w._parse is not a function` runtime errors
- "Tool has invalid JSON parameters: The schema uses meta-schema features ($dynamicRef) that are not yet supported"
- All tool calls fail with validation errors

**Warning signs:**
- Tools work locally but fail in certain MCP clients
- TypeScript compilation succeeds but runtime crashes
- JSON Schema validation errors mentioning `$dynamicRef`

**Prevention:**
1. Pin Zod version explicitly in package.json: `"zod": "3.22.x"` (not `^3.22.0`)
2. Test with target MCP clients (Claude Desktop, VS Code) before release
3. Check SDK release notes for Zod version requirements
4. Lock dependencies with package-lock.json, include in bundle

**Phase mapping:** Foundation Phase (dependency setup)

**Confidence:** HIGH - [GitHub Issue #1429](https://github.com/modelcontextprotocol/modelcontextprotocol/issues/1429) and [Issue #251315](https://github.com/microsoft/vscode/issues/251315) document this explicitly

---

### Pitfall 4: stdout Contamination

**What goes wrong:** Server writes logs, debug output, or stray console.log() to stdout. This corrupts the JSON-RPC message stream, causing protocol errors.

**Why it happens:**
- Developer habit of console.log() debugging
- Library dependencies write to stdout
- Error stack traces going to wrong stream
- Leftover debug statements

**Consequences:**
- "Parse error: Unexpected token" from client
- Server connects but tools randomly fail
- Intermittent failures (only when certain log paths trigger)

**Warning signs:**
- Works in HTTP mode, fails in stdio mode
- Inconsistent failures between tool calls
- Client reports malformed JSON

**Prevention:**
1. **Absolute rule:** Only JSON-RPC messages go to stdout
2. Configure all logging to stderr: `console.error()` for all logs
3. Add pre-commit hook checking for `console.log`
4. Use structured logger that defaults to stderr
5. Test in stdio mode specifically during development

**Phase mapping:** Every phase - establish logging convention first

**Confidence:** HIGH - [Stainless MCP guide](https://www.stainless.com/mcp/error-handling-and-debugging-mcp-servers) explicitly documents this

---

### Pitfall 5: Tool Name Changes Breaking Backward Compatibility

**What goes wrong:** Renaming tools during refactoring breaks existing Claude conversations that reference old tool names.

**Why it happens:**
- Refactoring for "cleaner" naming
- Standardizing naming convention
- Not realizing tools are referenced by exact name

**Consequences:**
- Users' existing Claude Desktop conversations stop working
- "Tool not found" errors
- User trust erosion

**Warning signs:**
- Users report "it used to work"
- Tool calls in conversation history fail
- Migration didn't seem to break anything in testing (fresh sessions)

**Prevention:**
1. **Never rename tools in a migration** - add aliases if needed
2. Document all tool names as part of public API
3. If must rename: deprecate old name for 2 versions minimum
4. Test with exported conversation histories

**Phase mapping:** Foundation Phase (API contract decision)

**Confidence:** MEDIUM - From project requirements and general MCP best practices

---

## Moderate Pitfalls

Mistakes that cause delays, technical debt, or user confusion.

---

### Pitfall 6: API Wrapper One-on-One Anti-Pattern

**What goes wrong:** Creating one MCP tool per Bexio API endpoint. 56 tools become 100+ tools, AI accuracy drops significantly.

**Why it happens:**
- Path of least resistance in design
- "Complete API coverage" as a goal
- Not considering AI tool selection accuracy

**Consequences:**
- Tool selection accuracy drops logarithmically with tool count
- AI calls wrong tool more often
- Token consumption increases
- Slower responses

**Warning signs:**
- AI frequently picks wrong similar tools (list_invoices vs search_invoices)
- Users have to be very specific about which tool to use
- Tool descriptions become nearly identical

**Prevention:**
1. Study [Block's Layered Tool Pattern](https://www.docker.com/blog/mcp-server-best-practices/) - reduce tool count through polymorphic design
2. Combine related operations: `invoice_search` with optional filters, not separate `list_invoices`, `search_invoices`, `search_invoices_by_customer`
3. Target 15-30 tools maximum for optimal AI accuracy
4. Use parameters instead of separate tools

**Phase mapping:** Architecture Phase

**Confidence:** MEDIUM - [Docker MCP best practices](https://www.docker.com/blog/mcp-server-best-practices/) and [Snyk analysis](https://snyk.io/articles/5-best-practices-for-building-mcp-servers/)

---

### Pitfall 7: Vague Error Messages for LLM Recovery

**What goes wrong:** Error messages like `KeyError: 'id'` or `API Error 400` tell the AI nothing actionable.

**Why it happens:**
- Developer-centric error messages
- Not considering AI as the error consumer
- Generic exception handling

**Consequences:**
- AI cannot self-correct
- User must intervene manually
- Poor user experience
- Repeated failed tool calls

**Warning signs:**
- AI keeps retrying with same parameters
- Users report "Claude got stuck"
- Error messages reference internal code structure

**Prevention:**
1. Error messages should be prompts: "Contact with ID 123 not found. Try searching by name using search_contacts tool."
2. Include actionable recovery suggestions
3. Provide context: what was attempted, what failed, what to try instead
4. Use `isError: true` flag properly for tool execution errors

**Phase mapping:** Implementation Phase (error handling standards)

**Confidence:** HIGH - [Alpic AI guide](https://alpic.ai/blog/better-mcp-tool-call-error-responses-ai-recover-gracefully) and [MCPcat guide](https://mcpcat.io/guides/error-handling-custom-mcp-servers/)

---

### Pitfall 8: Missing npm Package Pre-Publication

**What goes wrong:** Submitting to MCP Registry before npm package exists. Registry validates package existence and rejects.

**Why it happens:**
- Publishing workflow unclear
- Assumption registry is independent of npm
- Racing to get listed

**Consequences:**
- Registry submission rejected
- Wasted time on submission form
- Potential namespace squatting by others

**Warning signs:**
- Registry shows "package not found" error
- Submission appears to succeed but listing never appears

**Prevention:**
1. Publish to npm FIRST, then submit to registry
2. Verify npm package is public (not private registry)
3. Add `mcp` field to package.json for verification link
4. Follow namespace format: reverse DNS like `io.github.username/server`

**Phase mapping:** Distribution Phase

**Confidence:** HIGH - [MCP Registry documentation](https://modelcontextprotocol.io/registry/about)

---

### Pitfall 9: Monolithic Server Architecture

**What goes wrong:** Single file with all tools, all API calls, all validation. Existing 2,418-line server.ts becomes unmaintainable.

**Why it happens:**
- Easier to start with single file
- "Will refactor later"
- MCP examples show simple single-file servers

**Consequences:**
- Merge conflicts in team development
- Difficult to test individual tools
- Long rebuild times during development
- Hard to add new features

**Warning signs:**
- `server.ts` exceeds 500 lines
- Scrolling to find tool definitions
- Circular dependency warnings
- Test file as long as source

**Prevention:**
1. Structure by domain module from the start:
   ```
   src/
     tools/
       contacts/
       invoices/
       orders/
     lib/
       bexio-client.ts
       errors.ts
     server.ts (orchestration only)
   ```
2. One tool registration per file maximum
3. Shared schemas in separate types module
4. API client abstracted from tool handlers

**Phase mapping:** Architecture Phase (first refactoring)

**Confidence:** HIGH - Project requirement explicitly calls out the 2,418-line problem

---

### Pitfall 10: Testing Only Happy Paths

**What goes wrong:** Tests verify tools work with valid inputs but miss: auth failures, rate limits, malformed responses, network timeouts.

**Why it happens:**
- Happy path is easiest to test
- Mocking external API is work
- "Works on my machine" false confidence

**Consequences:**
- Production failures from edge cases
- Silent data corruption
- Users lose trust after first failure

**Warning signs:**
- 100% pass rate but production issues
- Tests run in milliseconds (not hitting real behavior)
- No timeout/retry tests
- Coverage shows error handlers untested

**Prevention:**
1. Mock Bexio API for all tests - no live API in CI
2. Dedicated test suites:
   - [ ] Auth failure scenarios
   - [ ] Rate limit handling
   - [ ] Malformed API responses
   - [ ] Network timeout behavior
   - [ ] Pagination edge cases
3. Use Vitest's mocking for axios calls
4. Test `isError: true` response paths

**Phase mapping:** Every phase - test strategy from day one

**Confidence:** HIGH - [Merge MCP testing guide](https://www.merge.dev/blog/mcp-server-testing) and community discussion at [HN](https://news.ycombinator.com/item?id=46806537)

---

## Minor Pitfalls

Annoyances that are fixable but waste time.

---

### Pitfall 11: Tool Name Format Violations

**What goes wrong:** Tool names with spaces, dots, or special characters. Client refuses to load tools.

**Why it happens:**
- Human-readable naming instinct
- Copy-paste from documentation
- Not knowing the regex constraint

**Consequences:**
- Tools silently omitted
- "MCP server has tools with invalid parameters" error
- Debugging time wasted

**Warning signs:**
- Some tools appear, others don't
- Works in one client, fails in another

**Prevention:**
- Tool names must match: `^[a-zA-Z0-9_-]{1,64}$`
- Use snake_case: `list_invoices`, `create_contact`
- Add linting rule to catch violations
- Validate at compile time with Zod

**Phase mapping:** Every phase - naming convention from start

**Confidence:** HIGH - [MCP specification](https://modelcontextprotocol.io/specification/draft/basic/security_best_practices)

---

### Pitfall 12: Forgetting CORS for HTTP Mode

**What goes wrong:** HTTP mode works from curl but fails from browser/n8n due to missing CORS headers.

**Why it happens:**
- stdio mode doesn't need CORS
- Testing with same-origin tools only
- CORS is an afterthought

**Consequences:**
- n8n integration broken
- Browser-based tools can't connect
- "No 'Access-Control-Allow-Origin' header" errors

**Warning signs:**
- curl works, browser doesn't
- Preflight OPTIONS request fails

**Prevention:**
1. Add CORS middleware from day one for HTTP mode
2. Test with browser fetch() not just curl
3. Configure allowed origins appropriately (not just `*` in production)

**Phase mapping:** HTTP Mode Phase (if keeping it)

**Confidence:** MEDIUM - Standard web development knowledge

---

### Pitfall 13: Hardcoded Base URLs

**What goes wrong:** Bexio API URL hardcoded, breaks when Bexio releases v3.0 endpoint or regional variants.

**Why it happens:**
- Works now, worry later
- Environment variables feel like overhead

**Consequences:**
- All API calls fail when Bexio changes
- No way to test against staging
- Regional users locked out

**Warning signs:**
- Users report "was working yesterday"
- No way to override API endpoint

**Prevention:**
1. Environment variable: `BEXIO_BASE_URL` with sensible default
2. Document the override in README
3. Support per-endpoint URL overrides for v2/v3 split

**Phase mapping:** Foundation Phase

**Confidence:** HIGH - Already partially implemented in v1, just standardize

---

### Pitfall 14: Bundle Size Bloat

**What goes wrong:** MCPB bundle includes dev dependencies, test files, or unnecessary node_modules. Bundle is 50MB instead of 5MB.

**Why it happens:**
- `npm pack` includes too much
- No .npmignore or files field
- node_modules copied wholesale

**Consequences:**
- Slow download for one-click install
- Storage concerns on user machines
- Unnecessary code in production

**Warning signs:**
- Bundle size >10MB
- devDependencies in production
- Test files in bundle

**Prevention:**
1. Use `files` field in package.json to whitelist
2. Set `devDependencies` correctly, not `dependencies`
3. Use bundler (esbuild) for single-file output
4. Test bundle contents: `tar -tzf package.tgz`

**Phase mapping:** MCPB Packaging Phase

**Confidence:** MEDIUM - General npm publishing best practice

---

### Pitfall 15: Session State Assumptions

**What goes wrong:** Assuming server maintains state between tool calls. MCP clients may restart server between calls.

**Why it happens:**
- Caching "optimization"
- Storing pagination cursors
- Connection pooling assumptions

**Consequences:**
- State lost unpredictably
- "Cursor expired" errors
- Inconsistent behavior

**Warning signs:**
- "It worked the first time"
- Pagination fails after inactivity
- Caching seems to not work

**Prevention:**
1. Design for stateless operation
2. No in-memory caching (or use TTL with graceful expiry)
3. Each tool call is independent
4. Pass all needed context in parameters

**Phase mapping:** Architecture Phase

**Confidence:** MEDIUM - MCP protocol design principle

---

## Security Pitfalls

Specific to security concerns.

---

### Pitfall 16: Prompt Injection via Tool Parameters

**What goes wrong:** User input passed directly to tool descriptions or system prompts, allowing injection attacks.

**Why it happens:**
- Dynamic tool descriptions
- User data in error messages fed back to AI
- Not treating user input as untrusted

**Consequences:**
- Attackers manipulate AI behavior
- Data exfiltration via crafted inputs
- Unauthorized operations

**Warning signs:**
- Tool descriptions include user-provided data
- Error messages quote user input verbatim
- No input sanitization

**Prevention:**
1. Static tool descriptions only
2. Validate all inputs against strict schemas (Zod)
3. Sanitize user data before including in responses
4. Don't reflect user input in error messages unescaped
5. Consider [Microsoft's spotlighting technique](https://developer.microsoft.com/blog/protecting-against-indirect-injection-attacks-mcp)

**Phase mapping:** Every phase - security mindset from start

**Confidence:** HIGH - [MCP Security Best Practices](https://modelcontextprotocol.io/specification/draft/basic/security_best_practices) and OWASP guidance

---

### Pitfall 17: Over-Permissioned Tool Access

**What goes wrong:** Tools can access more than they need. File system access tool can read anything, not just intended directories.

**Why it happens:**
- Convenience during development
- "Trust the user" assumption
- No permission scoping in design

**Consequences:**
- Attack surface expanded
- Data breach if tool compromised
- Compliance violations

**Warning signs:**
- Tools use absolute paths without validation
- No directory restrictions
- API tokens have full account access

**Prevention:**
1. Least privilege principle
2. Scope API tokens to minimum required permissions
3. Validate all paths against allowed directories
4. Document permission requirements in manifest

**Phase mapping:** Architecture Phase

**Confidence:** HIGH - [MCP Security specification](https://modelcontextprotocol.io/specification/draft/basic/security_best_practices)

---

## Phase-Specific Warnings

| Phase | Likely Pitfall | Mitigation |
|-------|---------------|------------|
| Foundation | SDK API changes (Pitfall 1) | Study migration docs before writing code |
| Foundation | Zod version mismatch (Pitfall 3) | Pin exact Zod version |
| Architecture | Monolithic structure (Pitfall 9) | Design modular from start |
| Architecture | Too many tools (Pitfall 6) | Target 15-30 tools, combine related ops |
| Implementation | stdout contamination (Pitfall 4) | stderr-only logging convention |
| Implementation | Vague errors (Pitfall 7) | AI-friendly error messages |
| MCPB Packaging | Manifest mismatch (Pitfall 2) | Generate manifest from code |
| MCPB Packaging | Bundle bloat (Pitfall 14) | Whitelist files, test bundle |
| Distribution | npm before registry (Pitfall 8) | npm publish first, then registry |
| Testing | Happy path only (Pitfall 10) | Error scenario test suites |
| All phases | Tool name changes (Pitfall 5) | Never rename, only add aliases |
| All phases | Security (Pitfalls 16-17) | Input validation, least privilege |

---

## Sources

**Official Documentation:**
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCPB Manifest Specification](https://github.com/modelcontextprotocol/mcpb/blob/main/MANIFEST.md)
- [MCP Registry](https://modelcontextprotocol.io/registry/about)
- [MCP Security Best Practices](https://modelcontextprotocol.io/specification/draft/basic/security_best_practices)

**Community Guides:**
- [Docker MCP Best Practices](https://www.docker.com/blog/mcp-server-best-practices/)
- [Snyk MCP Best Practices](https://snyk.io/articles/5-best-practices-for-building-mcp-servers/)
- [Stainless Error Handling Guide](https://www.stainless.com/mcp/error-handling-and-debugging-mcp-servers)
- [MCPcat Testing Guide](https://mcpcat.io/guides/writing-unit-tests-mcp-servers/)
- [Alpic AI Error Recovery](https://alpic.ai/blog/better-mcp-tool-call-error-responses-ai-recover-gracefully)
- [Merge MCP Testing Best Practices](https://www.merge.dev/blog/mcp-server-testing)
- [ZazenCodes Naming Conventions](https://zazencodes.com/blog/mcp-server-naming-conventions)

**Issue Trackers:**
- [Zod v4 Compatibility Issue #1429](https://github.com/modelcontextprotocol/modelcontextprotocol/issues/1429)
- [VS Code Zod v4 Issue #251315](https://github.com/microsoft/vscode/issues/251315)
- [Tool Versioning Discussion #1915](https://github.com/modelcontextprotocol/modelcontextprotocol/issues/1915)

**Security:**
- [Practical DevSecOps MCP Vulnerabilities](https://www.practical-devsecops.com/mcp-security-vulnerabilities/)
- [Microsoft Prompt Injection Protection](https://developer.microsoft.com/blog/protecting-against-indirect-injection-attacks-mcp)
- [Prompt Security Top 10 MCP Risks](https://prompt.security/blog/top-10-mcp-security-risks)

---

*Research completed: 2026-02-01*
