const { spawn } = require("node:child_process");
const path = require("node:path");
const net = require("node:net");
const { setTimeout: delay } = require("node:timers/promises");

async function main() {
  // Refuse to use an unrelated server already occupying the test port.
  await new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", reject);
    probe.listen(3100, "127.0.0.1", () => probe.close(resolve));
  });
  const env = {
    ...process.env,
    FRONTEND_INTEGRATION_TEST: "true",
    NEXT_PUBLIC_API_BASE_URL: "http://127.0.0.1:4100"
  };
  delete env.ELECTRON_RUN_AS_NODE;
  delete env.ELECTRON_NO_ATTACH_CONSOLE;
  const server = spawn(
    process.execPath,
    [require.resolve("next/dist/bin/next"), "dev", "--hostname", "127.0.0.1", "--port", "3100"],
    {
      cwd: path.resolve(__dirname, "../packages/frontend"),
      env,
      stdio: "inherit",
      detached: process.platform !== "win32"
    }
  );
  let cypress;
  const stop = () => {
    cypress?.kill("SIGTERM");
    if (server.exitCode === null) {
      if (process.platform === "win32") server.kill("SIGTERM");
      else {
        try {
          process.kill(-server.pid, "SIGTERM");
        } catch (error) {
          if (error.code !== "ESRCH") throw error;
        }
      }
    }
  };
  process.once("SIGINT", () => {
    stop();
    process.exit(130);
  });
  process.once("SIGTERM", () => {
    stop();
    process.exit(143);
  });
  try {
    let ready = false;
    for (let i = 0; i < 90; i++) {
      if (server.exitCode !== null)
        throw new Error("Frontend test server exited before becoming ready");
      try {
        const response = await fetch("http://127.0.0.1:3100/login", {
          signal: AbortSignal.timeout(2000)
        });
        if (response.ok) {
          ready = true;
          break;
        }
      } catch {
        /* Server is still starting. */
      }
      await delay(1000);
    }
    if (!ready) throw new Error("Frontend test server did not become ready");
    cypress = spawn(
      process.execPath,
      [
        path.join(path.dirname(require.resolve("cypress/package.json")), "bin/cypress"),
        "run",
        "--config-file",
        "cypress.mocked.config.js",
        ...process.argv.slice(2)
      ],
      { env, stdio: "inherit" }
    );
    process.exitCode = await new Promise((resolve, reject) => {
      cypress.once("error", reject);
      cypress.once("exit", (code) => resolve(code ?? 1));
    });
  } finally {
    stop();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
