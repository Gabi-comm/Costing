"use client";

import { useEffect, useRef, type RefObject } from "react";
import { PORTRAIT } from "@/lib/portrait-data";
import { INTRO_REVEAL, introPlaying } from "./Intro";
import { getTheme, subscribeTheme } from "@/lib/theme";

const FROST = "202, 220, 234";
const WARM = "244, 177, 131";
/**
 * The portrait stays light-on-dark in both themes (inverting it would read as a
 * photo negative). In daylight it sits in a pool of deep blue sky instead of
 * night, and the open field turns steel so it shows on the pale page.
 */
const THEMES = {
  dark: { field: FROST, pool: "3, 8, 18", poolAlpha: [0.55, 0.22], poolSize: 0.55 },
  light: { field: "75, 112, 141", pool: "40, 72, 104", poolAlpha: [0.82, 0.4], poolSize: 0.66 },
};
const BUCKETS = 16;
/** Dots smaller than this radius (CSS px) are drawn as squares. */
const SQUARE_BELOW = 1.5;
/** Strength of the photo's backdrop dots; the ambient field continues at this level. */
const AMBIENT = 0.22;
/** Feather widths, in portrait cells, where the photo dissolves into the field. */
const EDGE_FEATHER = 14;
const BOTTOM_FEATHER = 34;

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
/** Stable per-cell noise in [0, 1) so the dissolve is dithered, not a straight line. */
const hash = (x: number, y: number) => {
  const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return h - Math.floor(h);
};

/**
 * Halftone field that fills its positioned parent. The portrait is drawn into
 * the same dot lattice at the position of `anchorRef`, and its backdrop runs
 * on as an ambient field, so the photo has no edge. Dots spring away from the
 * pointer and settle back; a slow wave runs while idle.
 */
