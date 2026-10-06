import { project } from "./fixtures";

const editorUrl = `/editor?type=text&projectId=${project._id}`;

describe("content workspaces", () => {
  it("generates text, persists chat history, and saves editor content", () => {
    cy.intercept("POST", "**/api/ai/generate-text", {
      delay: 500,
      body: { text: "Generated integration content", model: "mock" }
    }).as("generate");
    cy.intercept("POST", "**/api/chats", (req) =>
      req.reply({ ...req.body, _id: "507f1f77bcf86cd799439020", createdAt: project.createdAt })
    ).as("saveChat");
    cy.intercept("PUT", "**/api/text-content", (req) =>
      req.reply({ ...req.body, updatedAt: project.updatedAt })
    ).as("saveContent");
    cy.visitFrontend(editorUrl);
    cy.get(".ProseMirror").should("be.visible");
    cy.get("textarea").first().clear().type("Write an introduction");
    cy.contains("button", /^generate$/i)
      .click()
      .should("be.disabled");
    cy.wait("@generate")
      .its("request.body")
      .should("include", { prompt: "Write an introduction", project: project._id });
    cy.wait("@saveChat");
    cy.get(".ProseMirror").should("contain.text", "Generated integration content");
    cy.contains("button", /^save$/i).click();
    cy.wait("@saveContent")
      .its("request.body.content")
      .should("include", "Generated integration content");
  });

  it("shows AI failures and enables retry", () => {
    cy.intercept("POST", "**/api/ai/generate-text", {
      statusCode: 502,
      body: { message: "AI provider unavailable" }
    }).as("generate");
    cy.visitFrontend(editorUrl);
    cy.get("textarea").first().clear().type("Write an introduction");
    cy.contains("button", /^generate$/i).click();
    cy.wait("@generate");
    cy.contains("AI provider unavailable").should("be.visible");
    cy.contains("button", /^generate$/i).should("not.be.disabled");
  });

  it("retains editor text when saving fails", () => {
    cy.intercept("GET", `**/api/text-content/${project._id}`, {
      delay: 500,
      body: { content: "<p>Existing draft</p>", updatedAt: project.updatedAt }
    }).as("loadContent");
    cy.intercept("PUT", "**/api/text-content", {
      statusCode: 500,
      body: { message: "Save unavailable" }
    }).as("save");
    cy.visitFrontend(editorUrl);
    cy.wait(["@project", "@loadContent", "@chats"]);
    cy.get(".ProseMirror")
      .should("be.visible")
      .and("have.attr", "contenteditable", "true")
      .and("contain.text", "Existing draft");
    cy.get('.ProseMirror[contenteditable="true"]').type("{end} Keep this draft");
    cy.contains("button", /^save$/i).click();
    cy.wait("@save").its("request.body.content").should("include", "Keep this draft");
    cy.contains("Save unavailable").should("be.visible");
    cy.get(".ProseMirror").should("contain.text", "Keep this draft");
  });

  it("disables editing and saving for viewers", () => {
    cy.intercept("GET", `**/api/projects/${project._id}`, {
      ...project,
      canEdit: false,
      canManageSharing: false,
      accessLevel: "viewer",
      currentUserRole: "collaborator"
    });
    cy.visitFrontend(editorUrl + "&access=view");
    cy.get(".ProseMirror").should("have.attr", "contenteditable", "false");
    cy.contains("button", /^save$/i).should("be.disabled");
    cy.contains("button", /^generate$/i).should("be.disabled");
  });

  it("sends project invitations from the workspace", () => {
    cy.intercept("PATCH", "**/api/projects/*/invite", project).as("invite");
    cy.visitFrontend(editorUrl);
    cy.contains("button", /^share$/i).click();
    cy.get("#invite-email").type("teammate@example.test");
    cy.contains("button", /invite/i).click();
    cy.wait("@invite").its("request.body.email").should("eq", "teammate@example.test");
  });

  it("loads an image workspace with a canvas", () => {
    cy.intercept("GET", `**/api/projects/${project._id}`, { ...project, type: "image" });
    cy.visitFrontend(`/editor?type=image&projectId=${project._id}`);
    cy.get("canvas").should("be.visible");
    cy.contains("button", /^save$/i).should("be.visible");
  });
});
