"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Brand from "../common/Brand";
import Button from "../common/Button";
import { setDemoLogin } from "../common/ProtectedRoute";

export default function LoginScreen() {
  const router = useRouter();

  function handleDemoLogin(event) {
    event.preventDefault();
    setDemoLogin();
    router.push("/dashboard");
  }

  return (
    <section className="screen login-screen">
      <Brand />
      <form className="login-panel" onSubmit={handleDemoLogin}>
        <h2>Welcome back!</h2>
        <p>Sign in to continue to your account</p>
        <label>
          <span>✉</span>
          <input placeholder="Email address" />
        </label>
        <label>
          <span>⌘</span>
          <input placeholder="Password" type="password" />
          <span>⊙</span>
        </label>
        <div className="form-row">
          <span>☐ Remember me</span>
          <a href="#">Forgot password?</a>
        </div>
        <Button className="full-width" type="submit">
          Demo Sign In
        </Button>
        <div className="divider">or</div>
        <Button variant="secondary" className="full-width" type="button" onClick={handleDemoLogin}>
          <span className="google-dot">G</span> Continue with Google
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