export default function DotPortrait({ anchorRef }: { anchorRef: RefObject<HTMLElement | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const anchor = anchorRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !anchor || !ctx) return;

    const { cols, rows, levels, warm } = PORTRAIT;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let n = 0;
    let hx = new Float32Array(0), hy = new Float32Array(0);
    let px = new Float32Array(0), py = new Float32Array(0);
    let vx = new Float32Array(0), vy = new Float32Array(0);
    let radius = new Float32Array(0), wave = new Float32Array(0);
    // Dots grouped by color and opacity so each group is one fill() per frame.
    let groups: { style: string; dots: number[] }[] = [];
    let width = 0, height = 0, cell = 0;
    let halo = { x: 0, y: 0, r: 0 };
    let look = THEMES[getTheme()];
    let assembled = reduceMotion;
    // While the intro covers the page the dots wait scattered, then gather as the sand clears.
    let held = introPlaying();
    const onReveal = () => {
      held = false;
      start();
    };
    window.addEventListener(INTRO_REVEAL, onReveal);

    const layout = () => {
      // Tens of thousands of dots redraw every frame; past 1.5x the extra pixels cost more than they show.
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      if (!width || !height) return;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const c = canvas.getBoundingClientRect();
      const a = anchor.getBoundingClientRect();
      cell = a.width / cols;
      const left = a.left - c.left, top = a.top - c.top;
      // Lattice origin chosen so portrait cells land exactly on grid points.
      const ox = ((left % cell) + cell) % cell, oy = ((top % cell) + cell) % cell;
      const shiftX = Math.round((left - ox) / cell), shiftY = Math.round((top - oy) / cell);
      const gw = Math.ceil(width / cell), gh = Math.ceil(height / cell);
      const portraitBottom = (top + a.height) / height;
      look = THEMES[getTheme()];
      halo = { x: left + a.width / 2, y: top + a.height * 0.42, r: a.width * look.poolSize };

      const sf: number[] = [], sx: number[] = [], sy: number[] = [], ss: number[] = [], sw: number[] = [], sm: number[] = [];
      for (let gy = 0; gy < gh; gy++) {
        const fy = ((gy + 0.5) * cell + oy) / height;
        // Fade in under the light sky, fade out before the next section.
        const field = smooth(0.03, 0.14, fy) * (1 - smooth(Math.min(0.6, portraitBottom - 0.2), 1, fy));
        if (field <= 0) continue;
        for (let gx = 0; gx < gw; gx++) {
          const x = gx - shiftX, y = gy - shiftY;
          // Distance (in cells) outside the portrait box; the field glows around it.
          const dx = Math.max(-x, 0, x - (cols - 1)), dy = Math.max(-y, 0, y - (rows - 1));
          const aura = 0.35 + 0.65 * Math.exp(-((dx * dx + dy * dy) / (34 * 34)));
          let s = AMBIENT * aura, m = 0, isWarm = false;
          if (dx === 0 && dy === 0) {
            const i = y * cols + x;
            // Shirt dissolves slowly and unevenly into the field below.
            const bottom = (rows - 1 - y) / BOTTOM_FEATHER;
            const dissolve = smooth(0, 1, bottom + (hash(x, y) - 0.5) * 0.35) ** 1.6;
            m = Math.min(smooth(0, 1, Math.min(x, cols - 1 - x, y) / EDGE_FEATHER), dissolve);
            s = s * (1 - m) + (parseInt(levels[i], 16) / 15) * m;
            isWarm = warm[i] === "1" && m > 0.5;
          }
          s *= field;
          if (s < 0.012) continue;
          sx.push((gx + 0.5) * cell + ox);
          sy.push((gy + 0.5) * cell + oy);
          ss.push(isWarm ? -s : s);
          // Field tone outside the pool of sky, frost inside it, with a dithered seam.
          const px0 = (gx + 0.5) * cell + ox - halo.x, py0 = (gy + 0.5) * cell + oy - halo.y;
          const out = Math.hypot(px0, py0) / halo.r > 0.62 + (hash(gx, gy) - 0.5) * 0.4;
          sf.push(!isWarm && out && (m < 0.5 || s < 0.5) ? 1 : 0);
          sw.push(0.1 + 0.22 * (1 - m));
          sm.push(m);
        }
      }

      n = sx.length;
      hx = Float32Array.from(sx);
      hy = Float32Array.from(sy);
      px = new Float32Array(n);
      py = new Float32Array(n);
      vx = new Float32Array(n);
      vy = new Float32Array(n);
      radius = new Float32Array(n);
      wave = Float32Array.from(sw);
      groups = [];
      for (const rgb of [FROST, WARM, look.field])
        for (let b = 0; b < BUCKETS; b++)
          groups.push({ style: `rgba(${rgb}, ${(0.35 + 0.65 * (b / (BUCKETS - 1))).toFixed(3)})`, dots: [] });

      for (let k = 0; k < n; k++) {
        const s = Math.abs(ss[k]);
        // No minimum size: faint dots shrink away instead of stopping at a line.
        radius[k] = Math.pow(s, 0.8) * cell * 0.62;
        groups[(ss[k] < 0 ? BUCKETS : sf[k] ? BUCKETS * 2 : 0) + Math.min(BUCKETS - 1, Math.round(s * (BUCKETS - 1)))].dots.push(k);
        if (assembled) {
          px[k] = hx[k];
          py[k] = hy[k];
        } else {
          // First paint: the field gathers in from a scattered, wider spread.
          const spread = 1.35 + Math.random() * 0.5 + (1 - sm[k]) * 0.4;
          px[k] = halo.x + (hx[k] - halo.x) * spread + (Math.random() - 0.5) * cell * 12;
          py[k] = halo.y + (hy[k] - halo.y) * spread + (Math.random() - 0.5) * cell * 12;
        }
      }
      assembled = true;
    };

    const pointer = { x: 0, y: 0, active: false };
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = pointer.x >= 0 && pointer.y >= 0 && pointer.x <= rect.width && pointer.y <= rect.height;
    };
    const onLeave = () => (pointer.active = false);
    const onUp = (e: PointerEvent) => e.pointerType !== "mouse" && onLeave();

    let raf = 0, visible = true, t = 0;
    const frame = () => {
      raf = 0;
      // Nothing to show while the intro covers the hero; the loop restarts on reveal.
      if (!visible || held) return;
      t += reduceMotion ? 0 : 0.016;
      const R = cell * 10;
      const R2 = R * R;

      for (let k = 0; k < n; k++) {
        let tx = hx[k], ty = hy[k];
        if (pointer.active) {
          const dx = hx[k] - pointer.x, dy = hy[k] - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < R2 && d2 > 0.01) {
            const d = Math.sqrt(d2);
            const push = (1 - d / R) ** 2 * cell * 4.5;
            tx += (dx / d) * push;
            ty += (dy / d) * push;
          }
        }
        vx[k] = (vx[k] + (tx - px[k]) * 0.14) * 0.78;
        vy[k] = (vy[k] + (ty - py[k]) * 0.14) * 0.78;
        px[k] += vx[k];
        py[k] += vy[k];
      }

      ctx.clearRect(0, 0, width, height);
      // Dark pool behind the subject so the face reads against the sky.
      const g = ctx.createRadialGradient(halo.x, halo.y, 0, halo.x, halo.y, halo.r);
      g.addColorStop(0, `rgba(${look.pool}, ${look.poolAlpha[0]})`);
      g.addColorStop(0.7, `rgba(${look.pool}, ${look.poolAlpha[1]})`);
      g.addColorStop(1, `rgba(${look.pool}, 0)`);
      ctx.fillStyle = g;
      ctx.fillRect(halo.x - halo.r, halo.y - halo.r, halo.r * 2, halo.r * 2);

      for (const grp of groups) {
        if (!grp.dots.length) continue;
        ctx.beginPath();
        for (const k of grp.dots) {
          // Slow diagonal swell; strongest out in the ambient field.
          const r = radius[k] * (1 + wave[k] * Math.sin(t * 1.4 - hx[k] * 0.012 - hy[k] * 0.018));
          if (r < 0.25) continue;
          if (r < SQUARE_BELOW) {
            // At a pixel or two a square of equal area looks the same and fills far faster.
            const side = r * 1.7725;
            ctx.rect(px[k] - side / 2, py[k] - side / 2, side, side);
          } else {
            ctx.moveTo(px[k] + r, py[k]);
            ctx.arc(px[k], py[k], r, 0, Math.PI * 2);
          }
        }
        ctx.fillStyle = grp.style;
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    layout();
    start();

    const ro = new ResizeObserver(() => layout());
    const unsubscribeTheme = subscribeTheme(layout);
    ro.observe(canvas);
    ro.observe(anchor);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    });
    io.observe(canvas);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    document.documentElement.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener(INTRO_REVEAL, onReveal);
      ro.disconnect();
      unsubscribeTheme();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [anchorRef]);

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}
