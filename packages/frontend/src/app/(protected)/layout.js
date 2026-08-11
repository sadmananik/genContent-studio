import ProtectedRoute from "../../components/common/ProtectedRoute";
import { AppSidebar } from "../../components/common/Sidebar";

export default function ProtectedLayout({ children }) {
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
