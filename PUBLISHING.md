# Publishing Guide

This document covers how to publish bexio-mcp-server to npm and the MCP Registry.

## Prerequisites

- Node.js 18+
- npm account with publish access to `@promptpartner` scope
- GitHub account (owner of `promptpartner` org)
- `mcp-publisher` CLI installed

## Files That Must Stay In Sync

When bumping versions, update these files:

| File | Fields to Update |
|------|------------------|
| `src/package.json` | `version` |
| `server.json` | `version` (root) and `packages[0].version` |
| `manifest.json` | `version` |
| `CHANGELOG.md` | Add new version section |

The `mcpName` in package.json and `name` in server.json must always match:
```
io.github.promptpartner/bexio-mcp-server
```

## Publishing Steps

### 1. Build the Package

```bash
cd src
npm run build
```

This compiles TypeScript, builds UI assets, and prepares the dist folder.

### 2. Test Locally (Optional)

```bash
npm link
bexio-mcp-server --help
```

### 3. Publish to npm

```bash
# Login if needed
npm login

# Publish (scoped packages need --access public)
npm publish --access public
```

Verify at: https://www.npmjs.com/package/@promptpartner/bexio-mcp-server

### 4. Create GitHub Release

```bash
# Tag the release
git tag v2.0.7
git push origin v2.0.7

# Create release on GitHub with CHANGELOG notes
gh release create v2.0.7 --title "v2.0.7" --notes-file CHANGELOG.md
```

Or create manually at: https://github.com/promptpartner/bexio-mcp-server/releases/new

### 5. Submit to MCP Registry

#### Install mcp-publisher (first time only)

Download from: https://github.com/modelcontextprotocol/registry/releases

Windows:
```powershell
# Download and extract mcp-publisher_windows_amd64.zip
# Add to PATH or run from download location
```

#### Authenticate with GitHub

```bash
mcp-publisher login github
```

Follow the device flow to authenticate.

#### Publish to Registry

```bash
mcp-publisher publish
```

This reads `server.json` and submits to the MCP Registry.

### 6. Build and Upload MCPB Bundle

```bash
cd src
npm run pack:mcpb
```

This creates `bexio-mcp-server-2.0.7.mcpb` in the project root.

Upload the `.mcpb` file to the GitHub release.

## Version Bump Checklist

- [ ] Update version in `src/package.json`
- [ ] Update version in `server.json` (both places)
- [ ] Update version in `manifest.json`
- [ ] Add changelog entry in `CHANGELOG.md`
- [ ] Build and test: `npm run build`
- [ ] Commit: `git commit -am "chore: bump to vX.Y.Z"`
- [ ] Publish to npm: `npm publish --access public`
- [ ] Tag: `git tag vX.Y.Z && git push origin vX.Y.Z`
- [ ] Create GitHub release
- [ ] Submit to MCP Registry: `mcp-publisher publish`
- [ ] Build MCPB: `npm run pack:mcpb`
- [ ] Upload MCPB to GitHub release

## Troubleshooting

### "Registry validation failed"
Ensure `mcpName` exists in `src/package.json` and matches `name` in `server.json`.

### "Invalid or expired Registry JWT token"
Re-run `mcp-publisher login github`.

### "You do not have permission"
The server name must start with `io.github.{your-github-username}/`.

### npm publish fails with 403
Check you're logged in to the correct npm account with publish rights to the scope.
