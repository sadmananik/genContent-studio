import { project } from "./fixtures";

describe("projects and dashboard", () => {
  it("renders dashboard projects returned by the API", () => {
    cy.visitFrontend("/dashboard");
    cy.wait("@projects");
    cy.contains(project.title).should("be.visible");
  });

  it("validates and creates a project, then opens its workspace", () => {
    cy.intercept("POST", "**/api/projects", {
      statusCode: 201,
      body: { ...project, title: "New draft" }
    }).as("create");
    cy.visitFrontend("/projects");
    cy.contains("button", /create.*project/i).click();
    cy.get("form button[type=submit]").click();
    cy.get("input[name=title]").should("have.attr", "aria-invalid", "true");
    cy.get("@create.all").should("have.length", 0);
    cy.get("input[name=title]").type("New draft");
    cy.get("form button[type=submit]").click();
    cy.wait("@create").its("request.body").should("include", { title: "New draft", type: "text" });
    cy.location("pathname").should("eq", "/editor");
    cy.location("search").should("include", project._id);
  });

  it("updates and deletes a project through its action menu", () => {
    cy.intercept("PUT", `**/api/projects/${project._id}`, {
      ...project,
      title: "Renamed draft"
    }).as("update");
    cy.intercept("DELETE", `**/api/projects/${project._id}`, { statusCode: 204 }).as("delete");
    cy.visitFrontend("/projects");
    cy.get(`[aria-label="${project.title} actions"]`).click();
    cy.contains("button", /^edit$/i).click();
    cy.get("input[name=title]").clear().type("Renamed draft");
    cy.get("form button[type=submit]").click();
    cy.wait("@update").its("request.body.title").should("eq", "Renamed draft");
    cy.get('[aria-label="Renamed draft actions"]').click();
    cy.contains("button", /^delete$/i).click();
    cy.contains("button", /delete project/i).click();
    cy.wait("@delete");
    cy.get('[aria-label="Renamed draft actions"]').should("not.exist");
  });

  it("keeps the project when deletion fails", () => {
    cy.intercept("DELETE", `**/api/projects/${project._id}`, {
      statusCode: 500,
      body: { message: "Deletion unavailable" }
    }).as("delete");
    cy.visitFrontend("/projects");
    cy.get(`[aria-label="${project.title} actions"]`).click();
    cy.contains("button", /^delete$/i).click();
    cy.contains("button", /delete project/i).click();
    cy.wait("@delete");
    cy.contains("Deletion unavailable").should("be.visible");
    cy.get(`[aria-label="${project.title} actions"]`).should("exist");
  });

  it("shows project loading and API errors", () => {
    cy.intercept("GET", "**/api/projects", {
      delay: 700,
      statusCode: 500,
      body: { message: "Projects unavailable" }
    }).as("failedProjects");
    cy.visitFrontend("/projects");
    cy.contains(/loading projects/i).should("be.visible");
    cy.wait("@failedProjects");
    cy.contains("Projects unavailable").should("be.visible");
  });
});

describe("publishing projects", () => {
  it("publishes a project as a template", () => {
    cy.intercept("POST", "**/api/templates/projects/*", (req) =>
      req.reply({ ...req.body, id: "published-template", projectType: "text" })
    ).as("publish");
    cy.visitFrontend("/projects");
    cy.get(`[aria-label="${project.title} actions"]`).click();
    cy.contains("button", /^publish as template$/i).click();
    cy.get('[role="dialog"]').within(() => {
      cy.contains("label", "Template Title").find("input").clear().type("Published draft");
      cy.contains("label", "Public").click();
      cy.contains("button", "Publish Template").click();
    });
    cy.wait("@publish")
      .its("request.body")
      .should("include", { title: "Published draft", visibility: "public" });
    cy.contains("Template published").should("be.visible");
  });

  it("reports publishing errors and keeps the form open", () => {
    cy.intercept("POST", "**/api/templates/projects/*", {
      statusCode: 500,
      body: { message: "Publishing unavailable" }
    }).as("publish");
    cy.visitFrontend("/projects");
    cy.get(`[aria-label="${project.title} actions"]`).click();
    cy.contains("button", /^publish as template$/i).click();
    cy.get('[role="dialog"]').contains("button", "Publish Template").click();
    cy.wait("@publish");
    cy.contains("Publishing unavailable").should("be.visible");
    cy.get('[role="dialog"]').should("be.visible");
  });
});
