"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import AppHeader from "../../components/common/AppHeader";
import ProtectedRoute from "../../components/common/ProtectedRoute";
import { AppSidebar } from "../../components/common/Sidebar";
import {
  applyThemePreference,
  getStoredThemePreference,
  watchSystemThemePreference
} from "../../lib/themePreference";

const PROTOTYPE_ROUTES = new Set(["/chat-history", "/collaboration", "/editor"]);

export default function ProtectedLayout({ children }) {
  const pathname = usePathname();
  const isPrototypeRoute = PROTOTYPE_ROUTES.has(pathname);

  useEffect(() => {
    const theme = getStoredThemePreference();

    applyThemePreference(theme);
    return watchSystemThemePreference(theme);
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
