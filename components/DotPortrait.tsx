"use client";

import { useEffect, useRef, type RefObject } from "react";
import { PORTRAIT } from "@/lib/portrait-data";
import { PORTRAIT_INK } from "@/lib/portrait-ink-data";
import { INTRO_REVEAL, introPlaying } from "./Intro";
import { getTheme, subscribeTheme } from "@/lib/theme";

const FROST = "202, 220, 234";
const WARM = "244, 177, 131";
/**
 * Night: light dots for brightness over a dark pool. Daylight: navy ink for
 * darkness on paper, like a printed halftone, from its own sampling of the
 * photo (scripts/make-portrait-ink.mjs) with the backdrop cut out.
 */
const THEMES = {
  // ambient: strength of the open field around the photo.
  dark: { ink: false, subject: FROST, warm: WARM, field: FROST, ambient: 0.22, pool: "3, 8, 18", poolAlpha: [0.55, 0.22], poolSize: 0.55 },
  light: { ink: true, subject: "23, 48, 77", warm: "201, 110, 64", field: "75, 112, 141", ambient: 0.035, pool: "", poolAlpha: [0, 0], poolSize: 0.55 },
};
/** Dots smaller than this radius (CSS px) are drawn as squares of equal area. */
const SQUARE_BELOW = 1.5;
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

const rgbOf = (s: string) => s.split(",").map(Number) as [number, number, number];

/**
 * Halftone field that fills its positioned parent. The portrait is drawn into
 * the same dot lattice at the position of `anchorRef`, and its backdrop runs
 * on as an ambient field, so the photo has no edge. Dots spring away from the
 * pointer and settle back; a slow wave runs while idle.
 */
