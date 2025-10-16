import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata = {
  title: "Monument",
  description: "Real-time Intramurals score tracking system",
  icons: {
    icon: '/monument-logo.png',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
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