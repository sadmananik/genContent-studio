import ProtectedRoute from "../../components/common/ProtectedRoute";
import ChatHistoryScreen from "../../components/screens/ChatHistoryScreen";

export default function ChatHistoryPage() {
  return (
    <ProtectedRoute>
      <main className="prototype-stage">
        <ChatHistoryScreen />
      </main>
    </ProtectedRoute>
  );
}
