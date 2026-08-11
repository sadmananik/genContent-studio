import ProtectedRoute from "../../components/common/ProtectedRoute";
import EditorScreen from "../../components/screens/EditorScreen";

export default function EditorPage() {
  return (
    <ProtectedRoute>
      <main className="prototype-stage">
        <EditorScreen />
      </main>
    </ProtectedRoute>
  );
}
