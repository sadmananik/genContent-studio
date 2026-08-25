"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthVisual from "../common/AuthVisual";
import Brand from "../common/Brand";
import Button from "../common/Button";
import PasswordField from "../common/PasswordField";
import { ROUTES } from "../../constants/navigation";
import { useAppStore } from "../../store";

export default function LoginScreen() {
  const router = useRouter();
  const auth = useAppStore((state) => state.auth);
  const loginUser = useAppStore((state) => state.loginUser);
  const clearAuthError = useAppStore((state) => state.clearAuthError);
  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
    rememberMe: false
  });

  useEffect(() => {
    clearAuthError();
  }, [clearAuthError]);

  useEffect(() => {
    if (auth.isAuthenticated) {
      router.replace(ROUTES.DASHBOARD);
    }
  }, [auth.isAuthenticated, router]);

  function handleChange(event) {
    const { checked, name, type, value } = event.target;
    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  async function handleLogin(event) {
    event.preventDefault();

    try {
      await loginUser(formValues);
      router.push(ROUTES.DASHBOARD);
    } catch (error) {
      // Error state is displayed from the auth store.
    }
  }

  return (
    <section className="screen login-screen">
      <Brand />
      <form className="login-panel" onSubmit={handleLogin}>
        <h2>Welcome back!</h2>
        <p>Sign in to continue to your account</p>
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
          autoComplete="current-password"
          label="Password"
          name="password"
          onChange={handleChange}
          placeholder="Password"
          required
          value={formValues.password}
        />
        <div className="form-row">
          <label className="remember-option">
            <input
              checked={formValues.rememberMe}
              name="rememberMe"
              onChange={handleChange}
              type="checkbox"
            />
            <span>Remember me</span>
          </label>
          <Link href={ROUTES.FORGOT_PASSWORD}>Forgot password?</Link>
        </div>
        {auth.error && <p className="auth-error">{auth.error}</p>}
        <Button className="full-width" disabled={auth.loading} type="submit">
          {auth.loading ? "Signing in..." : "Sign In"}
        </Button>
        <p className="signup">
          Don&apos;t have an account? <Link href={ROUTES.REGISTER}>Sign up</Link>
        </p>
      </form>
      <AuthVisual />
    </section>
  );
}
