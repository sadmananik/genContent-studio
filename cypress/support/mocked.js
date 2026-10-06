import { user, project, template } from "../e2e/mocked/fixtures";

beforeEach(() => {
  // Fail closed: no API request can reach a real backend. Unexpected calls fail the test.
  cy.intercept("**/api/**", (req) => {
    throw new Error(`Unmocked API request: ${req.method} ${req.url}`);
  });
  cy.intercept("**/socket.io/**", {
    statusCode: 503,
    body: "Realtime server intentionally absent"
  });
  cy.intercept("GET", "**/api/users/me", user).as("me");
  cy.intercept("GET", "**/api/users", [user]);
  cy.intercept("GET", "**/api/projects", [project]).as("projects");
  cy.intercept("GET", "**/api/projects/shared", []).as("shared");
  cy.intercept("GET", `**/api/projects/${project._id}`, project).as("project");
  cy.intercept("GET", "**/api/projects/*/chats", []).as("chats");
  cy.intercept("GET", "**/api/projects/*/audit-history*", []);
  cy.intercept("POST", "**/api/projects/*/audit-history", { statusCode: 201, body: {} });
  cy.intercept("GET", "**/api/text-content/*", { content: "", updatedAt: project.updatedAt });
  cy.intercept("GET", "**/api/image-content/*", { canvasState: {}, generationPrompt: "" });
  cy.intercept("GET", "**/api/chats/favourites", []).as("favourites");
  cy.intercept("GET", "**/api/templates*", [template]).as("templates");
  cy.intercept("GET", "**/api/templates/recent", []);
  cy.intercept("GET", "**/api/templates/mine", [template]);
  cy.intercept("GET", "**/api/templates/favorites", []);
  cy.intercept("GET", "**/api/templates/tags*", []);
});

Cypress.Commands.add("visitFrontend", (url, authenticated = true) => {
  cy.visit(url, {
    onBeforeLoad(win) {
      win.localStorage.clear();
      win.sessionStorage.clear();
      if (authenticated)
        win.sessionStorage.setItem(
          "gencontent-auth",
          JSON.stringify({ token: "frontend-test-token", user, rememberMe: false })
        );
    }
  });
});
