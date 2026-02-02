import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [viteSingleFile()],
  root: ".",
  build: {
    outDir: "../dist/ui",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        "invoice-preview": "src/ui/invoice-preview/invoice-preview.html",
        "contact-card": "src/ui/contact-card/contact-card.html",
        "dashboard": "src/ui/dashboard/dashboard.html",
      },
    },
  },
});
