"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Brand from "../common/Brand";
import Button from "../common/Button";
import AuthVisual from "../common/AuthVisual";
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
    formError || auth.error || (!token ? "This password reset link is invalid or incomplete" : "");

  useEffect(() => clearAuthError(), [clearAuthError]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormValues((currentValues) => ({ ...currentValues, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    if (!token) {
      setFormError("This password reset link is invalid or incomplete");
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
      <form className="login-panel" onSubmit={handleSubmit}>
        <h2>Create new password</h2>
        <p>Choose a secure password with at least eight characters.</p>
        {!message && (
          <>
            <label>
              <span>⌘</span>
              <input
                autoComplete="new-password"
                minLength={8}
                name="password"
                onChange={handleChange}
                placeholder="New password"
                required
                type="password"
                value={formValues.password}
              />
            </label>
            <label>
              <span>⌘</span>
              <input
                autoComplete="new-password"
                minLength={8}
                name="confirmPassword"
                onChange={handleChange}
                placeholder="Confirm new password"
                required
                type="password"
                value={formValues.confirmPassword}
              />
            </label>
          </>
        )}
        {errorMessage && <p className="auth-error">{errorMessage}</p>}
        {message && <p className="auth-success">{message}</p>}
        {!message && (
          <Button className="full-width" disabled={auth.loading || !token} type="submit">
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
