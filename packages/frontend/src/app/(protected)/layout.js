"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import AppHeader from "../../components/common/AppHeader";
import ProtectedRoute from "../../components/common/ProtectedRoute";
import { AppSidebar } from "../../components/common/Sidebar";

const PROTOTYPE_ROUTES = new Set(["/chat-history", "/collaboration", "/editor"]);

export default function ProtectedLayout({ children }) {
  const pathname = usePathname();
  const isPrototypeRoute = PROTOTYPE_ROUTES.has(pathname);

  useEffect(() => {
    const theme = window.localStorage.getItem("gencontent-theme-preference") || "system";

    document.documentElement.dataset.theme = ["light", "dark", "system"].includes(theme)
      ? theme
      : "system";
    document.documentElement.style.colorScheme =
      theme === "system" ? "light dark" : theme === "dark" ? "dark" : "light";
  }, []);

  if (isPrototypeRoute) {
    return (
      <ProtectedRoute>
        <main className="prototype-stage">{children}</main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <main className="protected-stage">
        <section className="screen app-frame">
          <AppSidebar />
          <div className="min-w-0">
            <AppHeader />
            {children}
          </div>
        </section>
      </main>
    </ProtectedRoute>
  );
}
