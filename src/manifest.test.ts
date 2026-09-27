import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { getAllToolDefinitions } from "./tools/index.js";

/**
 * The .mcpb manifest lists a few representative tools. Each must exist, and the UI
 * panel tools only exist when BEXIO_ENABLE_UI is on, so the manifest must expose that
 * switch (a Desktop user otherwise could never reach the panels it advertises).
 */
const manifest = JSON.parse(readFileSync(fileURLToPath(new URL("../manifest.json", import.meta.url)), "utf-8"));
const UI_TOOLS = new Set(["preview_invoice", "show_contact_card", "show_dashboard"]);

describe("manifest.json", () => {
  it("lists only tools the server really has, and says it generates the rest", () => {
    const names = new Set(getAllToolDefinitions().map((t) => t.name));
    const unknown = manifest.tools.map((t: { name: string }) => t.name).filter((n: string) => !names.has(n) && !UI_TOOLS.has(n));
    expect(unknown).toEqual([]);
    expect(manifest.tools_generated).toBe(true);
  });

  it("lets a Desktop user switch on the UI panels it advertises", () => {
    expect(manifest.server.mcp_config.env.BEXIO_ENABLE_UI).toBe("${user_config.enable_ui}");
    expect(manifest.user_config.enable_ui).toMatchObject({ type: "boolean", default: false });
  });
});
