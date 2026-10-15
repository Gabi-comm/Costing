// Samples the photo a second time for the daylight (ink) portrait in
// components/DotPortrait.tsx: real darkness per dot, with the backdrop lifted
// out so it prints as paper. Same grid as make-portrait.mjs.
// Usage: node scripts/make-portrait-ink.mjs <image> [cols] [--preview out.png]
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const [src, colsArg, flag, previewOut] = process.argv.slice(2);
if (!src) throw new Error("usage: node scripts/make-portrait-ink.mjs <image> [cols] [--preview out.png]");
const COLS = Number(colsArg) || 96;

const meta = await sharp(src).metadata();
const ROWS = Math.round(COLS * (meta.height / meta.width));

// Work at a few pixels per dot so the cut-out follows the real outline.
const SUB = 6;
const W = COLS * SUB, H = ROWS * SUB;
const { data: rgb } = await sharp(src).removeAlpha().resize(W, H, { fit: "fill" }).blur(0.8).raw().toBuffer({ resolveWithObject: true });
const lum = new Float32Array(W * H);
for (let i = 0; i < W * H; i++) lum[i] = (0.2126 * rgb[i * 3] + 0.7152 * rgb[i * 3 + 1] + 0.0722 * rgb[i * 3 + 2]) / 255;

// Backdrop colour: median of the top and left margins (the jacket reaches the right and bottom).
const samples = [];
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) if (y < H * 0.06 || x < W * 0.05) samples.push([rgb[(y * W + x) * 3], rgb[(y * W + x) * 3 + 1], rgb[(y * W + x) * 3 + 2]]);
const median = (k) => samples.map((s) => s[k]).sort((a, b) => a - b)[samples.length >> 1];
const BG = [median(0), median(1), median(2)];

// Local texture: the wall is smooth, denim and hair are not.
const R = 3;
const texture = new Float32Array(W * H);
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    let s = 0, s2 = 0, n = 0;
    for (let dy = -R; dy <= R; dy++)
      for (let dx = -R; dx <= R; dx++) {
        const xx = Math.min(W - 1, Math.max(0, x + dx)), yy = Math.min(H - 1, Math.max(0, y + dy));
        const v = lum[yy * W + xx];
        s += v;
        s2 += v * v;
        n++;
      }
    texture[y * W + x] = Math.sqrt(Math.max(0, s2 / n - (s / n) ** 2));
  }

const COLOR_TOL = Number(process.env.COLOR_TOL ?? 40), TEX_TOL = Number(process.env.TEX_TOL ?? 0.032);
const BLUE_TOL = Number(process.env.BLUE_TOL ?? 10);
// Denim is the trap: about as dark as the wall, but bluer and textured.
// Compare hue rather than raw colour so the wall still matches where it falls
// into shadow; hair is far darker than any of the wall.
const bgSum = BG[0] + BG[1] + BG[2];
const WALL_LUM = [Number(process.env.WALL_MIN ?? 0.1), Number(process.env.WALL_MAX ?? 0.34)];
const isWall = (i) => {
  const [r, g, b] = [rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]];
  const sum = Math.max(1, r + g + b);
  const hue = Math.hypot(r / sum - BG[0] / bgSum, g / sum - BG[1] / bgSum, b / sum - BG[2] / bgSum);
  return (
    hue < COLOR_TOL / 1000 &&
    lum[i] > WALL_LUM[0] &&
    lum[i] < WALL_LUM[1] &&
    texture[i] < TEX_TOL &&
    b - r - (BG[2] - BG[0]) < BLUE_TOL
  );
};

// Flood the wall in from the top, the left, and the right edge above the jacket.
const wall = new Uint8Array(W * H);
const stack = [];
for (let x = 0; x < W; x++) stack.push(x);
for (let y = 0; y < H; y++) stack.push(y * W);
for (let y = 0; y < H * 0.4; y++) stack.push(y * W + W - 1);
while (stack.length) {
  const i = stack.pop();
  if (wall[i] || !isWall(i)) continue;
  wall[i] = 1;
  const x = i % W;
  if (x > 0) stack.push(i - 1);
  if (x < W - 1) stack.push(i + 1);
  if (i >= W) stack.push(i - W);
  if (i < (H - 1) * W) stack.push(i + W);
}

// Wall can also show through enclosed pockets (between cheek, hair and hand).
// Any sizeable smooth wall-coloured patch counts, connected to the edge or not.
const POCKET = Math.round(W * H * Number(process.env.POCKET ?? 0.002));
const seen = new Uint8Array(W * H);
for (let s0 = 0; s0 < W * H; s0++) {
  if (seen[s0] || wall[s0] || !isWall(s0)) continue;
  const patch = [];
  const q = [s0];
  seen[s0] = 1;
  while (q.length) {
    const i = q.pop();
    patch.push(i);
    const x = i % W;
    for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W])
      if (j >= 0 && j < W * H && !seen[j] && !wall[j] && isWall(j)) {
        seen[j] = 1;
        q.push(j);
      }
  }
  if (patch.length >= POCKET) for (const i of patch) wall[i] = 1;
}

