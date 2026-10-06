import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginScreen from "../src/components/screens/LoginScreen";
import RegisterScreen from "../src/components/screens/RegisterScreen";
import ForgotPasswordScreen from "../src/components/screens/ForgotPasswordScreen";
import ResetPasswordScreen from "../src/components/screens/ResetPasswordScreen";
import ProtectedRoute from "../src/components/common/ProtectedRoute";
import AppHeader from "../src/components/common/AppHeader";
import { useAppStore } from "../src/store";
import { resetStore, mockApi, user, deferred } from "./helpers";
import { mockRouter } from "./setup";

beforeEach(() => resetStore(false));
async function enterLogin(ui) {
  await ui.type(screen.getByLabelText(/email address/i), user.email);
  await ui.type(screen.getByLabelText(/^password$/i), "Password123!");
}

test("login disables submission while pending then stores a remembered session", async () => {
  const ui = userEvent.setup();
  const pending = deferred();
  const fetch = mockApi({ "POST /api/auth/login": () => pending.promise });
  render(<LoginScreen />);
  await enterLogin(ui);
  await ui.click(screen.getByLabelText(/remember/i));
  await ui.click(screen.getByRole("button", { name: /sign in/i }));
  expect(screen.getByRole("button", { name: /signing|sign in/i })).toBeDisabled();
  await act(async () => pending.resolve({ body: { token: "signed-token", user } }));
  expect(mockRouter.push).toHaveBeenCalledWith("/dashboard");
  expect(JSON.parse(window.localStorage.getItem("gencontent-auth")).token).toBe("signed-token");
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
    email: user.email,
    password: "Password123!"
  });
});

test("login error keeps the user on the form and allows retry", async () => {
  const ui = userEvent.setup();
  mockApi({ "POST /api/auth/login": { status: 401, body: { message: "Invalid credentials" } } });
  render(<LoginScreen />);
  await enterLogin(ui);
  await ui.click(screen.getByRole("button", { name: /sign in/i }));
  expect(await screen.findByText("Invalid credentials")).toBeVisible();
  expect(mockRouter.push).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: /sign in/i })).toBeEnabled();
});

test("registration mismatch is validated before any API request", async () => {
  const ui = userEvent.setup();
  const fetch = mockApi();
  render(<RegisterScreen />);
  await ui.type(screen.getByPlaceholderText("Full name"), "New User");
  await ui.type(screen.getByPlaceholderText("Email address"), user.email);
  await ui.type(screen.getByPlaceholderText("Password"), "Password123!");
  await ui.type(screen.getByPlaceholderText("Confirm password"), "Different123!");
  await ui.click(screen.getByRole("button", { name: /create account/i }));
  expect(screen.getByText("Passwords do not match")).toBeVisible();
  expect(fetch).not.toHaveBeenCalled();
});

test("forgot-password form shows the mocked response", async () => {
  const ui = userEvent.setup();
  mockApi({ "POST /api/auth/forgot-password": { body: { message: "Reset email sent" } } });
  render(<ForgotPasswordScreen />);
  await ui.type(screen.getByPlaceholderText("Email address"), user.email);
  await ui.click(screen.getByRole("button", { name: /send/i }));
  expect(await screen.findByText("Reset email sent")).toBeVisible();
});

test("missing reset token hides the form and offers a fresh reset link", () => {
  render(<ResetPasswordScreen />);
  expect(
    screen.getByText("This password reset link is invalid, expired, or incomplete")
  ).toBeVisible();
  expect(screen.queryByLabelText("New password")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /reset|update/i })).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Request a new reset link" })).toHaveAttribute(
    "href",
    "/forgot-password"
  );
});

test("protected content stays hidden without a session", () => {
  render(
    <ProtectedRoute>
      <p>Private content</p>
    </ProtectedRoute>
  );
  expect(screen.queryByText("Private content")).not.toBeInTheDocument();
  expect(mockRouter.replace).toHaveBeenCalledWith("/login");
});

test("protected route waits for user verification before showing children", async () => {
  resetStore();
  const pending = deferred();
  mockApi({ "GET /api/users/me": () => pending.promise });
  render(
    <ProtectedRoute>
      <p>Private content</p>
    </ProtectedRoute>
  );
  expect(screen.getByText("Checking access...")).toBeVisible();
  await act(async () => pending.resolve({ body: user }));
  expect(await screen.findByText("Private content")).toBeVisible();
});

test("expired session is cleared and redirected", async () => {
  resetStore();
  mockApi({ "GET /api/users/me": { status: 401, body: { message: "Expired token" } } });
  render(
    <ProtectedRoute>
      <p>Private content</p>
    </ProtectedRoute>
  );
  await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/login"));
  expect(window.sessionStorage.getItem("gencontent-auth")).toBeNull();
  expect(useAppStore.getState().auth.isAuthenticated).toBe(false);
});

test("profile menu opens and logout clears session and store", async () => {
  resetStore();
  const ui = userEvent.setup();
  render(<AppHeader />);
  await ui.click(screen.getByRole("button", { name: new RegExp(user.name) }));
  await ui.click(screen.getByRole("menuitem", { name: "Logout" }));
  expect(window.sessionStorage.getItem("gencontent-auth")).toBeNull();
  expect(useAppStore.getState().auth.isAuthenticated).toBe(false);
  expect(mockRouter.push).toHaveBeenCalledWith("/login");
});
