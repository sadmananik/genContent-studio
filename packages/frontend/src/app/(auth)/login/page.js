import { Plus_Jakarta_Sans } from "next/font/google";
import LoginScreen from "../../../components/screens/LoginScreen";

const signinFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-landing",
  display: "swap"
});

export const metadata = {
  title: "Sign In | GenContent Studio",
  description: "Sign in to continue creating with GenContent Studio."
};

export default function LoginPage() {
  return (
    <main className={signinFont.variable}>
      <LoginScreen />
    </main>
  );
}
