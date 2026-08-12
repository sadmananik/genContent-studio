"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Brand from "../common/Brand";
import Button from "../common/Button";
import { setDemoLogin } from "../common/ProtectedRoute";
import { requestAuth } from "../../lib/auth";

export default function RegisterScreen() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRegister(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await requestAuth("register", form);
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

  function handleDemoRegister() {
    setDemoLogin();
    router.push("/dashboard");
  }

  return (
    <section className="screen login-screen">
      <Brand />
      <form className="login-panel" onSubmit={handleRegister}>
        <h2>Create account</h2>
        <p>Start creating with your AI workspace</p>
        <label>
          <span>◇</span>
          <input name="name" onChange={handleChange} placeholder="Full name" value={form.name} />
        </label>
        <label>
          <span>✉</span>
          <input
            name="email"
            onChange={handleChange}
            placeholder="Email address"
            type="email"
            value={form.email}
          />
        </label>
        <label>
          <span>⌘</span>
          <input
            name="password"
            onChange={handleChange}
            placeholder="Password"
            type="password"
            value={form.password}
          />
          <span>⊙</span>
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <Button className="full-width" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Creating..." : "Create Account"}
        </Button>
        <div className="divider">or</div>
        <Button
          variant="secondary"
          className="full-width"
          type="button"
          onClick={handleDemoRegister}
        >
          Quick Register for Dev
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
