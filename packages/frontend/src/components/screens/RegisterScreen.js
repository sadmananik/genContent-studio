"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Brand from "../common/Brand";
import Button from "../common/Button";
import { ROUTES } from "../../constants/navigation";
import { useAppStore } from "../../store";

export default function RegisterScreen() {
  const router = useRouter();
  const auth = useAppStore((state) => state.auth);
  const registerUser = useAppStore((state) => state.registerUser);
  const clearAuthError = useAppStore((state) => state.clearAuthError);
  const [formValues, setFormValues] = useState({ name: "", email: "", password: "" });

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
  }

  async function handleRegister(event) {
    event.preventDefault();

    try {
      await registerUser(formValues);
      router.push(ROUTES.DASHBOARD);
    } catch (error) {
      // Error state is displayed from the auth store.
    }
  }

  return (
    <section className="screen login-screen">
      <Brand />
      <form className="login-panel" onSubmit={handleRegister}>
        <h2>Create account</h2>
        <p>Start creating with your AI workspace</p>
        <label>
          <span>◇</span>
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
            autoComplete="new-password"
            minLength={8}
            name="password"
            onChange={handleChange}
            placeholder="Password"
            required
            type="password"
            value={formValues.password}
          />
          <span>⊙</span>
        </label>
        {auth.error && <p className="auth-error">{auth.error}</p>}
        <Button className="full-width" disabled={auth.loading} type="submit">
          {auth.loading ? "Creating account..." : "Create Account"}
        </Button>
        <p className="signup">
          Already have an account? <Link href="/login">Sign in</Link>
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
