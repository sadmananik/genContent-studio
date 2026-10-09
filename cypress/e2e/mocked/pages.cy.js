import { user, project, sharedProject } from "./fixtures";

describe("account and secondary pages", () => {
  it("renders the public landing page and links to sign in", () => {
    cy.visitFrontend("/", false);
    cy.get('a[href="/login"]').first().click();
    cy.location("pathname").should("eq", "/login");
  });

  it("updates profile data through the store and API", () => {
    cy.intercept("PUT", "**/api/users/me", { ...user, name: "Updated Creator" }).as("saveProfile");
    cy.visitFrontend("/profile");
    cy.get("input[name=name]").should("have.value", user.name).clear().type("Updated Creator");
    cy.contains("button", "Save Changes").click();
    cy.wait("@saveProfile").its("request.body.name").should("eq", "Updated Creator");
    cy.contains("h2", "Updated Creator").scrollIntoView().should("be.visible");
  });

  it("shows profile save failures and keeps the entered name", () => {
    cy.intercept("PUT", "**/api/users/me", {
      statusCode: 500,
      body: { message: "Profile update unavailable" }
    }).as("saveProfile");
    cy.visitFrontend("/profile");
    cy.get("input[name=name]").should("have.value", user.name).clear().type("Unsaved Creator");
    cy.contains("button", "Save Changes").click();
    cy.wait("@saveProfile");
    cy.contains("Profile update unavailable").should("be.visible");
    cy.get("input[name=name]").should("have.value", "Unsaved Creator");
  });

  it("persists the selected theme in settings", () => {
    cy.visitFrontend("/settings");
    cy.get("select").select("dark");
    cy.get("html").should("have.attr", "data-theme", "dark");
    cy.reload();
    cy.get("select").should("have.value", "dark");
  });

  it("requests a password change from settings", () => {
    cy.intercept("POST", "**/api/auth/request-password-change", {
      body: { message: "Check your email" }
    }).as("passwordChange");
    cy.visitFrontend("/settings");
    cy.contains("button", /change password/i).click();
    cy.contains("button", /send email/i).click();
    cy.wait("@passwordChange");
    cy.contains(/password.*email|email.*sent/i).should("be.visible");
  });

  it("shows favourite responses and removes one", () => {
    const chat = {
      _id: "507f1f77bcf86cd799439020",
      project,
      prompt: "Draft a headline",
      response: "Favourite generated headline",
      contentType: "text",
      isFavourite: true,
      createdAt: project.createdAt
    };
    cy.intercept("GET", "**/api/chats/favourites", [chat]);
    cy.intercept("PATCH", `**/api/chats/${chat._id}/favourite`, { ...chat, isFavourite: false }).as(
      "removeFavourite"
    );
    cy.visitFrontend("/favorites");
    cy.contains(chat.response).should("be.visible");
    cy.contains("button", /remove/i).click();
    cy.wait("@removeFavourite");
    cy.contains(chat.response).should("not.exist");
  });

  it("shows favourite API errors", () => {
    cy.intercept("GET", "**/api/chats/favourites", {
      statusCode: 500,
      body: { message: "Favourites unavailable" }
    });
    cy.visitFrontend("/favorites");
    cy.contains("Favourites unavailable").should("be.visible");
  });

  it("opens a shared viewer project with read-only access", () => {
    cy.intercept("GET", "**/api/projects/shared", [
      {
        ...sharedProject,
        accessLevel: "viewer",
        canEdit: false,
        canDelete: false,
        currentUserRole: "collaborator"
      }
    ]);
    cy.visitFrontend("/shared");
    cy.contains(project.title).should("be.visible");
    cy.contains("button", "Open Project").click();
    cy.location("search").should("include", "access=view");
  });

  it("leaves a shared project and removes it from the list", () => {
    cy.intercept("GET", "**/api/projects/shared", [sharedProject]);
    cy.intercept("DELETE", "**/api/projects/*/collaborators/me", {
      body: { message: "Left project" }
    }).as("leave");
    cy.visitFrontend("/shared");
    cy.get(`[aria-label="${project.title} actions"]`).click();
    cy.contains("button", /leave project/i).click();
    cy.get('[role="dialog"]').contains("button", /leave/i).click();
    cy.wait("@leave");
    cy.get(`[aria-label="${project.title} actions"]`).should("not.exist");
  });

  // These two routes currently contain static demo content, not working API flows.
  for (const [route, heading] of [
    ["/chat-history", "AI Chat History"],
    ["/collaboration", "Summer Sale Campaign"]
  ]) {
    it(`renders the ${route} page behind authentication`, () => {
      cy.visitFrontend(route);
      cy.contains("h2", heading).should("be.visible");
    });
  }
});
