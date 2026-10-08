"use client";

import { useEffect, useRef } from "react";
import { PORTRAIT } from "@/lib/portrait-data";

const FROST = "202, 220, 234";
const WARM = "244, 177, 131";
const BUCKETS = 16;

/**
 * Halftone portrait drawn on a canvas. Dots spring away from the pointer
 * and settle back; a slow shimmer runs while idle.
 */
export default function DotPortrait({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const { cols, rows, levels, warm } = PORTRAIT;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Keep only dots that are visible after the edge vignette.
    const idx: number[] = [];
    const strength: number[] = [];
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        const v = parseInt(levels[i], 16) / 15;
        const d = Math.hypot((x + 0.5) / cols - 0.5, (y + 0.5) / rows - 0.5) / 0.5;
        const fade = Math.min(1, Math.max(0, (1.08 - d) / 0.3));
        const s = v * fade;
        if (s < 0.04) continue;
        idx.push(i);
        strength.push(s);
      }
    const n = idx.length;
    const hx = new Float32Array(n), hy = new Float32Array(n);
    const px = new Float32Array(n), py = new Float32Array(n);
    const vx = new Float32Array(n), vy = new Float32Array(n);
    const radius = new Float32Array(n);
    // Dots grouped by color and opacity so each group is one fill() per frame.
    const groups: { style: string; dots: number[] }[] = [];
    for (const rgb of [FROST, WARM])
      for (let b = 0; b < BUCKETS; b++)
        groups.push({ style: `rgba(${rgb}, ${(0.35 + 0.65 * (b / (BUCKETS - 1))).toFixed(3)})`, dots: [] });
    for (let k = 0; k < n; k++) {
      const b = Math.min(BUCKETS - 1, Math.round(strength[k] * (BUCKETS - 1)));
      groups[(warm[idx[k]] === "1" ? BUCKETS : 0) + b].dots.push(k);
    }

    let width = 0, cell = 0;
    const layout = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      const height = width * (rows / cols);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cell = width / cols;
      for (let k = 0; k < n; k++) {
        const i = idx[k];
        hx[k] = px[k] = ((i % cols) + 0.5) * cell;
        hy[k] = py[k] = (Math.floor(i / cols) + 0.5) * cell;
        vx[k] = vy[k] = 0;
        radius[k] = Math.max(0.4, Math.pow(strength[k], 0.85) * cell * 0.6);
      }
    };

    const pointer = { x: 0, y: 0, active: false };
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
    };
    const onLeave = () => (pointer.active = false);
    const onUp = (e: PointerEvent) => e.pointerType !== "mouse" && onLeave();

    let raf = 0, visible = true, t = 0;
    const frame = () => {
      raf = 0;
      if (!visible) return;
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

      ctx.clearRect(0, 0, width, width * (rows / cols));
      for (const g of groups) {
        if (!g.dots.length) continue;
        ctx.beginPath();
        for (const k of g.dots) {
          const shimmer = 1 + 0.1 * Math.sin(t * 1.6 + hx[k] * 0.035 + hy[k] * 0.02);
          const r = radius[k] * shimmer;
          ctx.moveTo(px[k] + r, py[k]);
          ctx.arc(px[k], py[k], r, 0, Math.PI * 2);
        }
        ctx.fillStyle = g.style;
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
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    });
    io.observe(canvas);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("pointerup", onUp);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointerup", onUp);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="Dot-art portrait of Gabriel John Solomon"
      className={`block w-full touch-pan-y ${className}`}
      style={{ aspectRatio: `${PORTRAIT.cols} / ${PORTRAIT.rows}` }}
    />
  );
}
