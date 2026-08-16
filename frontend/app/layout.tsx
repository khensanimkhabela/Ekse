import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ekse — Shine Yakithi",
  description: "Fimiya: the AI-powered creative economy platform for South African artists.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body text-textBody">{children}</body>
    </html>
  );
}
