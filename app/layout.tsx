import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Torah Scroll",
  description: "A feed worth scrolling. Torah learning instead of doomscrolling.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1e6b5e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="parchment-bg min-h-screen font-serif antialiased">{children}</body>
    </html>
  );
}
