/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

/** @type {import('jest').Config} */
const config = {
  setupFiles: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jsdom",
  transformIgnorePatterns: [
    "/node_modules/(?!((@)?glennsl|bs-platform|bs-webapi|bs-webworkers|re-debouncer)/)"
  ],
};

export default config;
