import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

// One type family: Archivo (wdth axis loaded so font-stretch works).
// --font-body is set by the class below; display and data alias it.
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-body",
  display: "swap",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sendrow: The practice platform for climate consultants",
  description:
    "Turn a client's messy data into one audited emissions inventory, then answer every buyer and regulator format from it, under your brand.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const archivoAliases = {
  "--font-display": "var(--font-body)",
  "--font-data": "var(--font-body)",
} as React.CSSProperties;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={archivo.variable} style={archivoAliases}>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
