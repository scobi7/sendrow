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
    <ClerkProvider
      // Sign-up is in Clerk's Waitlist mode; its "Join waitlist" links point here.
      waitlistUrl="/request-access"
      appearance={{
        // Clerk takes literal colors, so these mirror the 4c tokens in app/globals.css.
        variables: {
          colorPrimary: "#0A7346",
          colorText: "#0D2A1E",
          colorTextSecondary: "#3D5A4C",
          colorBackground: "#FFFFFF",
          colorInputBackground: "#FFFFFF",
          colorInputText: "#0D2A1E",
          borderRadius: "10px",
          fontFamily: "var(--font-body), Archivo, sans-serif",
        },
      }}
    >
      <html lang="en" className={archivo.variable} style={archivoAliases}>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
