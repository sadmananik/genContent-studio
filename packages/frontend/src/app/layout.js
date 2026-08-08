import "./globals.css";

export const metadata = {
  title: "GenContent Studio",
  description: "AI-driven content creation platform"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
