import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "LocalSpot – Discover the Best Local Businesses",
  description: "Find and support local businesses in your community. Read reviews, discover deals, and connect with shops, restaurants, and services near you.",
  keywords: "local businesses, small business, community, restaurants, shops, services, reviews",
  openGraph: {
    title: "LocalSpot – Discover the Best Local Businesses",
    description: "Your community marketplace for discovering local businesses, deals, and services.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
