"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const DEMO_AUTH_KEY = "gencontent-demo-auth";

export function setDemoLogin() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(DEMO_AUTH_KEY, "true");
  }
}

export function clearDemoLogin() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(DEMO_AUTH_KEY);
  }
}

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const hasDemoLogin = window.localStorage.getItem(DEMO_AUTH_KEY) === "true";

    if (!hasDemoLogin) {
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
