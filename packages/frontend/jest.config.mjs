import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

export default createJestConfig({
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/test/setup.js"],
  testMatch: ["<rootDir>/test/**/*.test.js"],
  clearMocks: true,
  collectCoverageFrom: ["src/components/**/*.js", "src/store/**/*.js", "src/lib/apiClient.js"],
  coverageDirectory: "../../coverage/frontend"
});
