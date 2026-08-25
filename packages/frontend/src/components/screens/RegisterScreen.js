"use client";

import Link from "next/link";
import { Mail, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthVisual from "../common/AuthVisual";
import Brand from "../common/Brand";
import Button from "../common/Button";
import PasswordField from "../common/PasswordField";
import PasswordStrength from "../common/PasswordStrength";
import { ROUTES } from "../../constants/navigation";
import { useAppStore } from "../../store";

export default function RegisterScreen() {
  const router = useRouter();
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
  const [message, setMessage] = useState("");

  useEffect(() => {
    clearAuthError();
  }, [clearAuthError]);

  useEffect(() => {
    if (auth.isAuthenticated) {
      router.replace(ROUTES.DASHBOARD);
    }
  }, [auth.isAuthenticated, router]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormValues((currentValues) => ({ ...currentValues, [name]: value }));
    setMessage("");

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
      setMessage(
        response.message ||
          "Account created. Check your email to verify your account before signing in."
      );
    } catch (error) {
      // Error state is displayed from the auth store.
    }
  }

  return (
    <section className="screen login-screen">
      <Brand />
      <form className="login-panel" onSubmit={handleRegister}>
        <h2>Create account</h2>
        <p>Start creating with your AI workspace. Verification links expire in 5 minutes.</p>
        {!message && (
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
        {message && <p className="auth-success">{message}</p>}
        {!message && (
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
