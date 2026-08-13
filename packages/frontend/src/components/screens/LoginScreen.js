"use client";

import Link from "next/link";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Brand from "../common/Brand";
import Button from "../common/Button";
import { setDemoLogin } from "../common/ProtectedRoute";
import { requestAuth } from "../../lib/auth";

export default function LoginScreen() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await requestAuth("login", form);
      router.push("/dashboard");
    } catch (authError) {
      setError(authError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleChange(event) {
    setForm((currentForm) => ({
      ...currentForm,
      [event.target.name]: event.target.value
    }));
  }

  function handleDemoLogin() {
    setDemoLogin();
    router.push("/dashboard");
  }

  return (
    <section className="screen login-screen">
      <Brand />
      <form className="login-panel" onSubmit={handleLogin}>
        <h2>Welcome back!</h2>
        <p>Sign in to continue to your account</p>
        <label>
          <Mail aria-hidden="true" size={18} />
          <input
            name="email"
            onChange={handleChange}
            placeholder="Email address"
            type="email"
            value={form.email}
          />
        </label>
        <label>
          <Lock aria-hidden="true" size={18} />
          <input
            name="password"
            onChange={handleChange}
            placeholder="Password"
            type={showPassword ? "text" : "password"}
            value={form.password}
          />
          <button
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="password-toggle"
            onClick={() => setShowPassword((currentValue) => !currentValue)}
            type="button"
          >
            {showPassword ? (
              <EyeOff aria-hidden="true" size={18} />
            ) : (
              <Eye aria-hidden="true" size={18} />
            )}
          </button>
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <div className="form-row">
          <span>☐ Remember me</span>
          <a href="#">Forgot password?</a>
        </div>
        <Button className="full-width" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Signing in..." : "Sign In"}
        </Button>
        <div className="divider">or</div>
        <Button variant="secondary" className="full-width" type="button" onClick={handleDemoLogin}>
          Quick Demo Access
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
