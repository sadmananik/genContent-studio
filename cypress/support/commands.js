Cypress.Commands.add("apiRequest", (method, path, body, token, extraHeaders = {}) => {
  return cy.request({
    body,
    failOnStatusCode: false,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extraHeaders },
    method,
    url: `${Cypress.env("apiUrl")}${path}`
  });
});

Cypress.Commands.add("registerUser", (user, runId = Cypress.env("runId")) => {
  const email = `${runId}_${user.email || user.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}@example.test`;
  return cy
    .apiRequest("POST", "/api/auth/register", {
      email,
      name: user.name,
      password: user.password
    })
    .then((response) => ({ ...response, email }));
});

Cypress.Commands.add("loginUser", (email, password) => {
  return cy.apiRequest("POST", "/api/auth/login", { email, password }).then((response) => {
    expect(response.status).to.eq(200);
    window.localStorage.setItem("gencontent-auth", JSON.stringify(response.body));
    return response.body;
  });
});

Cypress.Commands.add("createProject", (token, project) => {
  return cy.apiRequest("POST", "/api/projects", { ...project }, token).then((response) => {
    expect(response.status).to.eq(201);
    return response.body;
  });
});

Cypress.Commands.add("getTestMailbox", () => {
  return cy.apiRequest("GET", "/api/test/mailbox", undefined, undefined, {
    "x-e2e-test-secret": Cypress.env("e2eTestSecret")
  });
});

Cypress.Commands.add("cleanupE2EData", () => cy.task("cleanupE2EData", Cypress.env("runId")));
