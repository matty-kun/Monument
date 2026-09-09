"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { usePathname } from "next/navigation";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Avoid hydration mismatch
  }

  // Hide the floating theme toggle on admin routes since it has its own sidebar toggle
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="fixed top-4 right-4 z-50 p-2.5 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-md border border-gray-200 dark:border-white/10 shadow-lg transition-all hover:scale-105 active:scale-95 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
      aria-label="Toggle Theme"
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
}
