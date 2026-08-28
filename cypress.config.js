const { defineConfig } = require("cypress");
const dotenv = require("dotenv");
const { execFile } = require("child_process");
const crypto = require("crypto");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "packages/backend/.env.test") });

module.exports = defineConfig({
  e2e: {
    baseUrl: process.env.FRONTEND_URL || "http://localhost:3000",
    env: {
      apiUrl: process.env.API_URL || "http://localhost:4000",
      e2eTestSecret: process.env.E2E_TEST_SECRET || "",
      runId:
        process.env.E2E_RUN_ID ||
        `e2e_${Date.now().toString(36)}_${crypto.randomBytes(3).toString("hex")}`
    },
    setupNodeEvents(on, config) {
      on("task", {
        cleanupE2EData(runId) {
          return new Promise((resolve, reject) => {
            execFile(
              process.execPath,
              [path.resolve(__dirname, "packages/backend/scripts/cleanupE2EData.js"), runId],
              { env: process.env },
              (error, stdout, stderr) => {
                if (stdout) process.stdout.write(stdout);
                if (error) return reject(new Error(stderr || error.message));
                resolve(null);
              }
            );
          });
        }
      });
      return config;
    }
  }
});
