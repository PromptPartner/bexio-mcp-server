import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { resolve } from "path";
import { readdirSync, existsSync } from "fs";

// Get list of UI entry points dynamically
function getUiEntries(): Record<string, string> {
  const uiDir = resolve(__dirname, "ui");
  if (!existsSync(uiDir)) return {};

  const entries: Record<string, string> = {};
  const dirs = readdirSync(uiDir, { withFileTypes: true })
    .filter(d => d.isDirectory());

  for (const dir of dirs) {
    const htmlPath = resolve(uiDir, dir.name, `${dir.name}.html`);
    if (existsSync(htmlPath)) {
      entries[dir.name] = htmlPath;
    }
  }
  return entries;
}

// One panel per build (UI_ENTRY, set by scripts/build-ui.mjs). With several inputs in
// one build, Rollup hoists shared code (the MCP Apps client, esc()) into a separate
// chunk the single-file plugin cannot inline, and every panel imported a file that was
// never shipped. build-ui.mjs fails the build if a panel is not self-contained.
const allEntries = getUiEntries();
const only = process.env["UI_ENTRY"];
if (only && !allEntries[only]) throw new Error(`Unknown UI_ENTRY: ${only}`);
const input = only ? { [only]: allEntries[only] } : allEntries;

export default defineConfig({
  plugins: [
    viteSingleFile({
      // Build options are set explicitly below
      useRecommendedBuildConfig: false,
      removeViteModuleLoader: false,
      deleteInlinedFiles: true,
    }),
  ],
  root: ".",
  base: "./",
  build: {
    outDir: "./dist/ui",
    // build-ui.mjs empties dist/ui once, then runs one build per panel into it
    emptyOutDir: !only,
    // Inline all assets
    assetsInlineLimit: () => true,
    // Emit all CSS as single file for inlining
    cssCodeSplit: false,
    // Assets in root, not assets/ subdir
    assetsDir: "",
    rollupOptions: {
      input,
      // Single entry: pull any dynamic import into the one file as well
      output: only ? { inlineDynamicImports: true } : undefined,
    },
  },
});
