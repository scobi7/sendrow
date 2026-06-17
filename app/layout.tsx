import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Quicksand, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-data",
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
      <html
        lang="en"
        className={`${quicksand.variable} ${inter.variable} ${plexMono.variable}`}
      >
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
