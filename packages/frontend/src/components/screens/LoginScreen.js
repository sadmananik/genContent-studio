"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Brand from "../common/Brand";
import Button from "../common/Button";
import { ROUTES } from "../../constants/navigation";
import { useAppStore } from "../../store";

export default function LoginScreen() {
  const router = useRouter();
  const auth = useAppStore((state) => state.auth);
  const loginUser = useAppStore((state) => state.loginUser);
  const [formValues, setFormValues] = useState({ email: "", password: "" });

  useEffect(() => {
    if (auth.isAuthenticated) {
      router.replace(ROUTES.DASHBOARD);
    }
  }, [auth.isAuthenticated, router]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormValues((currentValues) => ({ ...currentValues, [name]: value }));
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
          <span>✉</span>
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
        <label>
          <span>⌘</span>
          <input
            autoComplete="current-password"
            name="password"
            onChange={handleChange}
            placeholder="Password"
            required
            type="password"
            value={formValues.password}
          />
          <span>⊙</span>
        </label>
        <div className="form-row">
          <span>☐ Remember me</span>
          <a href="#">Forgot password?</a>
        </div>
        {auth.error && <p className="auth-error">{auth.error}</p>}
        <Button className="full-width" disabled={auth.loading} type="submit">
          {auth.loading ? "Signing in..." : "Sign In"}
        </Button>
        <p className="signup">
          Don&apos;t have an account? <Link href="/register">Sign up</Link>
        </p>
      </form>
      <div className="robot-scene" aria-hidden="true">
        <div className="chat-bubble">•••</div>
        <div className="robot">
          <span className="antenna left" />
          <span className="antenna right" />
          <div className="robot-head">
            <i />
            <i />
          </div>
          <div className="robot-body" />
        </div>
      </div>
    </section>
  );
}
