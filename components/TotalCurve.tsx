"use client";

import { useEffect, useRef } from "react";

const W = 300;
const DOT_X = 255;
/** Totals at or above this put the dot at the top of the graph. */
const TOP_TOTAL = 60000;

/** 0 → 1 on a log scale, so small quotes still move the dot visibly. */
const levelFor = (total: number) => Math.min(1, Math.log1p(total / 1000) / Math.log1p(TOP_TOTAL / 1000));
const yFor = (level: number) => 82 - level * 66;

/**
 * Line graph behind the total. The line drifts while idle; the glowing point
 * rises with the quote total and the line bends to meet it.
 */
export default function TotalCurve({ total }: { total: number }) {
  const pathRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const target = useRef(yFor(levelFor(total)));
  const redraw = useRef<() => void>(() => {});

  useEffect(() => {
    target.current = yFor(levelFor(total));
  }, [total]);

  useEffect(() => {
    const path = pathRef.current;
    const dot = dotRef.current;
    if (!path || !dot) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let y = target.current;
    let vy = 0;
    let t = 0;
    let raf = 0;

    const draw = () => {
      if (reduceMotion) {
        y = target.current;
      } else {
        t += 0.016;
        // Springy follow so the point overshoots slightly, then settles.
        vy = (vy + (target.current - y) * 0.06) * 0.84;
        y += vy;
      }
      const bob = reduceMotion ? 0 : Math.sin(t * 1.3) * 1.6;
      const dotY = y + bob;

      let d = "";
      for (let x = 0; x <= W; x += 5) {
        let py: number;
        if (x <= DOT_X) {
          const p = x / DOT_X;
          const ease = p * p * (3 - 2 * p);
          // Wiggles fade out toward the point so the line always meets it.
          const env = Math.sin(Math.PI * p) * (1 - p * 0.6);
          const wave =
            Math.sin(x * 0.045 + t * 0.9) * 9 + Math.sin(x * 0.11 - t * 1.4) * 4;
          py = 90 + (dotY - 90) * ease + wave * env;
        } else {
          py = dotY - (x - DOT_X) * 0.06 + Math.sin(t * 1.1 + x * 0.05) * 0.6;
        }
        d += `${x === 0 ? "M" : "L"}${x} ${py.toFixed(2)}`;
      }
      path.setAttribute("d", d);
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
    io.observe(path);
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
        <path
          ref={pathRef}
          fill="none"
          stroke="rgba(237,243,248,0.6)"
          strokeWidth="1.3"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span
        ref={dotRef}
        className="absolute grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-frost/10"
        style={{ left: `${(DOT_X / W) * 100}%`, top: `${yFor(levelFor(total))}%` }}
      >
        <span className="grid h-6 w-6 place-items-center rounded-full bg-frost/20">
          <span className="h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
        </span>
      </span>
    </div>
  );
}
