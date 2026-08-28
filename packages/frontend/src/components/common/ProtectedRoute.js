"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthSession } from "../../lib/auth";
import { DEV_AUTH_BYPASS_ENABLED, ensureDevAuthSession } from "../../lib/devAuth";
import { useAppStore } from "../../store";

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const token = useAppStore((state) => state.auth.token);
  const getAuthenticatedUser = useAppStore((state) => state.getAuthenticatedUser);
  const [isReady, setIsReady] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function verifySession() {
      setVerifyError("");

      if (DEV_AUTH_BYPASS_ENABLED) {
        const session = ensureDevAuthSession();

        useAppStore.setState((state) => ({
          auth: {
            ...state.auth,
            user: session.user,
            token: session.token,
            isAuthenticated: true,
            loading: false,
            error: null
          }
        }));

        if (isMounted) {
          setIsReady(true);
        }
        return;
      }

      const storedSession = getAuthSession();
      const activeToken = token || storedSession?.token;

      if (!activeToken) {
        router.replace("/login");
        return;
      }

      try {
        await getAuthenticatedUser();

        if (isMounted) {
          setIsReady(true);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        // Temporary network/backend outages should not wipe a valid local session.
        if (error?.status !== 401 && storedSession?.token && storedSession?.user) {
          useAppStore.setState((state) => ({
            auth: {
              ...state.auth,
              user: storedSession.user,
              token: storedSession.token,
              isAuthenticated: true,
              loading: false,
              error: null
            }
          }));
          setIsReady(true);
          return;
        }

        if (error?.status === 401 || !getAuthSession()?.token) {
          router.replace("/login");
          return;
        }

        setVerifyError(
          error?.message || "Could not reach the server to verify your session. Please try again."
        );
      }
    }

    verifySession();

    return () => {
      isMounted = false;
    };
  }, [getAuthenticatedUser, retryCount, router, token]);

  if (verifyError) {
    return (
      <main className="auth-check">
        <div className="auth-check-panel">
          <strong>Connection problem</strong>
          <p>{verifyError}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <button
              className="min-h-10 rounded-md bg-violet-600 px-4 text-sm font-semibold text-white"
              onClick={() => {
                setIsReady(false);
                setVerifyError("");
                setRetryCount((count) => count + 1);
              }}
              type="button"
            >
              Retry
            </button>
            <button
              className="min-h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700"
              onClick={() => router.replace("/login")}
              type="button"
            >
              Go to login
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!isReady) {
    return (
      <main className="auth-check">
        <div className="auth-check-panel">
          <strong>Checking access...</strong>
          <p>Verifying your session...</p>
        </div>
      </main>
    );
  }

  return children;
}
