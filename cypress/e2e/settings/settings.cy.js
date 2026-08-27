describe("settings", () => {
  it("opens the settings page and exposes appearance choices", () => {
    cy.visit("/settings");
    cy.contains("Appearance").should("be.visible");
    cy.get("select").should("contain", "Light").and("contain", "Dark").and("contain", "System");
  });
});
