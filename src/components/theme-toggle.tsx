"use client";

import { useState } from "react";
import { applyTheme, type Theme } from "@/lib/theme";

const OPTIONS: Theme[] = ["light", "dark"];

export function ThemeToggle({ initialTheme }: { initialTheme: Theme }) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  function setTheme(next: Theme) {
    setThemeState(next);
    applyTheme(next);
  }

  return (
    <div className="inline-flex rounded-lg border border-border p-1">
      {OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setTheme(option)}
          aria-pressed={theme === option}
          className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
            theme === option
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
