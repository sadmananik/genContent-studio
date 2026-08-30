"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "../../store";

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const token = useAppStore((state) => state.auth.token);
  const getAuthenticatedUser = useAppStore((state) => state.getAuthenticatedUser);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function verifySession() {
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        await getAuthenticatedUser();

        if (isMounted) {
          setIsReady(true);
        }
      } catch (error) {
        if (isMounted) {
          router.replace("/login");
        }
      }
    }

    verifySession();

    return () => {
      isMounted = false;
    };
  }, [getAuthenticatedUser, router, token]);

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
