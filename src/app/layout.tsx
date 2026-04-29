import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Providers } from "@/shared/components/providers";
import { Nav } from "@/shared/components/nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trailmark Guild — Fort Worth Labor Marketplace",
  description: "Decentralized labor marketplace with on-chain reputation, bond coverage, and AI agents for Fort Worth workers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} antialiased`}>
      <body className="min-h-screen bg-white text-stone-900">
        <Providers>
          <Nav />
          <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
