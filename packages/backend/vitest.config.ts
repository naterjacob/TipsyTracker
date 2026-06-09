import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      // Report to terminal + an lcov/html report under coverage/.
      // json-summary + json are required by the GitHub PR coverage-report action.
      reporter: ["text", "text-summary", "html", "lcov", "json-summary", "json"],
      reportsDirectory: "./coverage",
      // Scope coverage to the "services"/model layer that operates on the DB.
      // Route functions in index.ts are intentionally excluded (they only wire
      // HTTP requests to these tested DAL functions).
      include: ["src/dal/**/*.ts"],
      exclude: ["src/**/*.d.ts"],
    },
  },
});
