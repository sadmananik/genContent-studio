describe("AI text generation", () => {
  beforeEach(() => {
    cy.intercept("POST", "**/api/ai/generate-text", {
      statusCode: 200,
      body: {
        text: "This is a deterministic Cypress test AI response.",
        model: "cypress-mock"
      }
    }).as("generateText");
    cy.visit("/editor?type=text");
  });

  it("displays a mocked response without calling OpenAI", () => {
    cy.get("textarea").first().clear().type("Write a Cypress test response.");
    cy.contains("Generate").click();
    cy.wait("@generateText");
    cy.contains("This is a deterministic Cypress test AI response.").should("be.visible");
  });
});
