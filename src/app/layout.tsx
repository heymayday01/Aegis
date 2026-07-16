import type { Metadata } from "next";
import { Geist, JetBrains_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aegis — Verify, don't trust.",
  description:
    "A local-first redaction layer for AI. Strip PII before it leaves your device. Tamper-evident audit chain. Streaming-aware. $0 infra.",
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
      "Local-first, provider-agnostic redaction layer with a tamper-evident hash-chained audit log. Zero infrastructure cost.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aegis — Verify, don't trust.",
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
        className={`${geistSans.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
