"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearDemoLogin, getAuthSession, hasDemoLogin, setDemoLogin } from "../../lib/auth";

export { clearDemoLogin, setDemoLogin };

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!getAuthSession()?.token && !hasDemoLogin()) {
      router.replace("/login");
      return;
    }

    setIsReady(true);
  }, [router]);

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
