"use client";

import { useEffect, useRef, useState } from "react";
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
  const [navigationOpen, setNavigationOpen] = useState(false);
  const frameRef = useRef(null);

  function closeNavigation() {
    setNavigationOpen(false);
    frameRef.current?.querySelector(".mobile-navigation-toggle")?.focus();
  }

  useEffect(() => {
    setNavigationOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!navigationOpen) return;
    const frame = frameRef.current;
    const sidebar = frame?.querySelector("#app-navigation");
    sidebar?.querySelector("button")?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKey(event) {
      if (event.key === "Escape") closeNavigation();
      if (event.key === "Tab") {
        const items = sidebar?.querySelectorAll("a[href], button");
        if (!items?.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    const desktop = window.matchMedia("(min-width: 901px)");
    function handleResize(event) {
      if (event.matches) setNavigationOpen(false);
    }
    desktop.addEventListener("change", handleResize);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
      desktop.removeEventListener("change", handleResize);
    };
  }, [navigationOpen]);
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
        <section className="screen app-frame" ref={frameRef}>
          {navigationOpen && (
            <button
              type="button"
              className="mobile-navigation-backdrop"
              aria-label="Dismiss navigation"
              onClick={closeNavigation}
              tabIndex={-1}
            />
          )}
          <AppSidebar mobileOpen={navigationOpen} onClose={closeNavigation} />
          <div className="app-main-panel min-w-0">
            <AppHeader
              navigationOpen={navigationOpen}
              onToggleNavigation={() => setNavigationOpen((open) => !open)}
            />
            <div className="app-page-content">{children}</div>
          </div>
        </section>
      </main>
    </ProtectedRoute>
  );
}
