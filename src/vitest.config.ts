import { defineConfig } from "vitest/config";

// Unit tests run in Node. Test files live next to the code as *.test.ts and are
// excluded from the tsc build (see tsconfig.json) so they never ship in dist/.
export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
  },
});
