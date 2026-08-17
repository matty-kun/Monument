import "./globals.css";
import Navbar from "../components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Suspense } from "react";
import MobileOnlyWrapper from "@/components/MobileOnlyWrapper";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata = {
  metadataBase: new URL("https://citefest.vercel.app"),
  title: "Podium | CITE FEST 2026",
  description: "See the real-time team standings, medal counts, and total points for the CITE FEST 2026. Who will take the podium?",
  openGraph: {
    title: "Podium | CITE FEST 2026",
    description: "Real-time team standings for the CITE FEST test.",
    url: "https://citefest.vercel.app",
    siteName: "CITE FEST",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Monument Open Graph Image",
      },
    ],
  },
  icons: {
    icon: "/monument-logo.png",
  },
  twitter: {
    card: "summary_large_image",
    title: "CITE FEST",
    description: "CITE FEST — Real-time Intramural Score Tracking System",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen bg-[#F5F5F7] dark:bg-black text-gray-900 dark:text-white pb-20 md:pb-0 selection:bg-blue-200 dark:selection:bg-blue-500/30 transition-colors">
        <ThemeProvider>
          <MobileOnlyWrapper>
            <ThemeToggle />
            <Suspense fallback={null}>
              <Navbar />
            </Suspense>
            <main className="flex-grow">
              {children}
            </main>
          </MobileOnlyWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
