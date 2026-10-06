const { defineConfig } = require("cypress");

module.exports = defineConfig({
  video: false,
  allowCypressEnv: false,
  screenshotsFolder: "cypress/artifacts/frontend",
  viewportWidth: 1440,
  viewportHeight: 1000,
  e2e: {
    baseUrl: "http://127.0.0.1:3100",
    specPattern: "cypress/e2e/mocked/**/*.cy.js",
    supportFile: "cypress/support/mocked.js",
    defaultCommandTimeout: 10000
  }
});
