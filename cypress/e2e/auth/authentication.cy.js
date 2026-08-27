describe("authentication", () => {
  let runId;
  let testData;

  before(() => {
    cy.fixture("test-data").then((data) => {
      testData = data;
      runId = `e2e_${Date.now().toString(36)}`;
      Cypress.env("runId", runId);
    });
  });

  after(() => cy.cleanupE2EData());

  it("registers, verifies, and logs in a user", () => {
    cy.registerUser(testData.owner, runId).then(({ email }) => {
      cy.getTestMailbox().then((mailboxResponse) => {
        expect(mailboxResponse.status).to.eq(200);
        const verificationEmail = mailboxResponse.body.find((mail) => mail.email === email);
        expect(verificationEmail).to.exist;
        const token = new URL(verificationEmail.text.match(/http[^\s]+/)[0]).searchParams.get(
          "token"
        );

        cy.apiRequest("POST", "/api/auth/verify-email", { token }).then((verifyResponse) => {
          expect(verifyResponse.status).to.eq(200);
        });
        cy.loginUser(email, testData.owner.password);
        cy.visit("/dashboard");
        cy.contains(testData.owner.name).should("be.visible");
      });
    });
  });
});
