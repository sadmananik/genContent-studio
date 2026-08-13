"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Brand from "../common/Brand";
import Button from "../common/Button";
import { setDemoLogin } from "../common/ProtectedRoute";

export default function RegisterScreen() {
  const router = useRouter();

  function handleDemoRegister(event) {
    event.preventDefault();
    setDemoLogin();
    router.push("/dashboard");
  }

  return (
    <section className="screen login-screen">
      <Brand />
      <form className="login-panel" onSubmit={handleDemoRegister}>
        <h2>Create account</h2>
        <p>Start creating with your AI workspace</p>
        <label>
          <span>◇</span>
          <input placeholder="Full name" />
        </label>
        <label>
          <span>✉</span>
          <input placeholder="Email address" />
        </label>
        <label>
          <span>⌘</span>
          <input placeholder="Password" type="password" />
          <span>⊙</span>
        </label>
        <Button className="full-width" type="submit">
          Create Demo Account
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
