import { Suspense } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import RegisterScreen from "../../../components/screens/RegisterScreen";

const signinFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-landing",
  display: "swap"
});

export default function RegisterPage() {
  return (
    <main className={signinFont.variable}>
      <Suspense fallback={<div className="auth-check">Preparing account form...</div>}>
        <RegisterScreen />
      </Suspense>
    </main>
  );
}
