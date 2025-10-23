import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata = {
  title: "Monument",
  description: "Real-time Intramural Score Tracking System",
  openGraph: {
    title: "Monument",
    description: "This Is Your Moment.",
    url: "https://themonument.vercel.app",
    siteName: "Monument",
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
    title: "Monument",
    description: "This Is Your Moment — Real-time Intramural Score Tracking System",
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
          <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
