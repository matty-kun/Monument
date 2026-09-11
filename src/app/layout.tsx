import "./globals.css";
import Navbar from "../components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Suspense } from "react";
import MobileOnlyWrapper from "@/components/MobileOnlyWrapper";

export const metadata = {
  metadataBase: new URL("https://citefest.vercel.app"),
  title: "Podium | MONUMENT",
  description: "See the real-time team standings, medal counts, and total points for MONUMENT. Who will take the podium?",
  openGraph: {
    title: "Podium | MONUMENT",
    description: "Real-time team standings for MONUMENT.",
    url: "https://citefest.vercel.app",
    siteName: "MONUMENT",
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
    title: "MONUMENT",
    description: "MONUMENT — Real-time Intramural Score Tracking System",
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
