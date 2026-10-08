"use client";

import { useEffect, useRef } from "react";

const W = 300;
/** Where the point rests for an empty quote, and how far right it can go (viewBox units). */
const X_MIN = 18;
const X_MAX = 282;
/** Totals at or above this put the point at the far right. */
const TOP_TOTAL = 60000;

/** 0 → 1 on a log scale, so small quotes still move the point visibly. */
const levelFor = (total: number) => Math.min(1, Math.log1p(total / 1000) / Math.log1p(TOP_TOTAL / 1000));
const xFor = (total: number) => X_MIN + levelFor(total) * (X_MAX - X_MIN);

/** A rising line with a gentle drift; t animates the drift. */
const curveY = (x: number, t: number) => {
  const p = x / W;
  const trend = 84 - 58 * Math.pow(p, 1.15);
  const wave = Math.sin(x * 0.045 + t * 0.9) * 6 + Math.sin(x * 0.11 - t * 1.4) * 2.5;
  return trend + wave * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, p * 1.1)));
};

/**
 * Line graph behind the total. The line drifts while idle; the glowing point
 * travels left → right along it as the quote total grows.
 */
export default function TotalCurve({ total }: { total: number }) {
  const doneRef = useRef<SVGPathElement>(null);
  const restRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const target = useRef(xFor(total));
  const redraw = useRef<() => void>(() => {});

  useEffect(() => {
    target.current = xFor(total);
  }, [total]);

  useEffect(() => {
    const done = doneRef.current;
    const rest = restRef.current;
    const dot = dotRef.current;
    if (!done || !rest || !dot) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let x = target.current;
    let vx = 0;
    let t = 0;
    let raf = 0;

    const draw = () => {
      if (reduceMotion) {
        x = target.current;
      } else {
        t += 0.016;
        // Springy follow so the point overshoots slightly, then settles.
        vx = (vx + (target.current - x) * 0.05) * 0.84;
        x += vx;
      }

      // Bright line up to the point, faint line after it.
      let a = "", b = "";
      for (let px = 0; px <= W; px += 4) {
        const seg = `${px.toFixed(1)} ${curveY(px, t).toFixed(2)}`;
        if (px <= x) a += `${a ? "L" : "M"}${seg}`;
        if (px >= x - 4) b += `${b ? "L" : "M"}${seg}`;
      }
      const dotY = curveY(x, t);
      a += `L${x.toFixed(2)} ${dotY.toFixed(2)}`;
      done.setAttribute("d", a);
      rest.setAttribute("d", b);
      dot.style.left = `${(x / W) * 100}%`;
      dot.style.top = `${dotY}%`;
      if (!reduceMotion) raf = requestAnimationFrame(draw);
    };

    redraw.current = draw;
    draw();

    let visible = true;
    const io = new IntersectionObserver(([entry]) => {
      const was = visible;
      visible = entry.isIntersecting;
      if (visible && !was && !reduceMotion) raf = requestAnimationFrame(draw);
      if (!visible) cancelAnimationFrame(raf);
    });
    io.observe(done);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  // Reduced motion has no loop: redraw once whenever the total changes.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) redraw.current();
  }, [total]);

  return (
    <div aria-hidden className="pointer-events-none relative -mx-6 mb-4 mt-5 h-28">
      <div className="dot-grid absolute inset-0 [mask-image:linear-gradient(to_top,black,transparent)]" />
      <svg viewBox={`0 0 ${W} 100`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <path ref={restRef} fill="none" stroke="rgba(237,243,248,0.18)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
        <path ref={doneRef} fill="none" stroke="rgba(237,243,248,0.75)" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
      </svg>
      <span
        ref={dotRef}
        className="absolute grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-frost/10"
        style={{ left: `${(xFor(total) / W) * 100}%`, top: `${curveY(xFor(total), 0)}%` }}
      >
        <span className="grid h-6 w-6 place-items-center rounded-full bg-frost/20">
          <span className="h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
        </span>
      </span>
    </div>
  );
}
