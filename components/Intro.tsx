"use client";

import { useEffect, useRef, useState } from "react";
import { getTheme } from "@/lib/theme";

/** Fired when the sand starts clearing, so the hero can gather in underneath. */
export const INTRO_REVEAL = "gabi:intro-reveal";

let revealed = false;
const reveal = () => {
  if (revealed) return;
  revealed = true;
  window.dispatchEvent(new Event(INTRO_REVEAL));
};

/** True while the intro still covers the page and has not started clearing. */
export const introPlaying = () =>
  !revealed &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
  document.querySelector('.intro[data-state="playing"]') !== null;

/**
 * Per theme: the sky the sand sits on, and the grain colours by role
 * (frost, mist, steel, blush, cream). Daylight swaps the light grains for ink.
 */
const LOOKS = {
  dark: {
    base: "#030812",
    glows: [
      ["75, 112, 141", 0.42],
      ["25, 58, 135", 0.38],
      ["32, 58, 83", 0.35],
    ] as [string, number][],
    grid: "rgba(202, 220, 234, 0.06)",
    colors: [
      "rgba(202, 220, 234, 0.95)",
      "rgba(144, 176, 199, 0.85)",
      "rgba(75, 112, 141, 0.9)",
      "rgba(244, 211, 202, 0.9)",
      "rgba(247, 244, 227, 0.95)",
    ],
  },
  light: {
    base: "#e9f0f5",
    glows: [
      ["144, 176, 199", 0.4],
      ["244, 211, 202", 0.38],
      ["202, 220, 234", 0.7],
    ] as [string, number][],
    grid: "rgba(23, 48, 77, 0.07)",
    colors: [
      "rgba(23, 48, 77, 0.95)",
      "rgba(77, 103, 128, 0.85)",
      "rgba(117, 148, 172, 0.85)",
      "rgba(201, 128, 104, 0.9)",
      "rgba(32, 58, 83, 0.9)",
    ],
  },
};
const [FROST, MIST, STEEL, BLUSH, CREAM] = [0, 1, 2, 3, 4];
/** Weighted picks: [colour, weight] pairs. */
const DUST_MIX = [[STEEL, 30], [MIST, 30], [FROST, 20], [BLUSH, 12], [CREAM, 8]];
const WORD_MIX = [[FROST, 55], [CREAM, 30], [MIST, 15]];
const ACCENT_MIX = [[FROST, 40], [BLUSH, 35], [CREAM, 25]];

const pick = (mix: number[][]) => {
  let r = Math.random() * 100;
  for (const [c, w] of mix) if ((r -= w) < 0) return c;
  return mix[0][0];
};

/** Timeline, in ms from start. */
const GATHER_FROM = 150;
const DISSOLVE_AT = 2300;
const SWEEP = 2000;
const SWEEP_SKIPPED = 1200;
/** How ragged the sweeping edge is, as a share of the sweep. */
const BAND = 0.34;
/** Share of background cells that break off as a visible grain... */
const SPAWN = 0.22;
/** ...up to this many, so big screens don't pay for more sand than they show. */
const MAX_DUST = 3800;

const hash = (x: number, y: number) => {
  const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return h - Math.floor(h);
};
/** Smooth value noise, so the edge comes away in drifts rather than a line. */
const noise = (x: number, y: number) => {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};

/**
 * Opening overlay. Sand blows in and settles into the wordmark, then the wind
 * takes the wordmark and the night sky behind it away in grains, uncovering the
 * hero. Click, a key or a scroll skips straight to the sweep.
 */
