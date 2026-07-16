import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aegis — Local-First Trust & Redaction Layer for AI",
  description:
    "Aegis sits between you and any AI provider, strips sensitive data before it ever leaves your device, and gives a cryptographically provable audit trail of exactly what was sent where. Turn 'trust us' into 'verify it yourself.'",
  keywords: [
    "Aegis",
    "AI redaction",
    "PII detection",
    "data loss prevention",
    "MCP",
    "tamper-evident audit log",
    "local-first",
    "developer security",
    "LLM privacy",
  ],
  authors: [{ name: "Aegis" }],
  openGraph: {
    title: "Aegis — Verify, don't trust.",
    description:
      "Local-first, provider-agnostic redaction layer with a tamper-evident hash-chained audit log. Zero infrastructure cost. Open-source.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aegis — Local-First Trust & Redaction Layer for AI",
    description:
      "Strip sensitive data before it leaves your device. Cryptographically provable audit trail. $0 infra.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
