# Phase 6: Distribution - Research

**Researched:** 2026-02-02
**Domain:** npm Publishing, MCP Registry Submission, GitHub Releases, Documentation
**Confidence:** HIGH

## Summary

Phase 6 covers the final distribution of the completed Bexio MCP server across three channels: npm registry, MCP Registry (Anthropic's directory), and GitHub releases. All code is complete from Phase 5 - this phase handles packaging, publishing, and user-facing documentation.

The distribution strategy involves:
1. **npm Registry** - Scoped package `@promptpartner/bexio-mcp-server` for npx and global installation
2. **MCP Registry** - Submit MCPB bundle to Anthropic's directory for discoverability in Claude Desktop
3. **GitHub** - New repository at github.com/promptpartner/bexio-mcp-server with releases including .mcpb bundle

Key considerations: The npm scope `@promptpartner` requires an organization on npmjs.com. MCP Registry submission requires manifest version 0.3+, tool annotations, and privacy policy URLs. GitHub releases can attach .mcpb bundles as binary assets.

**Primary recommendation:** Publish npm package first (enables npx usage), then create GitHub repository/release, and finally submit to MCP Registry (which references both npm and GitHub).

## Standard Stack

### Core

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| npm CLI | ^10.0.0 | Package publishing | Built into Node.js, official npm registry interface |
| gh CLI | ^2.86.0 | GitHub operations | Official GitHub CLI for releases and repo management |
| mcpb CLI | latest | Bundle validation | Official MCPB tooling from Anthropic |

### Supporting

| Tool | Purpose | When to Use |
|------|---------|-------------|
| git | Version control, tagging | Create release tags before publishing |
| npm pack | Dry-run testing | Verify package contents before publish |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| gh CLI | GitHub web UI | CLI is scriptable, consistent |
| npm publish | npm/GitHub Actions | Manual is fine for initial release |
| MCPB form submission | API submission | No API exists, form is only path |

**No installation required** - npm and git are already in the project, gh CLI is standard on development machines.

## Architecture Patterns

### Pattern 1: npm Package Publishing Flow

**What:** Scoped package publication with organization scope

**When to use:** Initial release and all subsequent version updates

**Process:**
```bash
# 1. Ensure organization exists on npmjs.com
#    Create @promptpartner org if not exists

# 2. Verify package.json has correct scope
#    "name": "@promptpartner/bexio-mcp-server"

# 3. Login to npm
npm login

# 4. Verify package contents (dry run)
npm pack --dry-run

# 5. Publish with public access (required for scoped packages)
npm publish --access public

# 6. Verify publication
npm view @promptpartner/bexio-mcp-server
```

**Critical notes:**
- First publish MUST include `--access public` for scoped packages
- Subsequent publishes do not need `--access public` (persists)
- Organization must exist before publishing
- publishConfig.access in package.json can set default

### Pattern 2: GitHub Release with Assets

**What:** Create tagged release with .mcpb bundle attached

**When to use:** Every version release

**Process:**
```bash
# 1. Ensure clean working directory
git status

# 2. Create and push tag
git tag -a v2.0.0 -m "Release 2.0.0"
git push origin v2.0.0

# 3. Create release with assets
gh release create v2.0.0 \
  --title "v2.0.0" \
  --notes-file CHANGELOG.md \
  ./bexio-mcp-server.mcpb#"MCPB Bundle for Claude Desktop"

# Or with inline notes
gh release create v2.0.0 \
  --title "v2.0.0 - Initial Release" \
  --notes "$(cat <<'EOF'
## What's New

Complete Bexio accounting integration for Claude Desktop with 221 tools.

### Installation

**MCPB (Claude Desktop):** Download and double-click the .mcpb file
**npm:** `npx @promptpartner/bexio-mcp-server`
**Source:** See README.md for manual setup

### Features
- 221 tools covering all Bexio API domains
- Swiss QR-bill payment support
- Interactive UI previews for invoices and contacts
EOF
)" \
  ./bexio-mcp-server.mcpb#"MCPB Bundle"
```

**Asset labeling syntax:**
- `path/to/file#"Display Label"` - attach with custom label
- Multiple files can be attached in one command

### Pattern 3: MCP Registry Submission

**What:** Submit MCPB bundle to Anthropic's directory for Claude Desktop discoverability

**When to use:** After initial release is stable and tested

**Process:**
1. Verify manifest meets v0.3+ requirements:
   - `manifest_version: "0.3"`
   - `privacy_policies` array with URLs
   - All tools have `readOnlyHint` or `destructiveHint` annotations

2. Prepare submission materials:
   - Working .mcpb bundle file
   - Documentation links (GitHub README, privacy policy)
   - Test credentials (if applicable)
   - Minimum 3 usage examples with prompts and expected outputs

3. Submit via form: https://forms.gle/tyiAZvch1kDADKoP9
   - Required: Server details, docs, examples, contact info
   - Review is manual and not guaranteed

### Pattern 4: Keep A Changelog Format

**What:** Standardized CHANGELOG.md format

**When to use:** Every release

**Template:**
```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [2.0.0] - 2026-02-02

### Added
- Complete Bexio API coverage with 221 tools
- Interactive UI previews (invoice, contact, dashboard)
- Swiss QR-bill and IBAN payment support
- MCPB bundle for one-click Claude Desktop installation
- Dual transport: stdio (Claude Desktop) + HTTP (n8n)

### Changed
- Rewritten from scratch with MCP SDK 1.25.2
- Modular architecture (domain-organized modules)

[unreleased]: https://github.com/promptpartner/bexio-mcp-server/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/promptpartner/bexio-mcp-server/releases/tag/v2.0.0
```

### Anti-Patterns to Avoid

- **Publishing without organization:** Scoped package `@promptpartner/*` requires the org to exist first on npmjs.com

- **Missing `--access public`:** First publish of scoped package defaults to private, which requires paid account

- **Manifest version 0.2 for MCP Registry:** Directory submission requires manifest_version 0.3+ with privacy policies

- **No tool annotations:** MCP Registry rejects bundles without readOnlyHint/destructiveHint on tools

- **Committing credentials:** Never commit npm tokens, GitHub tokens, or test credentials

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Release notes | Manual markdown | `gh release create --generate-notes` or CHANGELOG.md | Consistent format, automatic |
| Package verification | Manual file inspection | `npm pack --dry-run` | Shows exact files that will publish |
| Manifest validation | Manual JSON checking | `mcpb validate` | Catches schema errors |
| Changelog format | Custom format | Keep A Changelog | Industry standard, human-readable |

**Key insight:** Distribution is about reducing friction for users. Using standard tools and formats ensures users recognize the installation experience.

## Common Pitfalls

### Pitfall 1: npm Organization Doesn't Exist

**What goes wrong:** `npm publish` fails with "You do not have permission to publish"
**Why it happens:** Scoped package requires org to exist, org not created on npmjs.com
**How to avoid:**
- Create organization at npmjs.com before first publish
- Verify org ownership or membership
- Use `npm org ls @promptpartner` to check
**Warning signs:** E403 error on publish attempt

### Pitfall 2: GitHub Repository URL Mismatch

**What goes wrong:** npm package links to wrong repository
**Why it happens:** package.json repository field not updated for new repo
**How to avoid:**
- Update package.json repository URL before publish
- Update homepage and bugs URLs
- Verify with `npm pack --dry-run` output
**Warning signs:** npm page links to old/wrong GitHub repo

### Pitfall 3: MCP Registry Rejection for Missing Annotations

**What goes wrong:** Directory submission rejected
**Why it happens:** Tools missing readOnlyHint/destructiveHint annotations
**How to avoid:**
- Add annotations to manifest.json tools array
- Use `mcpb validate` before submission
- Read-only tools get `readOnlyHint: true`
- Mutating tools get `destructiveHint: true`
**Warning signs:** Validation warnings about tool definitions

### Pitfall 4: Missing Privacy Policy for MCP Registry

**What goes wrong:** Directory submission rejected
**Why it happens:** Extension connects to external service (Bexio API) but no privacy_policies
**How to avoid:**
- Add `privacy_policies` array to manifest
- Include Bexio's privacy policy URL
- Include own privacy policy if processing data
- Manifest version must be 0.3+
**Warning signs:** Manifest lacks privacy_policies field

### Pitfall 5: .mcpb Bundle Not Attached to Release

**What goes wrong:** Users can't find MCPB bundle download
**Why it happens:** gh release created without attaching asset
**How to avoid:**
- Include .mcpb file path in `gh release create` command
- Verify asset appears on release page
- Use asset labels for clarity
**Warning signs:** Release page shows only source archives

## Code Examples

### package.json Updates for Publishing

```json
{
  "name": "@promptpartner/bexio-mcp-server",
  "version": "2.0.0",
  "description": "MCP server for Bexio accounting integration with Claude Desktop",
  "author": {
    "name": "Lukas Hertig",
    "email": "lukas@promptpartner.ai"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/promptpartner/bexio-mcp-server.git"
  },
  "homepage": "https://github.com/promptpartner/bexio-mcp-server#readme",
  "bugs": {
    "url": "https://github.com/promptpartner/bexio-mcp-server/issues"
  },
  "keywords": [
    "bexio",
    "accounting",
    "invoices",
    "swiss",
    "mcp",
    "claude",
    "model-context-protocol"
  ],
  "publishConfig": {
    "access": "public"
  }
}
```

### manifest.json Updates for MCP Registry

```json
{
  "manifest_version": "0.3",
  "name": "bexio-mcp-server",
  "version": "2.0.0",
  "description": "Complete Swiss accounting integration for Bexio",
  "author": {
    "name": "Lukas Hertig",
    "email": "lukas@promptpartner.ai"
  },
  "homepage": "https://github.com/promptpartner/bexio-mcp-server",
  "icon": "icon.png",
  "license": "MIT",
  "privacy_policies": [
    "https://www.bexio.com/en-CH/privacy-policy",
    "https://promptpartner.ai/privacy"
  ],
  "server": {
    "type": "node",
    "entry_point": "dist/index.js",
    "mcp_config": {
      "command": "node",
      "args": ["${__dirname}/dist/index.js"],
      "env": {
        "BEXIO_API_TOKEN": "${user_config.api_token}",
        "BEXIO_BASE_URL": "${user_config.base_url}"
      }
    }
  },
  "tools": [
    {
      "name": "list_invoices",
      "description": "List invoices with pagination",
      "annotations": { "readOnlyHint": true }
    },
    {
      "name": "create_invoice",
      "description": "Create a new invoice",
      "annotations": { "destructiveHint": true }
    }
  ]
}
```

### README Quick Start Section

```markdown
## Quick Start

### Option 1: MCPB Bundle (Recommended for Claude Desktop)

1. Download `bexio-mcp-server.mcpb` from [Releases](https://github.com/promptpartner/bexio-mcp-server/releases)
2. Double-click to install in Claude Desktop
3. Enter your Bexio API token when prompted

### Option 2: npm (for manual configuration)

```bash
npx @promptpartner/bexio-mcp-server
```

Add to Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "bexio": {
      "command": "npx",
      "args": ["@promptpartner/bexio-mcp-server"],
      "env": {
        "BEXIO_API_TOKEN": "your-token-here"
      }
    }
  }
}
```

### Option 3: From Source

```bash
git clone https://github.com/promptpartner/bexio-mcp-server
cd bexio-mcp-server/src
npm install
npm run build
node dist/index.js
```
```

### GitHub Release Script

```bash
#!/bin/bash
# scripts/release.sh

VERSION=$1
if [ -z "$VERSION" ]; then
  echo "Usage: ./scripts/release.sh 2.0.0"
  exit 1
fi

# Build and pack
cd src
npm run build
npm run pack:mcpb
cd ..

# Tag
git tag -a "v$VERSION" -m "Release $VERSION"
git push origin "v$VERSION"

# Create release with MCPB bundle
gh release create "v$VERSION" \
  --title "v$VERSION" \
  --notes-file CHANGELOG.md \
  "./bexio-mcp-server.mcpb#MCPB Bundle for Claude Desktop"

echo "Release v$VERSION created!"
echo "Next steps:"
echo "1. cd src && npm publish --access public"
echo "2. Submit to MCP Registry: https://forms.gle/tyiAZvch1kDADKoP9"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual Claude Desktop config | MCPB double-click install | MCPB stable 2025 | Zero-friction installation |
| Manifest v0.2 | Manifest v0.3 with privacy policies | Dec 2025 | Required for directory listing |
| Direct npm publish | Organization-scoped packages | Long-standing | Brand recognition, namespace control |
| Manual release notes | Keep A Changelog + gh CLI | Industry standard | Consistent, linkable history |

**Deprecated/outdated:**
- `.dxt` extension format: Renamed to `.mcpb` (Dec 2025)
- Manifest v0.2: Still works but v0.3 required for MCP Registry submission
- `@bexio` scope: Context says use `@promptpartner` (org ownership)

## Open Questions

Things that couldn't be fully resolved:

1. **PromptPartner npm Organization Status**
   - What we know: Package should be `@promptpartner/bexio-mcp-server`
   - What's unclear: Whether @promptpartner org exists on npmjs.com
   - Recommendation: Verify org exists or create it before publishing

2. **Privacy Policy URLs**
   - What we know: MCP Registry v0.3 requires privacy_policies array
   - What's unclear: Does PromptPartner have a privacy policy URL?
   - Recommendation: Use Bexio's privacy policy plus create/use org privacy policy

3. **MCP Registry Review Timeline**
   - What we know: Submission is via form, review is not guaranteed
   - What's unclear: How long reviews take, if feedback is provided
   - Recommendation: Submit early, don't block on directory listing

4. **GitHub Repository Creation**
   - What we know: New repo at github.com/promptpartner/bexio-mcp-server
   - What's unclear: Who creates it, what permissions are needed
   - Recommendation: Create repo, push code, then create release

## Sources

### Primary (HIGH confidence)

- [npm Scoped Packages Documentation](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/) - Publishing process
- [gh release create Manual](https://cli.github.com/manual/gh_release_create) - GitHub CLI release syntax
- [MCPB GitHub Repository](https://github.com/anthropics/mcpb) - Bundle format and CLI
- [MCP Server Submission Guide](https://support.claude.com/en/articles/12922832-local-mcp-server-submission-guide) - Directory requirements
- [Keep A Changelog](https://keepachangelog.com/en/1.0.0/) - Changelog format specification

### Secondary (MEDIUM confidence)

- [npm Organization Scoped Packages](https://docs.npmjs.com/creating-and-publishing-an-organization-scoped-package/) - Org setup
- [GitHub CLI Releases](https://github.com/cli/cli/releases) - CLI version info (v2.86.0)
- [Building Desktop Extensions with MCPB](https://support.claude.com/en/articles/12922929-building-desktop-extensions-with-mcpb) - Bundle best practices

### Tertiary (LOW confidence)

- MCP Registry review timeline - No official documentation on timeline
- PromptPartner org setup specifics - Depends on actual npm/GitHub org state

## Metadata

**Confidence breakdown:**
- npm publishing: HIGH - Official npm docs, well-established process
- GitHub releases: HIGH - Official gh CLI docs, standard workflow
- MCP Registry: MEDIUM - Submission guide exists but review process opaque
- Changelog format: HIGH - Keep A Changelog is industry standard

**Research date:** 2026-02-02
**Valid until:** 2026-03-02 (30 days - distribution processes are stable)
