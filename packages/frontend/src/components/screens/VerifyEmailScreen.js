"use client";

import Link from "next/link";
import { MailCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AuthVisual from "../common/AuthVisual";
import Brand from "../common/Brand";
import Button from "../common/Button";
import { ROUTES } from "../../constants/navigation";
import { useAppStore } from "../../store";

export default function VerifyEmailScreen() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const auth = useAppStore((state) => state.auth);
  const clearAuthError = useAppStore((state) => state.clearAuthError);
  const resendVerificationEmail = useAppStore((state) => state.resendVerificationEmail);
  const verifyEmail = useAppStore((state) => state.verifyEmail);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [verificationAttempted, setVerificationAttempted] = useState(false);
  const errorMessage =
    auth.error || (!token && !message ? "This verification link is invalid or incomplete" : "");

  useEffect(() => clearAuthError(), [clearAuthError]);

  useEffect(() => {
    let isActive = true;

    async function verifyAccountEmail() {
      if (!token) {
        setVerificationAttempted(true);
        return;
      }

      try {
        const response = await verifyEmail(token);

        if (isActive) {
          setMessage(response.message);
        }
      } catch (error) {
        // Error state is displayed from the auth store.
      } finally {
        if (isActive) {
          setVerificationAttempted(true);
        }
      }
    }

    verifyAccountEmail();

    return () => {
      isActive = false;
    };
  }, [token, verifyEmail]);

  async function handleResend(event) {
    event.preventDefault();
    setResendMessage("");

    try {
      const response = await resendVerificationEmail(email);
      setResendMessage(response.message);
    } catch (error) {
      // Error state is displayed from the auth store.
    }
  }

  return (
    <section className="screen login-screen">
      <Brand />
      <form className="login-panel" onSubmit={handleResend}>
        <h2>Verify email</h2>
        <p>Account verification links expire in 5 minutes.</p>
        {!verificationAttempted && <p className="auth-success">Checking verification link...</p>}
        {message && <p className="auth-success">{message}</p>}
        {errorMessage && <p className="auth-error">{errorMessage}</p>}
        {!message && verificationAttempted && (
          <>
            <label>
              <MailCheck aria-hidden="true" size={17} strokeWidth={1.8} />
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
            {resendMessage && <p className="auth-success">{resendMessage}</p>}
            <Button
              className="full-width"
              disabled={auth.loading || Boolean(resendMessage)}
              type="submit"
            >
              {auth.loading ? "Sending..." : "Send New Verification Link"}
            </Button>
          </>
        )}
        <p className="signup">
          <Link href={ROUTES.LOGIN}>{message ? "Continue to sign in" : "Back to sign in"}</Link>
        </p>
      </form>
      <AuthVisual />
    </section>
  );
}
