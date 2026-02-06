# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.11] - 2026-02-06

### Changed
- Restructured README with clearer install instructions
- MCPB extension download from Releases is now the primary install option
- Added Claude Desktop install path (Extensions > Advanced Settings > Install Extension)

## [2.0.9] - 2026-02-02

### Fixed
- Corrected `mcpName` case to match GitHub organization (`PromptPartner`)
- Shortened server.json description to meet registry 100-char limit

## [2.0.8] - 2026-02-02

### Added
- MCP Registry support with `mcpName` identifier
- `server.json` manifest for registry submission
- `PUBLISHING.md` guide for release workflow

## [2.0.0] - 2026-02-02

### Added
- Complete Bexio API coverage with 221 tools across all domains
- Interactive UI previews for invoices, contacts, and dashboard
- Swiss QR-bill and IBAN payment support (ISO 20022 compliant)
- Project management with milestones, work packages, and time tracking
- Accounting tools: chart of accounts, manual entries, VAT periods
- Purchase cycle: bills, expenses, purchase orders, outgoing payments
- File management with upload/download capabilities
- Payroll tools with automatic module detection
- MCPB bundle for one-click Claude Desktop installation
- Dual transport: stdio (Claude Desktop) and HTTP (n8n/automation)

### Changed
- Complete rewrite with MCP SDK 1.25.2
- Modular architecture with domain-organized code
- Zod 3.25.76 for improved validation

### Technical
- 221 tools organized into 10 domain modules
- TypeScript with strict mode
- Vitest for testing
- Vite for UI bundling

## [1.0.0] - 2025

Initial implementation by [Sebastian Bryner](https://www.linkedin.com/in/sebastian-bryner/) of [bryner.tech](https://bryner.tech/).

### Added
- Initial Bexio MCP server with 83 tools
- Core domains: contacts, invoices, quotes, orders, payments
- MCP SDK 0.5.0 integration
- Basic Bexio API client

[unreleased]: https://github.com/promptpartner/bexio-mcp-server/compare/v2.0.11...HEAD
[2.0.11]: https://github.com/promptpartner/bexio-mcp-server/compare/v2.0.10...v2.0.11
[2.0.9]: https://github.com/promptpartner/bexio-mcp-server/compare/v2.0.8...v2.0.9
[2.0.8]: https://github.com/promptpartner/bexio-mcp-server/compare/v2.0.0...v2.0.8
[2.0.0]: https://github.com/promptpartner/bexio-mcp-server/releases/tag/v2.0.0
[1.0.0]: https://bryner.tech/
