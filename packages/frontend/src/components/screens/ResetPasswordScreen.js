"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Brand from "../common/Brand";
import Button from "../common/Button";
import AuthVisual from "../common/AuthVisual";
import PasswordField from "../common/PasswordField";
import PasswordStrength from "../common/PasswordStrength";
import { ROUTES } from "../../constants/navigation";
import { useAppStore } from "../../store";

export default function ResetPasswordScreen() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const auth = useAppStore((state) => state.auth);
  const resetPassword = useAppStore((state) => state.resetPassword);
  const clearAuthError = useAppStore((state) => state.clearAuthError);
  const [formValues, setFormValues] = useState({ password: "", confirmPassword: "" });
  const [formError, setFormError] = useState("");
  const [message, setMessage] = useState("");
  const errorMessage =
    formError ||
    auth.error ||
    (!token ? "This password reset link is invalid, expired, or incomplete" : "");

  useEffect(() => clearAuthError(), [clearAuthError]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormValues((currentValues) => ({ ...currentValues, [name]: value }));
    setFormError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    if (!token) {
      setFormError("This password reset link is invalid, expired, or incomplete");
      return;
    }

    if (formValues.password !== formValues.confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    try {
      const response = await resetPassword({ token, password: formValues.password });
      setMessage(response.message);
    } catch (error) {
      // Error state is displayed from the auth store.
    }
  }

  return (
    <section className="screen login-screen">
      <Brand />
      <form className="login-panel reset-password-panel" onSubmit={handleSubmit}>
        <h2>Create new password</h2>
        <p>
          Choose a secure password with at least eight characters. Reset links expire in 5 minutes.
        </p>
        {!message && (
          <>
            <PasswordField
              autoComplete="new-password"
              label="New password"
              minLength={8}
              name="password"
              onChange={handleChange}
              placeholder="New password"
              required
              value={formValues.password}
            />
            <PasswordStrength password={formValues.password} />
            <PasswordField
              aria-invalid={
                Boolean(formValues.confirmPassword) &&
                formValues.password !== formValues.confirmPassword
              }
              autoComplete="new-password"
              label="Confirm new password"
              minLength={8}
              name="confirmPassword"
              onChange={handleChange}
              placeholder="Confirm new password"
              required
              value={formValues.confirmPassword}
            />
            {formValues.confirmPassword &&
              formValues.password !== formValues.confirmPassword &&
              !formError && <p className="field-hint error">Passwords must match</p>}
          </>
        )}
        {errorMessage && <p className="auth-error">{errorMessage}</p>}
        {message && <p className="auth-success">{message}</p>}
        {!message && (
          <Button
            className="full-width reset-password-submit"
            disabled={auth.loading || !token}
            type="submit"
          >
            {auth.loading ? "Updating..." : "Update Password"}
          </Button>
        )}
        <p className="signup">
          <Link href={ROUTES.LOGIN}>{message ? "Continue to sign in" : "Back to sign in"}</Link>
        </p>
      </form>
      <AuthVisual />
    </section>
  );
}
