"use client";

import { usePathname } from "next/navigation";
import ProtectedRoute from "../../components/common/ProtectedRoute";
import { AppSidebar } from "../../components/common/Sidebar";

const PROTOTYPE_ROUTES = new Set(["/chat-history", "/collaboration", "/editor"]);

export default function ProtectedLayout({ children }) {
  const pathname = usePathname();
  const isPrototypeRoute = PROTOTYPE_ROUTES.has(pathname);

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
          {children}
        </section>
      </main>
    </ProtectedRoute>
  );
}
