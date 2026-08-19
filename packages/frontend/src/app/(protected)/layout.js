"use client";

import { usePathname, useRouter } from "next/navigation";
import ProtectedRoute from "../../components/common/ProtectedRoute";
import { AppSidebar } from "../../components/common/Sidebar";
import { ROUTES } from "../../constants/navigation";

const PROTOTYPE_ROUTES = new Set(["/chat-history", "/collaboration", "/editor"]);

export default function ProtectedLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
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
          <AppSidebar onProfile={() => router.push(ROUTES.PROFILE)} />
          {children}
        </section>
      </main>
    </ProtectedRoute>
  );
}
