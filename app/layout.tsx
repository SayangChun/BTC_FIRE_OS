import type { Metadata, Viewport } from "next";

import { ErrorBoundary } from "@/components/error-boundary";
import "./globals.css";

export const metadata: Metadata = {
  title: "BTC FIRE OS",
  description: "A Bitcoin FIRE dashboard for long-term holders.",
  manifest: "manifest.webmanifest",
  icons: {
    icon: [
      { url: "favicon.svg", type: "image/svg+xml" },
      { url: "icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#F7931A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
