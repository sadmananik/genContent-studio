"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearDemoLogin, hasDemoLogin, setDemoLogin } from "../../lib/auth";
import { useAppStore } from "../../store";

export { clearDemoLogin, setDemoLogin };

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const isAuthenticated = useAppStore((state) => state.auth.isAuthenticated);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isAuthenticated && !hasDemoLogin()) {
      router.replace("/login");
      return;
    }

    setIsReady(true);
  }, [isAuthenticated, router]);

  if (!isReady) {
    return (
      <main className="auth-check">
        <div className="auth-check-panel">
          <strong>Checking access...</strong>
          <p>Protected route placeholder using the dev demo login flag.</p>
        </div>
      </main>
    );
  }

  return children;
}
