import "./commands";

Cypress.on("uncaught:exception", (error) => {
  if (error.message.includes("ResizeObserver loop")) {
    return false;
  }
});
