describe("settings", () => {
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
    cy.loginUser(ownerEmail, testData.owner.password);
  });

  it("opens the settings page and exposes appearance choices", () => {
    cy.visit("/settings");
    cy.contains("Appearance").should("be.visible");
    cy.get("select").should("contain", "Light").and("contain", "Dark").and("contain", "System");
  });
});