// Clean the edge: close small gaps in the wall, then keep only the largest figure region.
const dilate = (m, on) => {
  const out = m.slice();
  for (let y = 1; y < H - 1; y++)
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      if (m[i] === on) continue;
      if (m[i - 1] === on || m[i + 1] === on || m[i - W] === on || m[i + W] === on) out[i] = on;
    }
  return out;
};
let fig = wall.map((v) => 1 - v);
for (let k = 0; k < 2; k++) fig = dilate(fig, 0);
for (let k = 0; k < 2; k++) fig = dilate(fig, 1);
const label = new Int32Array(W * H).fill(-1);
const sizes = [];
for (let s = 0; s < W * H; s++) {
  if (!fig[s] || label[s] >= 0) continue;
  const id = sizes.length;
  let size = 0;
  const q = [s];
  label[s] = id;
  while (q.length) {
    const i = q.pop();
    size++;
    const x = i % W;
    for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W])
      if (j >= 0 && j < W * H && fig[j] && label[j] < 0) {
        label[j] = id;
        q.push(j);
      }
  }
  sizes.push(size);
}
const keep = sizes.indexOf(Math.max(...sizes));
for (let i = 0; i < W * H; i++) fig[i] = label[i] === keep ? 1 : 0;

// Per dot: ink = average darkness of the figure's pixels (wall counts as paper),
// cover = share of the dot that is figure.
const LOW = Number(process.env.LOW ?? 0.04), HIGH = Number(process.env.HIGH ?? 0.9), GAMMA = Number(process.env.GAMMA ?? 1.85);
const { data: color } = await sharp(src).removeAlpha().resize(COLS, ROWS, { fit: "fill" }).raw().toBuffer({ resolveWithObject: true });
let levels = "", cover = "", warm = "";
for (let cy = 0; cy < ROWS; cy++)
  for (let cx = 0; cx < COLS; cx++) {
    let ink = 0, figure = 0;
    for (let y = cy * SUB; y < (cy + 1) * SUB; y++)
      for (let x = cx * SUB; x < (cx + 1) * SUB; x++) {
        const i = y * W + x;
        if (!fig[i]) continue;
        figure++;
        ink += Math.pow(Math.min(1, Math.max(0, (HIGH - lum[i]) / (HIGH - LOW))), GAMMA);
      }
    const n = SUB * SUB;
    levels += Math.round((ink / n) * 15).toString(16);
    cover += Math.round((figure / n) * 15).toString(16);
    const i = cy * COLS + cx;
    const [r, g, b] = [color[i * 3], color[i * 3 + 1], color[i * 3 + 2]];
    const sat = (Math.max(r, g, b) - Math.min(r, g, b)) / Math.max(1, Math.max(r, g, b));
    warm += sat > 0.72 && r > 90 && r > g && g > b ? "1" : "0";
  }

const out = `// Generated by scripts/make-portrait-ink.mjs — do not edit by hand.
/** Daylight portrait: same grid as PORTRAIT, sampled for ink on paper. */
export const PORTRAIT_INK = {
  cols: ${COLS},
  rows: ${ROWS},
  /** One hex digit (0–f) of ink (darkness) per dot; the backdrop counts as paper. */
  levels: "${levels}",
  /** One hex digit (0–f): how much of the dot is the figure rather than backdrop. */
  cover: "${cover}",
  /** "1" where the dot takes the warm accent color. */
  warm: "${warm}",
};
`;
writeFileSync(new URL("../lib/portrait-ink-data.ts", import.meta.url), out);
console.log(`wrote lib/portrait-ink-data.ts (${COLS}x${ROWS}), backdrop rgb(${BG.join(", ")})`);

if (flag === "--preview" && previewOut) {
  const cell = 8;
  let dots = "";
  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++) {
      const i = y * COLS + x, v = parseInt(levels[i], 16) / 15;
      if (v < 0.03) continue;
      dots += `<circle cx="${(x + 0.5) * cell}" cy="${(y + 0.5) * cell}" r="${(Math.sqrt(v) * cell * 0.55).toFixed(2)}" fill="${warm[i] === "1" ? "#C96E40" : "#17304D"}"/>`;
    }
  const mask = await sharp(Buffer.from(fig.map((v) => v * 255)), { raw: { width: W, height: H, channels: 1 } }).png().toBuffer();
  await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${COLS * cell}" height="${ROWS * cell}"><rect width="100%" height="100%" fill="#EEF3F7"/>${dots}</svg>`))
    .png()
    .toFile(previewOut);
  await sharp(mask).resize(COLS * 4).toFile(previewOut.replace(/\.png$/, "-mask.png"));
  console.log("preview", previewOut);
}
