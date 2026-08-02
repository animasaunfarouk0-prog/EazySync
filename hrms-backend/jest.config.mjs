export default {
  testEnvironment: "node",
  globalSetup: "<rootDir>/tests/global-setup.mjs",
  setupFiles: ["<rootDir>/tests/setup-env.js"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup-after-env.js"],
  testTimeout: 30000,
  verbose: true,
};
