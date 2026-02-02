# Publishing Guide

This document covers how to publish bexio-mcp-server to npm and the MCP Registry.

## Current Identifiers

| Platform | Identifier |
|----------|------------|
| npm | `@promptpartner/bexio-mcp-server` |
| MCP Registry | `io.github.PromptPartner/bexio-mcp-server` |
| GitHub | `github.com/PromptPartner/bexio-mcp-server` |

**Important:** The MCP Registry name uses exact GitHub capitalization (`PromptPartner`, not `promptpartner`).

## Prerequisites

- Node.js 18+
- npm account logged in as `lukashertig` (has publish access to `@promptpartner` scope)
- GitHub account (owner/member of `PromptPartner` org)
- `mcp-publisher` CLI at `~/.local/bin/mcp-publisher.exe`

## Files That Must Stay In Sync

When bumping versions, update these files:

| File | Fields to Update |
|------|------------------|
| `src/package.json` | `version` |
| `server.json` | `version` (root) AND `packages[0].version` |
| `manifest.json` | `version` |
| `CHANGELOG.md` | Add new version section |

The `mcpName` in package.json and `name` in server.json must always match:
```
io.github.PromptPartner/bexio-mcp-server
```

## Quick Publish (All Steps)

```bash
# 1. Update versions in all files (see checklist below)

# 2. Commit and push
git add src/package.json server.json manifest.json CHANGELOG.md
git commit -m "chore: bump to vX.Y.Z"
git push origin master

# 3. Build and publish to npm
cd src
npm run build
npm publish --access public

# 4. Tag and release on GitHub
cd ..
git tag vX.Y.Z
git push origin vX.Y.Z
gh release create vX.Y.Z --title "vX.Y.Z" --notes "See CHANGELOG.md"

# 5. Publish to MCP Registry
~/.local/bin/mcp-publisher.exe publish

# 6. (Optional) Build MCPB bundle and upload to release
cd src
npm run pack:mcpb
# Upload .mcpb file to GitHub release
```

## Detailed Steps

### 1. Build the Package

```bash
cd src
npm run build
```

This compiles TypeScript, builds UI assets, and prepares the dist folder.

### 2. Publish to npm

```bash
# Check login
npm whoami  # should show: lukashertig

# Publish (scoped packages need --access public)
cd src
npm publish --access public
```

Verify at: https://www.npmjs.com/package/@promptpartner/bexio-mcp-server

### 3. Create GitHub Release

```bash
# Tag the release
git tag vX.Y.Z
git push origin vX.Y.Z

# Create release
gh release create vX.Y.Z --title "vX.Y.Z" --notes "See CHANGELOG.md for details"
```

Or create manually at: https://github.com/PromptPartner/bexio-mcp-server/releases/new

### 4. Submit to MCP Registry

```bash
# Login (only needed once, or if token expires)
~/.local/bin/mcp-publisher.exe login github

# Publish (reads server.json)
~/.local/bin/mcp-publisher.exe publish
```

### 5. Build and Upload MCPB Bundle (Optional)

```bash
cd src
npm run pack:mcpb
```

This creates `bexio-mcp-server-X.Y.Z.mcpb` in the project root.
Upload the `.mcpb` file to the GitHub release.

## Version Bump Checklist

- [ ] Update version in `src/package.json`
- [ ] Update version in `server.json` (both `version` and `packages[0].version`)
- [ ] Update version in `manifest.json`
- [ ] Add changelog entry in `CHANGELOG.md`
- [ ] Update links at bottom of `CHANGELOG.md`
- [ ] Commit: `git commit -am "chore: bump to vX.Y.Z"`
- [ ] Push: `git push origin master`
- [ ] Build: `cd src && npm run build`
- [ ] Publish to npm: `npm publish --access public`
- [ ] Tag: `git tag vX.Y.Z && git push origin vX.Y.Z`
- [ ] Create GitHub release: `gh release create vX.Y.Z ...`
- [ ] Submit to MCP Registry: `~/.local/bin/mcp-publisher.exe publish`
- [ ] (Optional) Build MCPB: `npm run pack:mcpb`
- [ ] (Optional) Upload MCPB to GitHub release

## Troubleshooting

### "You cannot publish over the previously published versions"
You're trying to publish a version that already exists on npm. Bump the version number.

### "Registry validation failed" / description error
The `description` in `server.json` must be <= 100 characters.

### "You do not have permission to publish this server"
Case sensitivity issue. The `name` in `server.json` must use exact GitHub capitalization:
- ✓ `io.github.PromptPartner/bexio-mcp-server`
- ✗ `io.github.promptpartner/bexio-mcp-server`

### "Invalid or expired Registry JWT token"
Re-authenticate: `~/.local/bin/mcp-publisher.exe login github`

### npm publish fails with 403
Check you're logged in to the correct npm account: `npm whoami`

### mcp-publisher not found
It's installed at `~/.local/bin/mcp-publisher.exe`. Either use full path or add to PATH.

To reinstall:
```bash
cd ~/.local/bin
curl -sL "https://github.com/modelcontextprotocol/registry/releases/latest/download/mcp-publisher_windows_amd64.tar.gz" | tar xz
```
