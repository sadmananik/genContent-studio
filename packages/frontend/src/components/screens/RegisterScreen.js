"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Mail, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthPageLayout from "../common/AuthPageLayout";
import PasswordField from "../common/PasswordField";
import PasswordStrength from "../common/PasswordStrength";
import { ROUTES } from "../../constants/navigation";
import { useAppStore } from "../../store";
import "../../styles/signin.css";

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
  const [message, setMessage] = useState("");

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
    <AuthPageLayout variant="signup" preview="image-workspace">
      <form className="signin-card register-card" onSubmit={handleRegister}>
        <div className="signin-card-brand">
          <Image alt="" aria-hidden="true" height={34} src="/gencontent-logo.png" width={34} />
          <strong>GenContent Studio</strong>
        </div>
        <h2>Create your account</h2>
        <p className="signin-card-copy">
          Start creating with your AI workspace. Verify your email to get started.
        </p>
        {!message && (
          <>
            <label className="signin-field" htmlFor="register-name">
              <span>Full name</span>
              <div className="signin-input">
                <UserRound aria-hidden="true" size={17} strokeWidth={1.8} />
                <input
                  autoComplete="name"
                  id="register-name"
                  name="name"
                  onChange={handleChange}
                  placeholder="Full name"
                  required
                  value={formValues.name}
                />
              </div>
            </label>
            <label className="signin-field" htmlFor="register-email">
              <span>Email address</span>
              <div className="signin-input">
                <Mail aria-hidden="true" size={17} strokeWidth={1.8} />
                <input
                  autoComplete="email"
                  id="register-email"
                  name="email"
                  onChange={handleChange}
                  placeholder="Email address"
                  required
                  type="email"
                  value={formValues.email}
                />
              </div>
            </label>
            <label className="signin-field" htmlFor="register-password">
              <span>Password</span>
              <PasswordField
                autoComplete="new-password"
                id="register-password"
                label="Password"
                minLength={8}
                name="password"
                onChange={handleChange}
                placeholder="Password"
                required
                value={formValues.password}
              />
            </label>
            <PasswordStrength password={formValues.password} />
            <label className="signin-field" htmlFor="register-confirm-password">
              <span>Confirm password</span>
              <PasswordField
                aria-invalid={
                  Boolean(formValues.confirmPassword) &&
                  formValues.password !== formValues.confirmPassword
                }
                autoComplete="new-password"
                id="register-confirm-password"
                label="Confirm password"
                minLength={8}
                name="confirmPassword"
                onChange={handleChange}
                placeholder="Confirm password"
                required
                value={formValues.confirmPassword}
              />
            </label>
            {formValues.confirmPassword &&
              formValues.password !== formValues.confirmPassword &&
              !formError && <p className="field-hint error">Passwords must match</p>}
          </>
        )}
        {(formError || auth.error) && <p className="auth-error">{formError || auth.error}</p>}
        {message && <p className="auth-success">{message}</p>}
        {!message && (
          <button className="signin-submit" disabled={auth.loading} type="submit">
            {auth.loading ? "Creating account..." : "Create Account"}
            {!auth.loading ? <ArrowRight size={18} /> : null}
          </button>
        )}
        <p className="signin-footer">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </form>
    </AuthPageLayout>
  );
}
