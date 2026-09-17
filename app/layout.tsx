import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Torah Scroll",
  description: "A feed worth scrolling. Torah learning instead of doomscrolling.",
  applicationName: "Torah Scroll",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  // Lets "Add to Home Screen" open without browser chrome on iOS.
  appleWebApp: {
    capable: true,
    title: "Torah Scroll",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Phones have a notch and a home indicator; let the page paint behind them.
  viewportFit: "cover",
  themeColor: "#1e6b5e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="parchment-bg min-h-screen font-serif antialiased">{children}</body>
    </html>
  );
}
