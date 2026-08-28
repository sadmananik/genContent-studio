"use client";

import Link from "next/link";
import { Mail, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthVisual from "../common/AuthVisual";
import Brand from "../common/Brand";
import Button from "../common/Button";
import PasswordField from "../common/PasswordField";
import PasswordStrength from "../common/PasswordStrength";
import { ROUTES } from "../../constants/navigation";
import { useAppStore } from "../../store";

export default function RegisterScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitedEmail = searchParams.get("email") || "";
  const auth = useAppStore((state) => state.auth);
  const registerUser = useAppStore((state) => state.registerUser);
  const clearAuthError = useAppStore((state) => state.clearAuthError);
  const [formValues, setFormValues] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [formError, setFormError] = useState("");
  const [registrationResult, setRegistrationResult] = useState(null);

  useEffect(() => {
    clearAuthError();
  }, [clearAuthError]);

  useEffect(() => {
    if (auth.isAuthenticated) {
      router.replace(ROUTES.DASHBOARD);
    }
  }, [auth.isAuthenticated, router]);

  useEffect(() => {
    if (invitedEmail) {
      setFormValues((currentValues) => ({
        ...currentValues,
        email: invitedEmail
      }));
    }
  }, [invitedEmail]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormValues((currentValues) => ({ ...currentValues, [name]: value }));

    if (name === "password" || name === "confirmPassword") {
      setFormError("");
    }
  }

  async function handleRegister(event) {
    event.preventDefault();

    if (formValues.password !== formValues.confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    try {
      const registrationDetails = {
        name: formValues.name,
        email: formValues.email,
        password: formValues.password
      };
      const response = await registerUser(registrationDetails);
      const submittedEmail =
        response.email || response.user?.email || String(formValues.email).trim().toLowerCase();

      setRegistrationResult({
        email: submittedEmail,
        message: response.message,
        emailDeliveryMode: response.emailDeliveryMode || "smtp"
      });
    } catch (error) {
      // Error state is displayed from the auth store.
    }
  }

  const verifyEmailHref = registrationResult?.email
    ? `${ROUTES.VERIFY_EMAIL}?email=${encodeURIComponent(registrationResult.email)}`
    : ROUTES.VERIFY_EMAIL;

  return (
    <section className="screen login-screen">
      <Brand />
      <form className="login-panel" onSubmit={handleRegister}>
        <h2>{registrationResult ? "Verify your email" : "Create account"}</h2>
        {!registrationResult ? (
          <p>Start creating with your AI workspace. Verification links expire in 5 minutes.</p>
        ) : (
          <p>Your account was created. Confirm the email below, then open the verification link.</p>
        )}

        {!registrationResult && (
          <>
            <label>
              <UserRound aria-hidden="true" size={17} strokeWidth={1.8} />
              <input
                autoComplete="name"
                name="name"
                onChange={handleChange}
                placeholder="Full name"
                required
                value={formValues.name}
              />
            </label>
            <label>
              <Mail aria-hidden="true" size={17} strokeWidth={1.8} />
              <input
                autoComplete="email"
                name="email"
                onChange={handleChange}
                placeholder="Email address"
                required
                type="email"
                value={formValues.email}
              />
            </label>
            <PasswordField
              autoComplete="new-password"
              label="Password"
              minLength={8}
              name="password"
              onChange={handleChange}
              placeholder="Password"
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
              label="Confirm password"
              minLength={8}
              name="confirmPassword"
              onChange={handleChange}
              placeholder="Confirm password"
              required
              value={formValues.confirmPassword}
            />
            {formValues.confirmPassword &&
              formValues.password !== formValues.confirmPassword &&
              !formError && <p className="field-hint error">Passwords must match</p>}
          </>
        )}

        {(formError || auth.error) && <p className="auth-error">{formError || auth.error}</p>}

        {registrationResult && (
          <div className="auth-success verification-summary" role="status">
            <p>
              <strong>Verification email sent to:</strong>
            </p>
            <p className="verification-email">{registrationResult.email}</p>
            <p>{registrationResult.message}</p>
            {registrationResult.emailDeliveryMode === "console" ? (
              <p className="field-hint">
                Local development tip: real inbox delivery is not configured. Open the{" "}
                <strong>backend terminal</strong> and look for{" "}
                <code>GenContent Studio email</code>, then copy the verification link for{" "}
                <strong>{registrationResult.email}</strong>.
              </p>
            ) : (
              <p className="field-hint">
                Check your inbox (and spam folder) for an email addressed to{" "}
                <strong>{registrationResult.email}</strong>.
              </p>
            )}
            <Button
              className="full-width"
              type="button"
              onClick={() => router.push(verifyEmailHref)}
            >
              Continue to verification help
            </Button>
          </div>
        )}

        {!registrationResult && (
          <Button className="full-width register-submit" disabled={auth.loading} type="submit">
            {auth.loading ? "Creating account..." : "Create Account"}
          </Button>
        )}
        <p className="signup">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </form>
      <AuthVisual />
    </section>
  );
}
