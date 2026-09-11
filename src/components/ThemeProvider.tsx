"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { usePathname } from "next/navigation";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" forcedTheme={isAdmin ? undefined : "dark"}>
      {children}
    </NextThemesProvider>
  );
}
