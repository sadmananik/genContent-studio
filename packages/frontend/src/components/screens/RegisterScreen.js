"use client";

import Link from "next/link";
import { Eye, EyeOff, Info, Lock, Mail, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Brand from "../common/Brand";
import Button from "../common/Button";
import { requestAuth } from "../../lib/auth";

export default function RegisterScreen() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const passwordStrength = getPasswordStrength(form.password);

  async function handleRegister(event) {
    event.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (passwordStrength.level < 2) {
      setError("Use a stronger password before creating your account");
      return;
    }

    setIsSubmitting(true);

    try {
      await requestAuth("register", {
        name: form.name,
        email: form.email,
        password: form.password
      });
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

  return (
    <section className="screen login-screen">
      <Brand />
      <form className="login-panel" onSubmit={handleRegister}>
        <h2>Create account</h2>
        <p>Start creating with your AI workspace</p>
        <label>
          <User aria-hidden="true" size={18} />
          <input name="name" onChange={handleChange} placeholder="Full name" value={form.name} />
        </label>
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
        <div className="password-strength" data-strength={passwordStrength.level}>
          <div>
            <div className="strength-bars" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <p>{passwordStrength.label}</p>
          </div>
          <div className="password-info">
            <button aria-label="Password requirements" type="button">
              <Info aria-hidden="true" size={16} />
            </button>
            <div className="password-requirements" role="tooltip">
              <strong>Password requirements</strong>
              <span>At least 8 characters</span>
              <span>Uppercase and lowercase letters</span>
              <span>At least 1 number</span>
              <span>Special character for strong password</span>
            </div>
          </div>
        </div>
        <label>
          <Lock aria-hidden="true" size={18} />
          <input
            name="confirmPassword"
            onChange={handleChange}
            placeholder="Repeat password"
            type={showPassword ? "text" : "password"}
            value={form.confirmPassword}
          />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <Button className="full-width create-account-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Creating..." : "Create Account"}
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

function getPasswordStrength(password) {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (!password) {
    return { level: 0, label: "Password strength" };
  }

  if (score <= 1) {
    return { level: 1, label: "Weak password" };
  }

  if (score <= 3) {
    return { level: 2, label: "Medium password" };
  }

  return { level: 3, label: "Strong password" };
}
