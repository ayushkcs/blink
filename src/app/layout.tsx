import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blink — Instant P2P File Sharing",
  description:
    "Zero setup, zero sign-up. Share any file instantly with anyone on your network. Files transfer directly between browsers — never touch a server.",
  keywords: ["file sharing", "P2P", "WebRTC", "peer to peer", "serverless", "instant transfer"],
  openGraph: {
    title: "Blink — Instant P2P File Sharing",
    description: "Share any file instantly. No setup. No sign-up. Peer-to-peer.",
    type: "website",
  },
};

import { Analytics } from "@vercel/analytics/react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
