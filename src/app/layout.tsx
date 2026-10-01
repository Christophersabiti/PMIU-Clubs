import type { Metadata, Viewport } from "next";
import { EB_Garamond, Inter } from "next/font/google";
import { ServiceWorker } from "@/components/ServiceWorker";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const garamond = EB_Garamond({ variable: "--font-garamond", subsets: ["latin"], weight: ["500", "600", "700"] });

export const metadata: Metadata = {
  title: { default: "PMI Uganda Clubs — Connect. Participate. Grow. Impact.", template: "%s · PMI Uganda Clubs" },
  description:
    "The digital engagement hub for PMI Uganda Chapter Clubs: discover clubs, join activities, register for events, connect with partners and track community impact.",
  applicationName: "PMI Uganda Clubs",
  appleWebApp: { capable: true, title: "PMI Clubs", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#1c0742", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${garamond.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <a href="#main" className="skip-link">Skip to content</a>
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
