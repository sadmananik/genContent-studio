"use client";

import Link from "next/link";
import { MailCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AuthVisual from "../common/AuthVisual";
import Brand from "../common/Brand";
import Button from "../common/Button";
import { ROUTES } from "../../constants/navigation";
import { VERIFY_EMAIL_TEXT } from "../../constants/notifications";
import { useAppStore } from "../../store";

const verificationRequests = new Map();

export default function VerifyEmailScreen() {
  const searchParams = useSearchParams();
  const token =
    searchParams.get("token") ||
    searchParams.get("verificationToken") ||
    searchParams.get("code") ||
    "";
  const auth = useAppStore((state) => state.auth);
  const clearAuthError = useAppStore((state) => state.clearAuthError);
  const resendVerificationEmail = useAppStore((state) => state.resendVerificationEmail);
  const verifyEmail = useAppStore((state) => state.verifyEmail);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [verificationAttempted, setVerificationAttempted] = useState(false);
  const errorMessage = auth.error || (!token && !message ? VERIFY_EMAIL_TEXT.INVALID_LINK : "");

  useEffect(() => clearAuthError(), [clearAuthError]);

  useEffect(() => {
    let isActive = true;

    async function verifyAccountEmail() {
      if (!token) {
        setVerificationAttempted(true);
        return;
      }

      try {
        const response = await getVerificationRequest(token, verifyEmail);

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
        <h2>{VERIFY_EMAIL_TEXT.TITLE}</h2>
        <p>{VERIFY_EMAIL_TEXT.EXPIRED_HINT}</p>
        {!verificationAttempted && (
          <p className="auth-success">{VERIFY_EMAIL_TEXT.CHECKING_LINK}</p>
        )}
        {message && <p className="auth-success">{message}</p>}
        {errorMessage && <p className="auth-error">{errorMessage}</p>}
        {!message && verificationAttempted && (
          <div className="verify-resend-fields">
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
              {auth.loading
                ? VERIFY_EMAIL_TEXT.RESEND_BUTTON_LOADING
                : VERIFY_EMAIL_TEXT.RESEND_BUTTON}
            </Button>
          </div>
        )}
        <p className="signup">
          <Link href={ROUTES.LOGIN}>
            {message ? VERIFY_EMAIL_TEXT.SIGN_IN_CONTINUE : VERIFY_EMAIL_TEXT.SIGN_IN_BACK}
          </Link>
        </p>
      </form>
      <AuthVisual />
    </section>
  );
}

function getVerificationRequest(token, verifyEmail) {
  if (!verificationRequests.has(token)) {
    verificationRequests.set(
      token,
      verifyEmail(token).catch((error) => {
        verificationRequests.delete(token);
        throw error;
      })
    );
  }

  return verificationRequests.get(token);
}
