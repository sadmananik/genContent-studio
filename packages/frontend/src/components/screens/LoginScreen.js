"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthPageLayout from "../common/AuthPageLayout";
import { ROUTES } from "../../constants/navigation";
import { useAppStore } from "../../store";
import "../../styles/signin.css";

export default function LoginScreen() {
  const router = useRouter();
  const auth = useAppStore((state) => state.auth);
  const loginUser = useAppStore((state) => state.loginUser);
  const clearAuthError = useAppStore((state) => state.clearAuthError);
  const [showPassword, setShowPassword] = useState(false);
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
    <AuthPageLayout>
      <form className="signin-card" onSubmit={handleLogin}>
        <div className="signin-card-brand">
          <Image alt="" aria-hidden="true" height={34} src="/gencontent-logo.png" width={34} />
          <strong>GenContent Studio</strong>
        </div>

        <h2>Welcome back 👋</h2>
        <p className="signin-card-copy">
          Sign in to continue creating amazing content with GenContent Studio.
        </p>

        <label className="signin-field" htmlFor="login-email">
          <span>Email address</span>
          <div className="signin-input">
            <Mail aria-hidden="true" size={17} strokeWidth={1.8} />
            <input
              autoComplete="email"
              id="login-email"
              name="email"
              onChange={handleChange}
              placeholder="you@exemple.com"
              required
              type="email"
              value={formValues.email}
            />
          </div>
        </label>

        <label className="signin-field" htmlFor="login-password">
          <span>Password</span>
          <div className="signin-input">
            <LockKeyhole aria-hidden="true" size={17} strokeWidth={1.8} />
            <input
              autoComplete="current-password"
              id="login-password"
              name="password"
              onChange={handleChange}
              placeholder="Enter your password"
              required
              type={showPassword ? "text" : "password"}
              value={formValues.password}
            />
            <button
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="signin-eye"
              onClick={() => setShowPassword((value) => !value)}
              type="button"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>

        <div className="signin-row">
          <label className="signin-remember">
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

        {auth.error ? <p className="signin-error">{auth.error}</p> : null}

        <button className="signin-submit" disabled={auth.loading} type="submit">
          {auth.loading ? "Signing in..." : "Sign In"}
          {!auth.loading ? <ArrowRight size={18} /> : null}
        </button>

        <p className="signin-footer">
          Don&apos;t have an account? <Link href={ROUTES.REGISTER}>Create account</Link>
        </p>
      </form>
    </AuthPageLayout>
  );
}
