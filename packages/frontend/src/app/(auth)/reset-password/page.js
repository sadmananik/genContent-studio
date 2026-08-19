import { Suspense } from "react";
import ResetPasswordScreen from "../../../components/screens/ResetPasswordScreen";

export default function ResetPasswordPage() {
  return (
    <main className="auth-stage">
      <Suspense fallback={<div className="auth-check">Preparing password reset...</div>}>
        <ResetPasswordScreen />
      </Suspense>
    </main>
  );
}