export default function Intro() {
  const [state, setState] = useState<"playing" | "leaving" | "done">("playing");
  const rootRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLCanvasElement>(null);
  const fxRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current, bgCanvas = bgRef.current, fxCanvas = fxRef.current;
    const bg = bgCanvas?.getContext("2d");
    const fx = fxCanvas?.getContext("2d");
    if (!root || !bgCanvas || !fxCanvas || !bg || !fx) return;

    let cancelled = false, raf = 0;
    const timers: number[] = [];
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      reveal();
      timers.push(window.setTimeout(() => setState("done")));
      return () => timers.forEach(clearTimeout);
    }

    const W = window.innerWidth, H = window.innerHeight;
    // Grains are a few pixels across; past 1.5x the extra resolution only costs frames.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    for (const c of [bgCanvas, fxCanvas]) {
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
    }
    bg.setTransform(dpr, 0, 0, dpr, 0, 0);
    fx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const look = LOOKS[getTheme()];
    const COLORS = look.colors;

    // The page's sky, matching the body, with the halftone grid laid over it.
    const paintSky = () => {
      bg.fillStyle = look.base;
      bg.fillRect(0, 0, W, H);
      const glow = (x: number, y: number, rx: number, ry: number, rgb: string, a: number, end: number) => {
        bg.save();
        bg.translate(x, y);
        bg.scale(rx, ry);
        const g = bg.createRadialGradient(0, 0, 0, 0, 0, 1);
        g.addColorStop(0, `rgba(${rgb}, ${a})`);
        g.addColorStop(end, `rgba(${rgb}, 0)`);
        bg.fillStyle = g;
        bg.fillRect(-1, -1, 2, 2);
        bg.restore();
      };
      const [g1, g2, g3] = look.glows;
      glow(-0.05 * W, 0.35 * H, 900, 700, g1[0], g1[1], 0.62);
      glow(0.4 * W, 0, 1100, 800, g2[0], g2[1], 0.6);
      glow(W, H, 900, 900, g3[0], g3[1], 0.6);
      bg.beginPath();
      for (let y = 7; y < H; y += 14)
        for (let x = 7; x < W; x += 14) {
          bg.moveTo(x + 1, y);
          bg.arc(x, y, 1, 0, Math.PI * 2);
        }
      bg.fillStyle = look.grid;
      bg.fill();
    };
    paintSky();
    root.dataset.canvas = "";

    /** Where the wind front reaches a point, 0 (first) to 1 (last). */
    const SLANT = 0.45;
    const threshold = (x: number, y: number, grain: number) =>
      ((x + y * SLANT) / (W + H * SLANT)) * (1 - BAND) + (0.75 * noise(x / 220, y / 220) + 0.25 * grain) * BAND;

    // Background cells, ordered by when the wind reaches them.
    const g = W < 700 ? 4 : 6;
    const gc = Math.ceil(W / g), gr = Math.ceil(H / g), N = gc * gr;
    const cellTh = new Float32Array(N);
    for (let j = 0; j < gr; j++)
      for (let i = 0; i < gc; i++) cellTh[j * gc + i] = threshold((i + 0.5) * g, (j + 0.5) * g, hash(i, j));
    const order = new Uint32Array(N).map((_, k) => k).sort((a, b) => cellTh[a] - cellTh[b]);
    let eroded = 0;

    // Loose grains that broke off the sky.
    const spawn = Math.min(SPAWN, MAX_DUST / N);
    const cap = Math.ceil(N * spawn * 1.2);
    const dx = new Float32Array(cap), dy = new Float32Array(cap);
    const dvx = new Float32Array(cap), dvy = new Float32Array(cap);
    const dAge = new Float32Array(cap), dLife = new Float32Array(cap), dSize = new Float32Array(cap);
    const dColor = new Uint8Array(cap);
    let dCount = 0, dFirst = 0;

    // Wordmark grains: gather in, hold, then blow away.
    let wn = 0;
    let wx = new Float32Array(0), wy = new Float32Array(0), wtx = new Float32Array(0), wty = new Float32Array(0);
    let wsx = new Float32Array(0), wsy = new Float32Array(0), warc = new Float32Array(0);
    let wDelay = new Float32Array(0), wDur = new Float32Array(0), wTh = new Float32Array(0);
    let wvx = new Float32Array(0), wvy = new Float32Array(0), wAge = new Float32Array(0), wLife = new Float32Array(0);
    let wColor = new Uint8Array(0), wGone = new Uint8Array(0);
    let wSize = 2;

    const sampleWordmark = () => {
      const css = getComputedStyle(document.body);
      const display = css.getPropertyValue("--font-display").trim() || "system-ui, sans-serif";
      const serif = css.getPropertyValue("--font-serif").trim() || "Georgia, serif";
      const fs = Math.max(54, Math.min(W * 0.15, 200));
      const fontA = `600 ${fs}px ${display}`;
      const fontB = `italic 400 ${fs * 1.14}px ${serif}`;

      const off = document.createElement("canvas");
      off.width = W;
      off.height = H;
      const o = off.getContext("2d", { willReadFrequently: true });
      if (!o) return;
      o.font = fontA;
      const a = "Gabi-", wa = o.measureText(a).width;
      o.font = fontB;
      const b = "comm", wb = o.measureText(b).width;
      const left = (W - wa - wb) / 2, base = H / 2 + fs * 0.3, split = left + wa;
      o.fillStyle = "#fff";
      o.font = fontA;
      o.fillText(a, left, base);
      o.font = fontB;
      o.fillText(b, split, base);

      const px = o.getImageData(0, 0, W, H).data;
      const step = Math.max(2, Math.round(fs / 62));
      wSize = step * 0.85;
      const pts: number[] = [];
      for (let y = 0; y < H; y += step)
        for (let x = 0; x < W; x += step) if (px[(y * W + x) * 4 + 3] > 120) pts.push(x, y);

      wn = pts.length / 2;
      wx = new Float32Array(wn); wy = new Float32Array(wn);
      wtx = new Float32Array(wn); wty = new Float32Array(wn);
      wsx = new Float32Array(wn); wsy = new Float32Array(wn); warc = new Float32Array(wn);
      wDelay = new Float32Array(wn); wDur = new Float32Array(wn); wTh = new Float32Array(wn);
      wvx = new Float32Array(wn); wvy = new Float32Array(wn);
      wAge = new Float32Array(wn); wLife = new Float32Array(wn);
      wColor = new Uint8Array(wn); wGone = new Uint8Array(wn);
      const span = wa + wb;
      for (let k = 0; k < wn; k++) {
        const x = pts[k * 2] + (Math.random() - 0.5) * step * 0.6;
        const y = pts[k * 2 + 1] + (Math.random() - 0.5) * step * 0.6;
        wtx[k] = x;
        wty[k] = y;
        // Blown in from the left on the same wind that later carries them off.
        wsx[k] = x - W * (0.35 + Math.random() * 0.45);
        wsy[k] = y + (Math.random() - 0.3) * H * 0.35;
        wx[k] = wsx[k];
        wy[k] = wsy[k];
        warc[k] = (Math.random() - 0.5) * fs * 1.6;
        wDelay[k] = ((x - left) / span) * 520 + Math.random() * 380;
        wDur[k] = 850 + Math.random() * 450;
        wTh[k] = threshold(x, y, Math.random());
        wLife[k] = 0.9 + Math.random() * 0.9;
        wColor[k] = pick(x < split ? WORD_MIX : ACCENT_MIX);
      }
    };

    let t0 = 0, last = 0, dissolveAt = 0, sweep = SWEEP;

    const startDissolve = (now: number, skipped: boolean) => {
      if (dissolveAt) return;
      dissolveAt = now;
      sweep = skipped ? SWEEP_SKIPPED : SWEEP;
      setState("leaving");
      timers.push(window.setTimeout(reveal, sweep * 0.2));
    };
    const skip = () => t0 && startDissolve(performance.now(), true);

    const blow = (vx: Float32Array, vy: Float32Array, x: Float32Array, y: Float32Array, k: number, t: number, dt: number) => {
      // Steady wind to the right with gusts that curl the grains up and down.
      const ax = 520 + Math.sin(y[k] * 0.013 + t * 2.3) * 260;
      const ay = -70 + Math.cos(x[k] * 0.011 + t * 1.7) * 150;
      vx[k] = (vx[k] + ax * dt) * 0.985;
      vy[k] = (vy[k] + ay * dt) * 0.985;
      x[k] += vx[k] * dt;
      y[k] += vy[k] * dt;
    };

    const frame = (now: number) => {
      raf = 0;
      if (cancelled) return;
      if (!t0) t0 = last = now;
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      const elapsed = now - t0, t = elapsed / 1000;
      if (elapsed >= DISSOLVE_AT) startDissolve(now, false);

      const p = dissolveAt ? Math.min(1, (now - dissolveAt) / sweep) : 0;
      // Gentle start and finish: the wind picks up, then dies down.
      const front = dissolveAt ? (0.5 - 0.5 * Math.cos(Math.PI * p)) * 1.02 : -1;
      // The sky also thins as it crumbles, so the page brightens through it instead of at an edge.
      if (dissolveAt) {
        const q = Math.min(1, Math.max(0, (p - 0.2) / 0.75));
        bgCanvas.style.opacity = String(1 - q * q * (3 - 2 * q));
      }

      // Wind front eats the sky; some of what it takes stays visible as grains.
      if (front >= 0 && eroded < N) {
        bg.globalCompositeOperation = "destination-out";
        bg.beginPath();
        while (eroded < N && cellTh[order[eroded]] <= front) {
          const k = order[eroded++];
          const cx = (k % gc) * g, cy = Math.floor(k / gc) * g;
          bg.rect(cx - 0.25, cy - 0.25, g + 0.5, g + 0.5);
          if (dCount < cap && Math.random() < spawn) {
            const d = dCount++;
            dx[d] = cx + Math.random() * g;
            dy[d] = cy + Math.random() * g;
            dvx[d] = 40 + Math.random() * 170;
            dvy[d] = -(10 + Math.random() * 90);
            dAge[d] = 0;
            dLife[d] = 0.7 + Math.random() * 0.8;
            dSize[d] = 0.8 + Math.random() * 1.6;
            dColor[d] = pick(DUST_MIX);
          }
        }
        bg.fill();
        bg.globalCompositeOperation = "source-over";
        if (eroded >= N) bg.clearRect(0, 0, W, H);
      }

      const paths = COLORS.map(() => new Path2D());
      let alive = 0;

      for (let k = 0; k < wn; k++) {
        if (wGone[k]) continue;
        alive++;
        let s = wSize;
        if (front >= wTh[k]) {
          if (wAge[k] === 0) {
            wvx[k] = 80 + Math.random() * 230;
            wvy[k] = -(20 + Math.random() * 130);
          }
          wAge[k] += dt;
          if (wAge[k] >= wLife[k]) {
            wGone[k] = 1;
            continue;
          }
          blow(wvx, wvy, wx, wy, k, t, dt);
          s *= 1 - (wAge[k] / wLife[k]) ** 2;
        } else {
          const q = Math.min(1, Math.max(0, (elapsed - GATHER_FROM - wDelay[k]) / wDur[k]));
          const e = 1 - (1 - q) ** 4;
          wx[k] = wsx[k] + (wtx[k] - wsx[k]) * e;
          wy[k] = wsy[k] + (wty[k] - wsy[k]) * (1 - (1 - q) ** 5) + Math.sin(q * Math.PI) * warc[k];
          if (q === 0) continue;
          // Grains in flight are fine dust; they swell to full size as they land.
          s *= 0.45 + 0.55 * e;
        }
        paths[wColor[k]].rect(wx[k] - s / 2, wy[k] - s / 2, s, s);
      }

      while (dFirst < dCount && dAge[dFirst] >= dLife[dFirst]) dFirst++;
      for (let k = dFirst; k < dCount; k++) {
        if (dAge[k] >= dLife[k]) continue;
        alive++;
        dAge[k] += dt;
        blow(dvx, dvy, dx, dy, k, t, dt);
        const s = dSize[k] * (1 - (dAge[k] / dLife[k]) ** 2);
        // Whole-pixel corners keep the rasteriser off the antialiasing path.
        if (s > 0.1) paths[dColor[k]].rect(Math.round(dx[k]), Math.round(dy[k]), s, s);
      }

      fx.clearRect(0, 0, W, H);
      paths.forEach((path, c) => {
        fx.fillStyle = COLORS[c];
        fx.fill(path);
      });

      if (p >= 1 && eroded >= N && alive === 0) {
        reveal();
        setState("done");
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    const fontsReady = Promise.race([
      document.fonts.ready,
      new Promise((resolve) => timers.push(window.setTimeout(resolve, 800))),
    ]);
    fontsReady.then(() => {
      if (cancelled) return;
      sampleWordmark();
      raf = requestAnimationFrame(frame);
    });

    window.addEventListener("pointerdown", skip);
    window.addEventListener("keydown", skip);
    window.addEventListener("wheel", skip, { passive: true });
    window.addEventListener("touchmove", skip, { passive: true });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("wheel", skip);
      window.removeEventListener("touchmove", skip);
    };
  }, []);

  if (state === "done") return null;

  return (
    <div ref={rootRef} className="intro" data-state={state} aria-hidden>
      <canvas ref={bgRef} className="absolute inset-0 h-full w-full" />
      <canvas ref={fxRef} className="absolute inset-0 h-full w-full" />
      <p className="intro-skip">Click or tap to skip</p>
    </div>
  );
}
