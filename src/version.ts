/**
 * The server version reported over MCP (stdio initialize, HTTP health/initialize).
 * Inlined because the MCPB bundle ships a minimal dist/package.json without a
 * version. Bump with package.json, package-lock.json, server.json and manifest.json;
 * version.test.ts fails if they disagree.
 */
export const SERVER_VERSION = "2.5.0";
