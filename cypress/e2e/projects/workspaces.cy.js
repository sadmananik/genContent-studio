describe("project workspaces", () => {
  let runId;
  let testData;
  let token;

  before(() => {
    cy.fixture("test-data").then((data) => {
      testData = data;
      runId = `e2e_${Date.now().toString(36)}`;
      Cypress.env("runId", runId);
      return cy.registerUser(data.owner, runId).then(({ email }) => {
        return cy.getTestMailbox().then((mailboxResponse) => {
          const emailMessage = mailboxResponse.body.find((mail) => mail.email === email);
          const tokenValue = new URL(emailMessage.text.match(/http[^\s]+/)[0]).searchParams.get(
            "token"
          );
          return cy.apiRequest("POST", "/api/auth/verify-email", { token: tokenValue }).then(() =>
            cy
              .apiRequest("POST", "/api/auth/login", { email, password: data.owner.password })
              .then((response) => {
                token = response.body.token;
              })
          );
        });
      });
    });
  });

  after(() => cy.cleanupE2EData());

  it("creates a text project and opens the text workspace", () => {
    cy.createProject(token, {
      category: testData.textProject.category,
      description: testData.textProject.description,
      title: `${runId}_${testData.textProject.title}`,
      type: "text"
    }).then((project) => {
      window.localStorage.setItem("gencontent-auth", JSON.stringify({ token }));
      cy.visit(`/editor?type=text&projectId=${project.id || project._id}`);
      cy.contains("Start writing your content here...").should("be.visible");
    });
  });
});
