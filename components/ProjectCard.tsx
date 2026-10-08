"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Project } from "@/lib/projects";

/**
 * Glass project card: the intro video with the title underneath. Hovering (or
 * tapping "Details" on touch screens) reveals what the project is and a strip of
 * page screenshots; clicking a screenshot opens it full size.
 */
export default function ProjectCard({ project }: { project: Project }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState<number | null>(null);

  // Play only while on screen, and not at all for reduced motion.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) v.play().catch(() => {});
      else v.pause();
    }, { threshold: 0.25 });
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <article className="glass group min-w-0 rounded-[28px] p-2.5 sm:p-3">
      <div className="relative">
        <div className="relative aspect-video overflow-hidden rounded-[20px] bg-night">
          <video
            ref={videoRef}
            src={project.video}
            poster={project.shots[0]?.src}
            muted
            loop
            playsInline
            preload="metadata"
            className="h-full w-full object-cover transition duration-500 md:group-hover:scale-[1.02] md:group-hover:blur-[2px]"
          />
          <div className="pointer-events-none absolute inset-0 rounded-[20px] ring-1 ring-inset ring-white/10" />
        </div>

        {/* Details: over the video on md+ (hover / focus), below it on phones (tap). */}
        <div
          className={`${open ? "block" : "hidden"} mt-3 rounded-[20px] bg-night/75 p-5 backdrop-blur-xl [scrollbar-width:thin] [scrollbar-color:rgba(144,176,199,0.35)_transparent] md:absolute md:inset-0 md:mt-0 md:block md:overflow-y-auto md:p-5 md:opacity-0 md:transition md:duration-300 md:group-hover:opacity-100 md:group-focus-within:opacity-100 ${open ? "md:opacity-100" : "md:pointer-events-none md:group-hover:pointer-events-auto md:group-focus-within:pointer-events-auto"}`}
        >
          <div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-mist">Showcase</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink">{project.summary}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {project.stack.map((s) => (
                  <span key={s} className="rounded-full border border-line bg-surface px-2.5 py-0.5 text-[11px] text-frost">
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <ul className="mt-4 grid gap-x-5 gap-y-1.5 text-xs text-mist sm:grid-cols-2">
              {project.highlights.map((h) => (
                <li key={h} className="flex gap-2.5">
                  <span aria-hidden className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-frost shadow-[0_0_8px_rgba(202,220,234,0.8)]" />
                  {h}
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-mist">Every page</p>
          <div className="-mx-1 mt-2 flex snap-x gap-2.5 overflow-x-auto px-1 pb-3 [scrollbar-width:thin] [scrollbar-color:rgba(144,176,199,0.35)_transparent]">
            {project.shots.map((shot, i) => (
              <button
                key={shot.src}
                type="button"
                onClick={() => setViewing(i)}
                className="group/shot w-32 shrink-0 snap-start text-left sm:w-36"
              >
                <span className="block overflow-hidden rounded-xl border border-line bg-night">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={shot.src}
                    alt={`${project.title} — ${shot.label}`}
                    loading="lazy"
                    className="aspect-video w-full object-cover object-top transition duration-300 group-hover/shot:scale-105"
                  />
                </span>
                <span className="mt-1.5 block truncate text-xs text-mist group-hover/shot:text-frost">{shot.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between gap-4 px-2 pb-2 pt-4 sm:px-3">
        <div>
          <h3 className="font-display text-xl tracking-tight text-ink sm:text-2xl">{project.title}</h3>
          <p className="mt-1 text-sm text-mist">{project.tagline}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="shrink-0 rounded-full border border-line px-4 py-2 text-sm text-ink transition hover:border-mist hover:text-frost md:hidden"
        >
          {open ? "Hide" : "Details"}
        </button>
      </div>

      {viewing !== null && (
        <Lightbox shots={project.shots} title={project.title} index={viewing} onIndex={setViewing} onClose={() => setViewing(null)} />
      )}
    </article>
  );
}

function Lightbox({
  shots,
  title,
  index,
  onIndex,
  onClose,
}: {
  shots: Project["shots"];
  title: string;
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const step = useCallback((d: number) => onIndex((index + d + shots.length) % shots.length), [index, onIndex, shots.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, step]);

  const shot = shots[index];
  const nav = "grid h-11 w-11 place-items-center rounded-full border border-line bg-night/70 text-lg text-ink transition hover:border-mist hover:text-frost";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} screenshots`}
      className="fixed inset-0 z-50 flex flex-col bg-[#030812]/90 p-4 backdrop-blur-md sm:p-8"
      onClick={onClose}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 pb-3 text-sm" onClick={(e) => e.stopPropagation()}>
        <p className="text-ink">
          {shot.label} <span className="tnum text-mist">· {index + 1}/{shots.length}</span>
        </p>
        <button type="button" onClick={onClose} className={nav} aria-label="Close">
          ×
        </button>
      </div>
      <div className="relative mx-auto flex min-h-0 w-full max-w-6xl flex-1 items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={shot.src} alt={`${title} — ${shot.label}`} className="max-h-full max-w-full rounded-2xl border border-line object-contain shadow-2xl" />
        <button type="button" onClick={() => step(-1)} className={`${nav} absolute left-0 sm:-left-14`} aria-label="Previous screenshot">
          ‹
        </button>
        <button type="button" onClick={() => step(1)} className={`${nav} absolute right-0 sm:-right-14`} aria-label="Next screenshot">
          ›
        </button>
      </div>
    </div>
  );
}
