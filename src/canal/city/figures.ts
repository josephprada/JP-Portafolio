import { HERO_SCALE, type HeroPose, type P3 } from "./hero";
import { iso, type Projection } from "./kit/iso-kit.ts";
import type { SignalPose } from "./signal";

/**
 * The two live figures that are not vehicles: Spider-Man, drawn limb by limb
 * from his pose, and the JP signal on the sky. Both are drawn in drawing
 * units with the camera's transform already set.
 */

const RED = "#d8262c";
const BLUE = "#2346b0";
const INK = "#07090e";
const WEB = "#e8eef8";

const add = (a: P3, b: P3, k = 1): P3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];

export interface HeroFigure {
  /** Screen points of the figure's joints. */
  hand: [number, number];
  limbs: Array<{ points: Array<[number, number]>; color: string; width: number }>;
  head: [number, number];
  /** Head radius and the screen direction from neck to crown. */
  r: number;
  up: [number, number];
  side: [number, number];
}

const Z: P3 = [0, 0, 1];
const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const mix3 = (a: P3, b: P3, k: number): P3 => [
  mix(a[0], b[0], k),
  mix(a[1], b[1], k),
  mix(a[2], b[2], k),
];
const cross = (a: P3, b: P3): P3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

/** Rodrigues: `v` turned by `angle` about the unit axis `k`. */
function turn(v: P3, k: P3, angle: number): P3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const d = (k[0] * v[0] + k[1] * v[1] + k[2] * v[2]) * (1 - c);
  const x = cross(k, v);
  return [
    v[0] * c + x[0] * s + k[0] * d,
    v[1] * c + x[1] * s + k[1] * d,
    v[2] * c + x[2] * s + k[2] * d,
  ];
}

/**
 * The figure for a pose. His body is a frame (along it, forward, across) that
 * the tricks turn about its middle: a flip about the across axis, a corkscrew
 * about the forward one, a spin about the vertical. Limbs blend between four
 * poses: stretched, tucked up, spread like a star, and gripping the web.
 */
export function heroFigure(pose: HeroPose, P: Projection): HeroFigure {
  const { pos, lean, pitch, roll, twist, tuck, spread, grip } = pose;
  const flat: P3 = [pose.dir[0], pose.dir[1], 0];
  const across0: P3 = [-flat[1], flat[0], 0];
  const rolled = turn(flat, across0, pitch);
  const frame = (v: P3) => turn(turn(turn(v, across0, pitch), rolled, roll), Z, twist);
  const axis = frame(lean);
  const dir = frame(flat);
  const across = frame(across0);
  const hips = add(add(pos, lean, 1.8), axis, -1.8);
  // Joints are laid out at life size round his hips, then drawn larger.
  const at = (p: P3): [number, number] => {
    const [x, y] = iso(add(pos, add(p, pos, -1), HERO_SCALE), P);
    return [x, y];
  };
  const neck = add(hips, axis, 2.3);
  const crown = add(hips, axis, 3.6);
  const head = add(hips, axis, 3);
  const shoulderA = add(neck, across, 0.8);
  const shoulderB = add(neck, across, -0.8);
  const hipA = add(hips, across, 0.5);
  const hipB = add(hips, across, -0.5);

  /** Where a hand ends up, from the four arm poses. */
  const reach = (shoulder: P3, side: number, held: P3): P3 => {
    const ahead = add(add(shoulder, dir, 1.5), axis, 0.5);
    const tucked = add(add(shoulder, dir, 0.7), axis, -0.9);
    const star = add(add(shoulder, across, side * 2.4), axis, 1.3);
    return mix3(mix3(mix3(ahead, tucked, tuck), star, spread), held, grip);
  };
  // The web hand follows the line up his body; the other trails behind.
  const handA = reach(shoulderA, 1, add(neck, axis, 1.9));
  const handB = reach(shoulderB, -1, add(add(shoulderB, dir, 1.4), axis, -0.4));
  const elbow = (shoulder: P3, hand: P3, side: number): P3 =>
    add(add(mix3(shoulder, hand, 0.5), dir, 0.25), across, side * 0.3);

  /** Where a foot ends up: relaxed and trailing, tucked, or kicked out wide. */
  const leg = (hipP: P3, side: number): [P3, P3] => {
    const relaxed = add(add(add(hipP, axis, -1.5), dir, 0.5), across, side * 0.2);
    const tucked = add(add(hipP, axis, -0.7), dir, 1);
    const wide = add(add(hipP, axis, -1.3), across, side * 1.1);
    const knee = mix3(mix3(relaxed, tucked, tuck), wide, spread);
    const trailing = add(add(knee, axis, -1.5), dir, -0.7);
    const foldedFoot = add(add(knee, axis, -1.1), dir, -0.5);
    const wideFoot = add(add(knee, axis, -1.2), across, side * 1.1);
    return [knee, mix3(mix3(trailing, foldedFoot, tuck), wideFoot, spread)];
  };
  const [kneeA, footA] = leg(hipA, 1);
  const [kneeB, footB] = leg(hipB, -1);

  const [ox, oy] = iso([0, 0, 0], P);
  const [ux, uy] = iso([1, 0, 0], P);
  const w = (units: number) => units * HERO_SCALE * Math.hypot(ux - ox, uy - oy);
  const [hx, hy] = at(head);
  const [cx, cy] = at(crown);
  const r = w(0.75);
  const reachLen = Math.hypot(cx - hx, cy - hy) || 1;
  const [sx0, sy0] = at(shoulderA);
  const [sx1, sy1] = at(shoulderB);
  const sl = Math.hypot(sx1 - sx0, sy1 - sy0) || 1;
  // Which limbs are behind the body depends on which way his front faces.
  const nearA = across[0] + across[1] >= 0;
  const limbA = [
    { points: [hipA, kneeA, footA].map(at), color: BLUE, width: w(0.7) },
    { points: [add(kneeA, axis, -0.6), footA].map(at), color: RED, width: w(0.72) },
    { points: [shoulderA, elbow(shoulderA, handA, 1), handA].map(at), color: RED, width: w(0.55) },
  ];
  const limbB = [
    { points: [hipB, kneeB, footB].map(at), color: BLUE, width: w(0.7) },
    { points: [add(kneeB, axis, -0.6), footB].map(at), color: RED, width: w(0.72) },
    { points: [shoulderB, elbow(shoulderB, handB, -1), handB].map(at), color: RED, width: w(0.55) },
  ];
  const torso = [
    { points: [hips, neck].map(at), color: BLUE, width: w(1.5) },
    { points: [add(hips, axis, 0.5), add(neck, axis, -0.1)].map(at), color: RED, width: w(1.05) },
  ];
  return {
    hand: at(handA),
    head: [hx, hy],
    r,
    up: [(cx - hx) / reachLen, (cy - hy) / reachLen],
    side: [(sx1 - sx0) / sl, (sy1 - sy0) / sl],
    // Far side first, so the near limbs cover it.
    limbs: nearA ? [...limbB, ...torso, ...limbA] : [...limbA, ...torso, ...limbB],
  };
}

