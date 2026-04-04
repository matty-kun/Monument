import "./globals.css";
import Navbar from "../components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata = {
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
      <body className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
        <ThemeProvider>
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
