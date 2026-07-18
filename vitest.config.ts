import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/api/**/*.test.ts"],
    globalSetup: ["tests/api/global-setup.ts"],
    testTimeout: 30_000,
    hookTimeout: 120_000,
    // Sequential test files so rate-limit and duplicate-guard tests are deterministic
    fileParallelism: false,
  },
});
