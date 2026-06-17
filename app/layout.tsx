import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Manrope, Space_Mono } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-data",
  display: "swap",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "GreenTrack — ESG reporting in days, not months",
  description:
    "GreenTrack connects to your existing systems, calculates your emissions, and generates a report your customer will accept.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${manrope.variable} ${spaceMono.variable}`}>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
