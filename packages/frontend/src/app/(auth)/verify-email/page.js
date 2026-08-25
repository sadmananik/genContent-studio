import { Suspense } from "react";
import VerifyEmailScreen from "../../../components/screens/VerifyEmailScreen";

export default function VerifyEmailPage() {
  return (
    <main className="auth-stage">
      <Suspense fallback={<div className="auth-check">Checking verification link...</div>}>
        <VerifyEmailScreen />
      </Suspense>
    </main>
  );
}
