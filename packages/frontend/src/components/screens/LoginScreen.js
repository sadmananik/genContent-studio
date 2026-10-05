"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Eye,
  EyeOff,
  ImageIcon,
  LockKeyhole,
  Mail,
  PenLine,
  SearchCheck,
  WandSparkles
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "../../constants/navigation";
import { useAppStore } from "../../store";
import "./signin.css";

const FEATURE_CHIPS = [
  { label: "AI Writing", color: "#7c3aed", bg: "rgba(124, 58, 237, 0.12)", icon: PenLine },
  { label: "Content Improvement", color: "#10b981", bg: "rgba(16, 185, 129, 0.12)", icon: WandSparkles },
  { label: "SEO Suggestions", color: "#f90c0c", bg: "rgb(245 11 11 / 12%)", icon: SearchCheck },
  { label: "AI Image Generation", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.12)", icon: ImageIcon }
];

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
    <section className="signin-page">
      <a className="signin-home-link" href="/">
        ← Back to home
      </a>

      <div className="signin-layout">
        <div className="signin-marketing">
          <span className="signin-pill">All-in-one AI content workspace</span>
          <h1>
            Create, Improve and <span>Collaborate</span> with AI.
          </h1>
          <p className="signin-lead">
            From blog posts to social media content, images and more — everything you need in one
            intelligent workspace.
          </p>

          <div className="signin-chips">
            {FEATURE_CHIPS.map((chip) => {
              const Icon = chip.icon;
              return (
                <span className="signin-chip" key={chip.label} style={{ background: chip.bg, color: chip.color }}>
                  <Icon size={14} />
                  {chip.label}
                </span>
              );
            })}
          </div>

          <div className="signin-preview">
            <Image
              alt="GenContent Studio 3D workspace preview"
              className="signin-preview-img"
              height={1020}
              priority
              quality={100}
              sizes="(max-width: 979px) 92vw, min(720px, 52vw)"
              src="/landing/signin-showcase.png"
              unoptimized
              width={1530}
            />
          </div>
        </div>

        <div className="signin-form-wrap">
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
        </div>
      </div>
    </section>
  );
}
