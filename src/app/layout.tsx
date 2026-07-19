import type { Metadata } from "next";
import { Geist, JetBrains_Mono, Instrument_Serif, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SmoothScrollProvider } from "@/components/aegis/smooth-scroll-provider";
import { AmbientBackground } from "@/components/aegis/ambient-background";

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

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aegis — Verify, don't trust.",
  description:
    "A local-first redaction layer for AI. Liquid-glass interface, streaming-aware redaction, tamper-evident audit chain. $0 infra.",
  keywords: [
    "Aegis",
    "AI redaction",
    "PII detection",
    "liquid glass",
    "tamper-evident audit",
    "local-first",
    "LLM privacy",
  ],
  authors: [{ name: "Aegis" }],
  openGraph: {
    title: "Aegis — Verify, don't trust.",
    description:
      "Local-first, provider-agnostic redaction layer with a tamper-evident hash-chained audit log.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aegis — Verify, don't trust.",
    description:
      "Strip sensitive data before it leaves your device. Cryptographically provable audit trail.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* JSON-LD structured data for rich search results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Aegis',
              applicationCategory: 'SecurityApplication',
              operatingSystem: 'Web',
              description:
                'A local-first redaction layer for AI. Strip PII before it leaves your device. Tamper-evident audit chain. Streaming-aware.',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
              featureList: [
                '8 entity-type PII detection (email, API keys, cards, Aadhaar, PAN, IP, glossary)',
                'SHA-256 hash-chained tamper-evident audit log',
                'Streaming-aware redaction with sliding window',
                'Reversible tokenization with round-trip proof',
                'Compliance report export (CSV/JSON)',
              ],
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable} ${spaceGrotesk.variable} antialiased bg-background text-foreground`}
      >
        <SmoothScrollProvider>
          <AmbientBackground />
          {children}
          <Toaster richColors position="bottom-right" />
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