/** Spider-Man and his web. `px` is one device pixel in drawing units. */
export function drawHero(
  ctx: CanvasRenderingContext2D,
  figure: HeroFigure,
  web: [number, number] | null,
  px: number,
  lit: boolean,
) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (web) {
    ctx.strokeStyle = WEB;
    ctx.globalAlpha = 0.95;
    ctx.lineWidth = Math.max(px * 1.4, figure.r * 0.2);
    ctx.beginPath();
    ctx.moveTo(...figure.hand);
    ctx.lineTo(...web);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (lit) ctx.filter = "brightness(1.45)";
  const outline = Math.max(px * 1.2, figure.r * 0.22);
  // Every limb gets a dark outline under it, so he reads against lit walls.
  for (const pass of [0, 1]) {
    for (const limb of figure.limbs) {
      ctx.strokeStyle = pass ? limb.color : INK;
      ctx.lineWidth = limb.width + (pass ? 0 : outline);
      ctx.beginPath();
      for (const [x, y] of limb.points) ctx.lineTo(x, y);
      ctx.stroke();
    }
  }
  const [hx, hy] = figure.head;
  const { r, up, side } = figure;
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(hx, hy, r + outline / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = RED;
  ctx.beginPath();
  ctx.arc(hx, hy, r, 0, Math.PI * 2);
  ctx.fill();
  // The mask's eyes, big white teardrops, once the head is big enough to see.
  if (r > px * 3.5) {
    const angle = Math.atan2(up[1], up[0]) + Math.PI / 2;
    for (const k of [-1, 1]) {
      const ex = hx + side[0] * k * r * 0.42 + up[0] * r * 0.1;
      const ey = hy + side[1] * k * r * 0.42 + up[1] * r * 0.1;
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.ellipse(ex, ey, r * 0.36, r * 0.24, angle + k * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(ex, ey, r * 0.27, r * 0.16, angle + k * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (lit) ctx.filter = "none";
}

/**
 * The disc of the signal: warm light falling off to its rim, a brighter ring
 * where the lens's edge is, and the logo cut out of it in shadow.
 */
export function signalDisc(logo: CanvasImageSource, logoW: number, logoH: number, aspect: number) {
  const canvas = document.createElement("canvas");
  const W = 512;
  const H = Math.round(W * aspect);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(1, aspect);
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, W / 2);
  gradient.addColorStop(0, "rgba(255,170,160,0.95)");
  gradient.addColorStop(0.72, "rgba(255,70,55,0.8)");
  gradient.addColorStop(0.86, "rgba(255,110,95,0.95)");
  gradient.addColorStop(0.93, "rgba(230,51,41,0.35)");
  gradient.addColorStop(1, "rgba(230,51,41,0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, W / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // The logo is a light glyph on a clear ground: its pixels become shadow.
  const w = W * 0.56;
  const h = w * (logoH / logoW) * 0.82;
  ctx.globalCompositeOperation = "destination-out";
  ctx.drawImage(logo, (W - w) / 2, (H - h) / 2, w, h);
  return canvas;
}

/** The beam and the disc, added to the sky like light. */
export function drawSignal(
  ctx: CanvasRenderingContext2D,
  pose: SignalPose,
  disc: HTMLCanvasElement | null,
  halo: HTMLCanvasElement,
  t: number,
) {
  // An old carbon-arc lamp: a slow breath and a faint quick shiver.
  const flicker = 0.9 + 0.06 * Math.sin(t * 1.3) + 0.04 * Math.sin(t * 17) * Math.sin(t * 5.1);
  const [lx, ly] = pose.lamp;
  const { cx, cy, rx, ry } = pose.disc;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const gradient = ctx.createLinearGradient(lx, ly, cx, cy);
  gradient.addColorStop(0, "rgba(255,60,45,0.36)");
  gradient.addColorStop(0.25, "rgba(255,50,40,0.14)");
  gradient.addColorStop(1, "rgba(230,51,41,0.07)");
  ctx.globalAlpha = flicker;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  for (const [x, y] of pose.beam) ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fill();
  if (disc) {
    ctx.globalAlpha = 0.62 * flicker;
    ctx.drawImage(disc, cx - rx, cy - ry, rx * 2, ry * 2);
  }
  ctx.globalAlpha = flicker;
  ctx.drawImage(halo, lx - 6, ly - 6, 12, 12);
  ctx.restore();
}
