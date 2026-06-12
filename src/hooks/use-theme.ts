import { useEffect, useState } from "react";

export type Theme = "light" | "dark";
const KEY = "fixflow-theme";

function read(): Theme {
  if (typeof window === "undefined") return "dark";
  const saved = localStorage.getItem(KEY) as Theme | null;
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function apply(t: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", t === "dark");
  root.style.colorScheme = t;
}

const listeners = new Set<(t: Theme) => void>();
let current: Theme = "dark";
let initialized = false;

function init() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  current = read();
  apply(current);
}

export function useTheme(): { theme: Theme; setTheme: (t: Theme) => void; toggle: () => void } {
  const [theme, setThemeState] = useState<Theme>(() => {
    init();
    return current;
  });
  useEffect(() => {
    init();
    const l = (t: Theme) => setThemeState(t);
    listeners.add(l);
    setThemeState(current);
    return () => {
      listeners.delete(l);
    };
  }, []);
  const setTheme = (t: Theme) => {
    current = t;
    localStorage.setItem(KEY, t);
    apply(t);
    listeners.forEach((l) => l(t));
  };
  return { theme, setTheme, toggle: () => setTheme(theme === "dark" ? "light" : "dark") };
}