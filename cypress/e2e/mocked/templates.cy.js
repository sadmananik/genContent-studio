import { template, project } from "./fixtures";

describe("template library", () => {
  it("previews and uses a template to create a project", () => {
    cy.intercept("POST", `**/api/templates/${template.id}/use`, {
      statusCode: 201,
      body: { project, template: { id: template.id, useCount: 1 } }
    }).as("use");
    cy.visitFrontend("/templates");
    cy.contains("button", "Preview").click();
    cy.contains("Template draft").should("be.visible");
    cy.get('[role="dialog"]').contains("button", "Use Template").click();
    cy.wait("@use");
    cy.location("pathname").should("eq", "/editor");
  });

  it("adds and removes a template favourite", () => {
    cy.intercept("PUT", "**/api/templates/*/favorite", { body: { isFavorite: true } }).as(
      "favorite"
    );
    cy.intercept("DELETE", "**/api/templates/*/favorite", { body: { isFavorite: false } }).as(
      "unfavorite"
    );
    cy.visitFrontend("/templates");
    cy.get(`[aria-label="Add ${template.title} to favorites"]`).click();
    cy.wait("@favorite");
    cy.get(`[aria-label="Remove ${template.title} from favorites"]`).click();
    cy.wait("@unfavorite");
    cy.get(`[aria-label="Add ${template.title} to favorites"]`).should("be.visible");
  });

  it("updates upvote and downvote state from API responses", () => {
    cy.intercept("POST", "**/api/templates/*/vote", (req) =>
      req.reply({
        upvoteCount: req.body.voteType === "up" ? 1 : 0,
        downvoteCount: req.body.voteType === "down" ? 1 : 0,
        currentUserVote: req.body.voteType
      })
    ).as("vote");
    cy.visitFrontend("/templates");
    cy.get(`[aria-label="Upvote ${template.title}"]`).click();
    cy.wait("@vote").its("request.body.voteType").should("eq", "up");
    cy.get(`[aria-label="Upvote ${template.title}"]`).should("have.attr", "aria-pressed", "true");
    cy.get(`[aria-label="Downvote ${template.title}"]`).click();
    cy.wait("@vote").its("request.body.voteType").should("eq", "down");
    cy.get(`[aria-label="Downvote ${template.title}"]`).should("have.attr", "aria-pressed", "true");
  });

  it("reports vote failures without selecting the vote", () => {
    cy.intercept("POST", "**/api/templates/*/vote", {
      statusCode: 500,
      body: { message: "Voting unavailable" }
    });
    cy.visitFrontend("/templates");
    cy.get(`[aria-label="Upvote ${template.title}"]`).click();
    cy.contains("Voting unavailable").should("be.visible");
    cy.get(`[aria-label="Upvote ${template.title}"]`).should("have.attr", "aria-pressed", "false");
  });

  it("sends search filters and renders an empty result", () => {
    cy.visitFrontend("/templates");
    cy.wait("@templates");
    cy.intercept("GET", "**/api/templates?*", []).as("search");
    cy.get('input[placeholder="Search templates..."]').type("missing");
    cy.wait("@search").its("request.url").should("include", "search=missing");
    cy.contains("No templates found").should("be.visible");
  });
});
