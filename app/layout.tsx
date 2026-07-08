import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Fraunces, Instrument_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// "The Ledger" type system (docs/design-direction.md):
// serif speaks (headlines), sans works (UI/body), mono counts (every figure)
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-data",
  display: "swap",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sendrow — The practice platform for climate consultants",
  description:
    "Turn a client's messy data into one audited emissions inventory, then answer every buyer and regulator format from it — under your brand.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${fraunces.variable} ${instrumentSans.variable} ${plexMono.variable}`}>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
