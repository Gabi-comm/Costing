"use client";

import { useRef } from "react";
import DotPortrait from "./DotPortrait";
import ThemeToggle from "./ThemeToggle";
import { PORTRAIT } from "@/lib/portrait-data";

export default function Hero() {
  const portraitRef = useRef<HTMLDivElement>(null);

  return (
    <section className="hero-sky relative flex min-h-[92svh] flex-col overflow-hidden">
      <DotPortrait anchorRef={portraitRef} />
      <nav style={{ "--d": "700ms" } as React.CSSProperties} className="intro-rise relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
        <span className="font-display text-lg font-semibold tracking-tight text-[#091525]">
          Gabi-<span className="font-serif text-xl font-normal italic">comm</span>
        </span>
        {/* The nav sits on the bright top of the sky in both themes, so its colours stay fixed. */}
        <div className="flex items-center gap-2">
          <ThemeToggle className="text-[#091525] transition hover:bg-[#091525]/10" />
          <a
            href="#calculator"
            className="rounded-full bg-[#091525] px-4 py-2 text-sm font-medium text-[#cadcea] transition hover:bg-[#203a53]"
          >
            Build a quote
          </a>
        </div>
      </nav>

      <div className="relative mx-auto grid w-full max-w-7xl flex-1 items-center gap-6 px-4 pb-6 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
        <div className="order-2 lg:order-1 lg:pt-24">
          <p style={{ "--d": "450ms" } as React.CSSProperties} className="intro-rise font-serif text-3xl italic text-frost sm:text-4xl">Welcome!</p>
          <h1 style={{ "--d": "600ms" } as React.CSSProperties} className="intro-rise headline mt-2 font-display text-5xl font-normal leading-[0.98] tracking-tight sm:text-7xl">
            Here are <span className="whitespace-nowrap">Gabi-comm&rsquo;s</span> <span className="font-serif italic text-frost">Works</span>
          </h1>
          <div style={{ "--d": "760ms" } as React.CSSProperties} className="intro-rise mt-8 flex flex-wrap gap-3">
          <a
            href="#projects"
            className="inline-flex items-center gap-2 rounded-full border border-line bg-night/40 px-5 py-3 text-sm font-semibold text-ink transition hover:border-mist hover:text-frost"
          >
            See projects
          </a>
          <a
            href="#calculator"
            className="inline-flex items-center gap-2 rounded-full bg-frost px-5 py-3 text-sm font-semibold text-night shadow-[0_10px_30px_-10px_rgba(202,220,234,0.6)] transition hover:bg-frost-hover"
          >
            Build a quote <span aria-hidden>↓</span>
          </a>
          </div>
        </div>

        <div className="relative order-1 mx-auto w-full max-w-[min(460px,86vw)] lg:order-2 lg:max-w-[620px] lg:pt-4">
          {/* Empty slot: the field canvas draws the portrait here. */}
          <div
            ref={portraitRef}
            role="img"
            aria-label="Dot-art portrait of Gabriel John Solomon"
            style={{ aspectRatio: `${PORTRAIT.cols} / ${PORTRAIT.rows}` }}
          />
        </div>
      </div>

      <div style={{ "--d": "1300ms" } as React.CSSProperties} className="intro-rise relative mx-auto flex w-full max-w-7xl items-end justify-end gap-4 px-4 pb-8 text-xs text-mist sm:px-6">
        <a href="#projects" className="flex items-center gap-2 transition hover:text-frost">
          Start
          <span aria-hidden className="grid h-7 w-7 place-items-center rounded-full border border-line">
            ↓
          </span>
        </a>
      </div>
    </section>
  );
}
