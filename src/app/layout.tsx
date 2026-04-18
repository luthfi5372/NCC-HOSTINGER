import type { Metadata } from "next";
import { Inter, Josefin_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const josefin = Josefin_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NCC — National Creativity Competition 2026",
  description:
    "Kompetisi kreativitas nasional terbesar. Bergabung dalam Speech Contest, LKTI, MTQ, dan Olimpiade MIPA. Tunjukkan bakatmu dan raih prestasi di tingkat nasional.",
  keywords: [
    "NCC",
    "National Creativity Competition",
    "kompetisi nasional",
    "lomba",
    "speech contest",
    "LKTI",
    "MTQ",
    "olimpiade MIPA",
  ],
  openGraph: {
    title: "NCC — National Creativity Competition 2026",
    description: "Kompetisi kreativitas nasional terbesar. Tunjukkan bakatmu!",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${josefin.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col bg-background text-foreground relative"
        suppressHydrationWarning
      >
        <div className="glass-grain" />
        {children}
      </body>
    </html>
  );
}
