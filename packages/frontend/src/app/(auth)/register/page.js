import { Suspense } from "react";
import RegisterScreen from "../../../components/screens/RegisterScreen";

export default function RegisterPage() {
  return (
    <main className="auth-stage">
      <Suspense fallback={<div className="auth-check">Preparing account form...</div>}>
        <RegisterScreen />
      </Suspense>
    </main>
  );
}
