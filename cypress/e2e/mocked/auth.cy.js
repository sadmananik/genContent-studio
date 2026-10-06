import { user } from "./fixtures";

describe("authentication pages", () => {
  it("redirects unauthenticated users away from protected pages", () => {
    cy.visitFrontend("/projects", false);
    cy.location("pathname").should("eq", "/login");
    cy.get("input[name=email]").should("be.visible");
  });

  it("shows loading, logs in, persists the session, and logs out", () => {
    cy.intercept("POST", "**/api/auth/login", {
      delay: 500,
      body: { token: "signed-test-token", user }
    }).as("login");
    cy.visitFrontend("/login", false);
    cy.get("input[name=email]").type(user.email);
    cy.get("input[name=password]").type("Password123!");
    cy.get("input[name=rememberMe]").check();
    cy.get("button[type=submit]").click().should("be.disabled");
    cy.wait("@login")
      .its("request.body")
      .should("deep.equal", { email: user.email, password: "Password123!" });
    cy.location("pathname").should("eq", "/dashboard");
    cy.window().then((win) =>
      expect(JSON.parse(win.localStorage.getItem("gencontent-auth")).token).to.eq(
        "signed-test-token"
      )
    );
    cy.contains("button", user.name).click();
    cy.contains("button", /log\s*out/i).click();
    cy.location("pathname").should("eq", "/login");
    cy.window().then((win) => {
      expect(win.localStorage.getItem("gencontent-auth")).to.eq(null);
      expect(win.sessionStorage.getItem("gencontent-auth")).to.eq(null);
    });
  });

  it("shows login errors without navigating", () => {
    cy.intercept("POST", "**/api/auth/login", {
      statusCode: 401,
      body: { message: "Invalid credentials" }
    }).as("login");
    cy.visitFrontend("/login", false);
    cy.get("input[name=email]").type(user.email);
    cy.get("input[name=password]").type("WrongPassword123!");
    cy.get("button[type=submit]").click();
    cy.wait("@login");
    cy.contains("Invalid credentials").should("be.visible");
    cy.get("button[type=submit]").should("not.be.disabled");
    cy.location("pathname").should("eq", "/login");
  });

  it("clears an expired session and redirects to login", () => {
    cy.intercept("GET", "**/api/users/me", { statusCode: 401, body: { message: "Expired token" } });
    cy.visitFrontend("/dashboard");
    cy.location("pathname").should("eq", "/login");
    cy.window().its("sessionStorage").invoke("getItem", "gencontent-auth").should("eq", null);
  });

  it("validates registration password confirmation and submits only account fields", () => {
    cy.intercept("POST", "**/api/auth/register", {
      statusCode: 201,
      body: { message: "Check your email to verify your account" }
    }).as("register");
    cy.visitFrontend("/register?email=invited@example.test", false);
    cy.get("input[name=email]").should("have.value", "invited@example.test");
    cy.get("input[name=name]").type("New Creator");
    cy.get("input[name=password]").type("Password123!");
    cy.get("input[name=confirmPassword]").type("Different123!");
    cy.get("button[type=submit]").click();
    cy.contains("Passwords do not match").should("be.visible");
    cy.get("@register.all").should("have.length", 0);
    cy.get("input[name=confirmPassword]").clear().type("Password123!");
    cy.get("button[type=submit]").click();
    cy.wait("@register").its("request.body").should("deep.equal", {
      name: "New Creator",
      email: "invited@example.test",
      password: "Password123!"
    });
    cy.contains("Check your email to verify your account").should("be.visible");
  });

  it("requests a password reset and displays the response", () => {
    cy.intercept("POST", "**/api/auth/forgot-password", {
      body: { message: "Reset instructions sent" }
    }).as("reset");
    cy.visitFrontend("/forgot-password", false);
    cy.get("input[type=email]").type(user.email);
    cy.get("button[type=submit]").click();
    cy.wait("@reset").its("request.body.email").should("eq", user.email);
    cy.contains("Reset instructions sent").should("be.visible");
  });

  it("rejects incomplete reset links", () => {
    cy.visitFrontend("/reset-password", false);
    cy.contains("This password reset link is invalid, expired, or incomplete").should("be.visible");
    cy.get("button[type=submit]").should("be.disabled");
  });

  it("resets a password with the supplied link token", () => {
    cy.intercept("POST", "**/api/auth/reset-password", {
      body: { message: "Password reset successfully" }
    }).as("reset");
    cy.visitFrontend("/reset-password?token=reset-token", false);
    cy.get("input[name=password]").type("Password123!");
    cy.get("input[name=confirmPassword]").type("Password123!");
    cy.get("button[type=submit]").click();
    cy.wait("@reset")
      .its("request.body")
      .should("deep.equal", { token: "reset-token", password: "Password123!" });
    cy.contains("Password reset successfully").should("be.visible");
  });

  it("verifies email and reports expired verification links", () => {
    cy.intercept("POST", "**/api/auth/verify-email", {
      body: { message: "Email verified successfully" }
    }).as("verify");
    cy.visitFrontend("/verify-email?token=verification-token", false);
    cy.wait("@verify").its("request.body.token").should("eq", "verification-token");
    cy.contains("Email verified successfully").should("be.visible");
    cy.intercept("POST", "**/api/auth/verify-email", {
      statusCode: 400,
      body: { message: "Verification link expired" }
    });
    cy.visitFrontend("/verify-email?token=expired-token", false);
    cy.contains("Verification link expired").should("be.visible");
  });
});
