import ProtectedRoute from "../../components/common/ProtectedRoute";
import CollaborationScreen from "../../components/screens/CollaborationScreen";

export default function CollaborationPage() {
  return (
    <ProtectedRoute>
      <main className="prototype-stage">
        <CollaborationScreen />
      </main>
    </ProtectedRoute>
  );
}
