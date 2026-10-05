import { Plus_Jakarta_Sans } from "next/font/google";
import LandingPage from "../components/landing/LandingPage";

const landingFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-landing",
  display: "swap"
});

export const metadata = {
  title: "GenContent Studio | AI-Powered Content Creation",
  description:
    "Generate, improve, optimise and collaborate on written and visual content in one intelligent workspace."
};

export default function Home() {
  return (
    <div className={landingFont.variable}>
      <LandingPage />
    </div>
  );
}
