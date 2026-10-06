import "./commands";

Cypress.on("uncaught:exception", (error) => {
  if (error.message.includes("ResizeObserver loop")) {
    return false;
  }
});

if (Cypress.spec.relative.replaceAll("\\", "/").includes("/e2e/mocked/")) {
  require("./mocked");
}
