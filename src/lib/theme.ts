export type Theme = "light" | "dark";

export const THEME_COOKIE = "theme";
export const DEFAULT_THEME: Theme = "dark";

export function isTheme(value: string | undefined): value is Theme {
  return value === "light" || value === "dark";
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=31536000; SameSite=Lax`;
}
