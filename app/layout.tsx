import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Fraunces, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// "The Ledger" type system (docs/design-direction.md):
// serif speaks (Fraunces, headlines), sans works (Instrument Sans, UI/body),
// mono counts (IBM Plex Mono, every figure)
const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-data",
  display: "swap",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sendrow - The practice platform for climate consultants",
  description:
    "Turn a client's messy data into one audited emissions inventory, then answer every buyer and regulator format from it - under your brand.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${instrumentSans.variable} ${fraunces.variable} ${ibmPlexMono.variable}`}>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
