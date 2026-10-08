"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Eases a displayed number toward `target` (ease-out cubic). */
export function useTweenedNumber(target: number, duration = 520) {
  const [value, setValue] = useState(target);
  const shown = useRef(target);

  useEffect(() => {
    const from = shown.current;
    const reduce = prefersReducedMotion();
    let start = 0;
    let raf = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const p = reduce ? 1 : Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      shown.current = Math.round(from + (target - from) * e);
      setValue(shown.current);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

/** Height + fade collapse driven by `open`; children stay mounted. */
export function Collapse({ open, children, className = "" }: { open: boolean; children: ReactNode; className?: string }) {
  return (
    <div
      aria-hidden={!open}
      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none ${
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      } ${className}`}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

/** Keeps the last non-empty value so collapsing rows don't flash "0" on the way out. */
export function useLastDefined<T>(value: T | null | undefined): T | null | undefined {
  const [last, setLast] = useState(value);
  if (value != null && value !== last) setLast(value);
  return value ?? last;
}

interface Keyed {
  key: string;
}

/**
 * Tracks items leaving a list so they can animate out before unmounting.
 * Returns current items plus recently removed ones, flagged `leaving`.
 */
export function usePresence<T extends Keyed>(items: T[], order: (key: string) => number, exitMs = 280) {
  const [prev, setPrev] = useState(items);
  const [leaving, setLeaving] = useState<T[]>([]);

  // Compare by keys, not array identity: callers usually pass a fresh array each render,
  // and updating state on identity alone would re-render forever.
  const signature = items.map((i) => i.key).join("|");
  const prevSignature = prev.map((i) => i.key).join("|");
  if (signature !== prevSignature) {
    const keys = new Set(items.map((i) => i.key));
    const removed = prev.filter((p) => !keys.has(p.key));
    setPrev(items);
    setLeaving((l) => [...l.filter((x) => !keys.has(x.key) && !removed.some((r) => r.key === x.key)), ...removed]);
  }

  useEffect(() => {
    if (!leaving.length) return;
    const t = setTimeout(() => setLeaving([]), exitMs);
    return () => clearTimeout(t);
  }, [leaving, exitMs]);

  return [...items.map((item) => ({ item, leaving: false })), ...leaving.map((item) => ({ item, leaving: true }))].sort(
    (a, b) => order(a.item.key) - order(b.item.key),
  );
}
