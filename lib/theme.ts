export type Theme = "light" | "dark";

export const THEME_KEY = "gabi-theme";
/** Fired on window after the theme attribute changes. */
export const THEME_CHANGE = "gabi:theme";

/**
 * Runs in <head> before first paint so the page never flashes the wrong theme.
 * A saved choice wins; otherwise follow the system setting.
 */
export const THEME_SCRIPT = `try{var t=localStorage.getItem("${THEME_KEY}");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="dark"}`;

export const getTheme = (): Theme =>
  typeof document !== "undefined" && document.documentElement.dataset.theme === "light" ? "light" : "dark";

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
  window.dispatchEvent(new Event(THEME_CHANGE));
}

export function subscribeTheme(onChange: () => void) {
  window.addEventListener(THEME_CHANGE, onChange);
  return () => window.removeEventListener(THEME_CHANGE, onChange);
}
