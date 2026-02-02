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

export default defineConfig({
  plugins: [
    viteSingleFile({
      // Disable recommended config to allow multiple entry points
      useRecommendedBuildConfig: false,
      removeViteModuleLoader: false,
      deleteInlinedFiles: true,
    }),
  ],
  root: ".",
  base: "./",
  build: {
    outDir: "../dist/ui",
    emptyOutDir: true,
    // Inline all assets
    assetsInlineLimit: () => true,
    // Emit all CSS as single file for inlining
    cssCodeSplit: false,
    // Assets in root, not assets/ subdir
    assetsDir: "",
    rollupOptions: {
      input: getUiEntries(),
      // No inlineDynamicImports since we have multiple entries
    },
  },
});
