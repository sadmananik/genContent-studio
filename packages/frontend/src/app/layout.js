import "./globals.css";

export const metadata = {
  title: "GenContent Studio",
  description: "AI-driven content creation platform",
  icons: {
    icon: "/gencontent-logo.png",
    shortcut: "/gencontent-logo.png",
    apple: "/gencontent-logo.png"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
