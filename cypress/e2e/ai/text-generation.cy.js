describe("AI text generation", () => {
  let runId;
  let testData;
  let ownerEmail;

  before(() => {
    cy.fixture("test-data").then((data) => {
      testData = data;
      runId = `e2e_${Date.now().toString(36)}`;
      Cypress.env("runId", runId);
      cy.loginVerifiedUser(data.owner, runId).then(({ email }) => {
        ownerEmail = email;
      });
    });
  });

  after(() => cy.cleanupE2EData());

  beforeEach(() => {
    cy.intercept("POST", "**/api/ai/generate-text", {
      statusCode: 200,
      body: {
        text: "This is a deterministic Cypress test AI response.",
        model: "cypress-mock"
      }
    }).as("generateText");
    cy.loginUser(ownerEmail, testData.owner.password);
    cy.visit("/editor?type=text");
  });

  it("displays a mocked response without calling OpenAI", () => {
    cy.get("textarea").first().clear().type("Write a Cypress test response.");
    cy.contains("Generate").click();
    cy.wait("@generateText");
    cy.contains("This is a deterministic Cypress test AI response.").should("be.visible");
  });
});