export default function DotPortrait({ anchorRef }: { anchorRef: RefObject<HTMLElement | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poolRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const anchor = anchorRef.current;
    const pool = poolRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !anchor || !pool || !ctx) return;

    const { cols, rows } = PORTRAIT;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let n = 0;
    let hx = new Float32Array(0), hy = new Float32Array(0);
    let px = new Float32Array(0), py = new Float32Array(0);
    let vx = new Float32Array(0), vy = new Float32Array(0);
    let radius = new Float32Array(0), wave = new Float32Array(0);
    // Per-dot colour and opacity.
    let cr = new Uint8Array(0), cg = new Uint8Array(0), cb = new Uint8Array(0), ca = new Float32Array(0);
    // Dots are written straight into one pixel buffer and uploaded once per frame:
    // tens of thousands of separate draw calls swamp integrated GPUs.
    let img: ImageData | null = null, data = new Uint8ClampedArray(0), data32 = new Uint32Array(0);
    let dw = 0, dh = 0, dpr = 1;
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
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      if (!width || !height) return;
      dw = canvas.width = Math.round(width * dpr);
      dh = canvas.height = Math.round(height * dpr);
      img = ctx.createImageData(dw, dh);
      data = img.data;
      data32 = new Uint32Array(data.buffer);

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
      // Dark pool behind the subject so the face reads against the sky. It never
      // moves, so it is a plain CSS layer rather than repainted every frame.
      const [a0, a1] = look.poolAlpha;
      Object.assign(pool.style, {
        left: `${halo.x - halo.r}px`,
        top: `${halo.y - halo.r}px`,
        width: `${halo.r * 2}px`,
        height: `${halo.r * 2}px`,
        background: look.pool
          ? `radial-gradient(circle closest-side, rgba(${look.pool}, ${a0}), rgba(${look.pool}, ${a1}) 70%, rgba(${look.pool}, 0))`
          : "none",
      });

      // Night reads brightness; daylight reads ink, with how much of each dot is
      // the figure, so the cut-out edge is soft rather than stepped.
      const src = look.ink ? PORTRAIT_INK : PORTRAIT;
      // Tone per dot: 0 subject, 1 warm (the sunglasses), 2 field.
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
          const ambient = look.ambient * aura;
          let s = ambient, m = 0, isWarm = false, isSubject = false;
          if (dx === 0 && dy === 0) {
            const i = y * cols + x;
            // Shirt dissolves slowly and unevenly into the field below.
            const bottom = (rows - 1 - y) / BOTTOM_FEATHER;
            const dissolve = smooth(0, 1, bottom + (hash(x, y) - 0.5) * 0.35) ** 1.6;
            m = Math.min(smooth(0, 1, Math.min(x, cols - 1 - x, y) / EDGE_FEATHER), dissolve);
            const v = parseInt(src.levels[i], 16) / 15;
            const cover = look.ink ? parseInt(PORTRAIT_INK.cover[i], 16) / 15 : 1;
            // Where the backdrop shows through, daylight prints the plain field instead.
            const photo = ambient * (1 - cover) + v * cover;
            s = s * (1 - m) + photo * m;
            isWarm = src.warm[i] === "1" && m > 0.5;
            isSubject = m > 0.5 && cover > 0.5;
          }
          s *= field;
          if (s < 0.012) continue;
          sx.push((gx + 0.5) * cell + ox);
          sy.push((gy + 0.5) * cell + oy);
          ss.push(isWarm ? -s : s);
          sf.push(isWarm ? 1 : isSubject ? 0 : 2);
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
      cr = new Uint8Array(n);
      cg = new Uint8Array(n);
      cb = new Uint8Array(n);
      ca = new Float32Array(n);
      const tones = [rgbOf(look.subject), rgbOf(look.warm), rgbOf(look.field)];

      for (let k = 0; k < n; k++) {
        const s = Math.abs(ss[k]);
        // No minimum size: faint dots shrink away instead of stopping at a line.
        // Ink spreads by area, so its radius follows the square root of the tone.
        radius[k] = look.ink ? Math.sqrt(s) * cell * 0.56 : Math.pow(s, 0.8) * cell * 0.62;
        [cr[k], cg[k], cb[k]] = tones[sf[k]];
        ca[k] = (0.35 + 0.65 * Math.min(1, s)) * 255;
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

      if (!img) return;
      data32.fill(0);
      // Coverage-weighted pixel write; where dots overlap the stronger one wins.
      const plot = (ix: number, iy: number, cov: number, k: number) => {
        if (ix < 0 || iy < 0 || ix >= dw || iy >= dh || cov <= 0) return;
        const alpha = cov * ca[k];
        const i = (iy * dw + ix) * 4;
        if (alpha <= data[i + 3]) return;
        data[i] = cr[k];
        data[i + 1] = cg[k];
        data[i + 2] = cb[k];
        data[i + 3] = alpha;
      };
      for (let k = 0; k < n; k++) {
        // Slow diagonal swell; strongest out in the ambient field.
        const r = radius[k] * (1 + wave[k] * Math.sin(t * 1.4 - hx[k] * 0.012 - hy[k] * 0.018));
        if (r < 0.25) continue;
        const cx = px[k] * dpr, cy = py[k] * dpr;
        if (r < SQUARE_BELOW) {
          // At a pixel or two a square of equal area looks the same as a circle.
          const h = r * 0.886 * dpr;
          const x0 = cx - h, x1 = cx + h, y0 = cy - h, y1 = cy + h;
          for (let iy = Math.floor(y0); iy < y1; iy++) {
            const covY = Math.min(y1, iy + 1) - Math.max(y0, iy);
            for (let ix = Math.floor(x0); ix < x1; ix++) plot(ix, iy, (Math.min(x1, ix + 1) - Math.max(x0, ix)) * covY, k);
          }
        } else {
          const R = r * dpr;
          for (let iy = Math.floor(cy - R); iy < cy + R; iy++) {
            const dy = iy + 0.5 - cy;
            for (let ix = Math.floor(cx - R); ix < cx + R; ix++) {
              const dx = ix + 0.5 - cx;
              plot(ix, iy, Math.min(1, R + 0.5 - Math.sqrt(dx * dx + dy * dy)), k);
            }
          }
        }
      }
      ctx.putImageData(img, 0, 0);
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

  return (
    <>
      <div ref={poolRef} aria-hidden className="pointer-events-none absolute" />
      <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />
    </>
  );
}
