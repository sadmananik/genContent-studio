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
  const validatePasswordResetToken = useAppStore((state) => state.validatePasswordResetToken);
  const clearAuthError = useAppStore((state) => state.clearAuthError);
  const [formValues, setFormValues] = useState({ password: "", confirmPassword: "" });
  const [formError, setFormError] = useState("");
  const [message, setMessage] = useState("");
  const [tokenStatus, setTokenStatus] = useState(token ? "checking" : "invalid");
  const errorMessage =
    formError ||
    auth.error ||
    (!token ? "This password reset link is invalid, expired, or incomplete" : "");

  useEffect(() => {
    clearAuthError();
    if (!token) {
      setTokenStatus("invalid");
      return undefined;
    }

    let isCurrent = true;
    setTokenStatus("checking");
    validatePasswordResetToken(token)
      .then(() => {
        if (isCurrent) setTokenStatus("valid");
      })
      .catch(() => {
        if (isCurrent) setTokenStatus("invalid");
      });

    return () => {
      isCurrent = false;
    };
  }, [clearAuthError, token, validatePasswordResetToken]);

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
      if (error.message === "This password reset link is invalid or has expired") {
        setTokenStatus("invalid");
      }
    }
  }

  return (
    <section className="screen login-screen">
      <Brand />
      <form className="login-panel reset-password-panel" onSubmit={handleSubmit}>
        <h2>Create new password</h2>
        <p>
          {tokenStatus === "checking"
            ? "Checking your reset link…"
            : "Choose a secure password with at least eight characters. Use your reset link within the time stated in your email."}
        </p>
        {tokenStatus === "valid" && !message && (
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
        {tokenStatus === "invalid" && (
          <p className="auth-error">
            {auth.error || errorMessage || "This password reset link is invalid or has expired."}
          </p>
        )}
        {tokenStatus === "checking" && <p role="status">Checking reset link…</p>}
        {message && <p className="auth-success">{message}</p>}
        {tokenStatus === "valid" && !message && (
          <Button
            className="full-width reset-password-submit"
            disabled={auth.loading || !token}
            type="submit"
          >
            {auth.loading ? "Updating..." : "Update Password"}
          </Button>
        )}
        {tokenStatus === "invalid" ? (
          <p className="signup">
            <Link href={ROUTES.FORGOT_PASSWORD}>Request a new reset link</Link>
          </p>
        ) : (
          <p className="signup">
            <Link href={ROUTES.LOGIN}>{message ? "Continue to sign in" : "Back to sign in"}</Link>
          </p>
        )}
      </form>
      <AuthVisual />
    </section>
  );
}
