"use client";

import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export function TopBarThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("cms-theme");
    if (saved === "dark") {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    } else {
      setTheme("light");
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    root.classList.add("cms-theme-switching");
    if (theme === "light") {
      setTheme("dark");
      root.classList.add("dark");
      localStorage.setItem("cms-theme", "dark");
    } else {
      setTheme("light");
      root.classList.remove("dark");
      localStorage.setItem("cms-theme", "light");
    }
    window.requestAnimationFrame(() => {
      window.setTimeout(() => root.classList.remove("cms-theme-switching"), 60);
    });
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="min-w-[44px] min-h-[44px] lg:min-w-8 lg:min-h-8 lg:w-8 lg:h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer border select-none bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200/90 hover:border-slate-300 shadow-2xs dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
      title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
      aria-label="Toggle theme"
    >
      {mounted && theme === "dark" ? (
        <Moon className="w-4 h-4 text-sky-400 fill-sky-400/20" />
      ) : (
        <Sun className="w-4 h-4 text-amber-500 fill-amber-500/20" />
      )}
    </button>
  );
}
