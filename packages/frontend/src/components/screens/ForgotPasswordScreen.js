"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { useEffect, useState } from "react";
import Brand from "../common/Brand";
import Button from "../common/Button";
import AuthVisual from "../common/AuthVisual";
import { ROUTES } from "../../constants/navigation";
import { useAppStore } from "../../store";

export default function ForgotPasswordScreen() {
  const auth = useAppStore((state) => state.auth);
  const requestPasswordReset = useAppStore((state) => state.requestPasswordReset);
  const clearAuthError = useAppStore((state) => state.clearAuthError);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => clearAuthError(), [clearAuthError]);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    try {
      const response = await requestPasswordReset(email);
      setMessage(response.message);
    } catch (error) {
      // Error state is displayed from the auth store.
    }
  }

  return (
    <section className="screen login-screen">
      <Brand />
      <form className="login-panel" onSubmit={handleSubmit}>
        <h2>Reset password</h2>
        <p>
          Enter your account email and we&apos;ll send you a secure reset link valid for 5 minutes.
        </p>
        <label>
          <Mail aria-hidden="true" size={17} strokeWidth={1.8} />
          <input
            autoComplete="email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email address"
            required
            type="email"
            value={email}
          />
        </label>
        {auth.error && <p className="auth-error">{auth.error}</p>}
        {message && <p className="auth-success">{message}</p>}
        <Button className="full-width" disabled={auth.loading || Boolean(message)} type="submit">
          {auth.loading ? "Sending..." : "Send Reset Link"}
        </Button>
        <p className="signup">
          Remembered your password? <Link href={ROUTES.LOGIN}>Sign in</Link>
        </p>
      </form>
      <AuthVisual />
    </section>
  );
}
