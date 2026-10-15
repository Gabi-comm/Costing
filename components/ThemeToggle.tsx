"use client";

import { useSyncExternalStore, type CSSProperties, type MouseEvent } from "react";
import { applyTheme, getTheme, subscribeTheme } from "@/lib/theme";

/** Sun/moon switch. The new theme opens out from the button as a circle. */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, () => null);
  const next = theme === "light" ? "dark" : "light";
  // Shows the moon in light mode (tap for night), the sun in dark mode.
  const moon = theme === "light";

  const toggle = (e: MouseEvent<HTMLButtonElement>) => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !document.startViewTransition) {
      applyTheme(next);
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const transition = document.startViewTransition(() => applyTheme(next));
    transition.ready.then(() =>
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 750, easing: "cubic-bezier(0.65, 0, 0.35, 1)", pseudoElement: "::view-transition-new(root)" },
      ),
    );
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      title={theme === "light" ? "Dark mode" : "Light mode"}
      className={`group relative grid h-10 w-10 place-items-center overflow-hidden rounded-full ${className}`}
    >
      {/* Sun: rays fold in and the disc swells into the moon's body. */}
      <svg viewBox="0 0 24 24" aria-hidden className="h-[18px] w-[18px] transition-transform duration-500 ease-out group-hover:rotate-12">
        <mask id="theme-moon">
          <rect width="24" height="24" fill="white" />
          <circle
            r="6.5"
            fill="black"
            style={{ cx: moon ? 17 : 26, cy: moon ? 7 : 0, transition: "cx 500ms ease-out, cy 500ms ease-out" } as CSSProperties}
          />
        </mask>
        <circle
          cx="12"
          cy="12"
          fill="currentColor"
          mask="url(#theme-moon)"
          style={{ r: moon ? 8 : 4.5, transition: "r 500ms ease-out" } as CSSProperties}
        />
        <g
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          className={`origin-center transition-all duration-500 ease-out ${moon ? "scale-50 opacity-0" : "opacity-100"}`}
        >
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <line key={a} x1="12" y1="2.5" x2="12" y2="4.5" transform={`rotate(${a} 12 12)`} />
          ))}
        </g>
      </svg>
    </button>
  );
}
