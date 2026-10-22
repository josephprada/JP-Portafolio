import {
  axisVector,
  cylinder,
  dotsSvg,
  iso,
  lineSvg,
  type Point3,
  type Projection,
  pathOf,
  type SolidPaths,
  sideMatrix,
  sideSeam,
  slabOf,
  solidSvg,
  type Tone,
} from "./kit/iso-kit.ts";
import { type Frame, frameAlong, prismOf, solidOf, sphereOf } from "./kit/lathe.mjs";
import type { RegionId } from "./model";
import type { Box3 } from "./order";

/**
 * Building blocks shared by every generator. Each building is collected by a
 * `Piece` builder into one SVG string and one bounding box, which is what the
 * painter's order sorts. Inside a piece, parts are added back to front by the
 * generator itself.
 */

export interface Hover {
  kind: string;
  title: string;
  summary?: string;
}

export interface Item {
  key: string;
  box: Box3;
  svg: string;
  region?: RegionId;
  hover?: Hover;
}

/** Small deterministic PRNG, so the city is the same on every load. */
export function seeded(seed: number) {
  let state = seed >>> 0 || 1;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashOf(text: string) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index++)
    hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
  return hash >>> 0;
}

export interface SolidOptions {
  tone?: Tone;
  crease?: Tone | "none";
  halo?: boolean;
  lit?: boolean;
  flat?: boolean;
  inner?: string;
  /** Extra class: material variants such as glass, stone or metal (city.css). */
  className?: string;
}

const round = (value: number) => Math.round(value * 10) / 10;

export class Piece {
  private readonly parts: string[] = [];
  readonly box: Box3 = {
    x0: Infinity,
    y0: Infinity,
    z0: Infinity,
    x1: -Infinity,
    y1: -Infinity,
    z1: -Infinity,
  };

  readonly P: Projection;

  constructor(P: Projection) {
    this.P = P;
  }

  /** Grow the piece's bounding box; every helper below calls it. */
  extend(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) {
    const b = this.box;
    b.x0 = Math.min(b.x0, x0);
    b.y0 = Math.min(b.y0, y0);
    b.z0 = Math.min(b.z0, z0);
    b.x1 = Math.max(b.x1, x1);
    b.y1 = Math.max(b.y1, y1);
    b.z1 = Math.max(b.z1, z1);
    return this;
  }

  raw(svg: string) {
    if (svg) this.parts.push(svg);
    return this;
  }

  solid(paths: SolidPaths, options: SolidOptions = {}) {
    return this.raw(solidSvg(paths, options));
  }

  /** An axis-aligned box with a small bevel, the commonest part in the city. */
  box3(
    x: number,
    y: number,
    z: number,
    w: number,
    d: number,
    h: number,
    options: SolidOptions & { r?: number; bevel?: number } = {},
  ) {
    const r = options.r ?? 0.4;
    this.extend(x, y, z, x + w, y + d, z + h);
    return this.solid(
      slabOf({ x, y, w, d, r }, z, h, this.P, r > 0 ? 3 : 1, options.bevel ?? 0),
      options,
    );
  }

  cyl(
    cx: number,
    cy: number,
    radius: number,
    z: number,
    h: number,
    options: SolidOptions & { steps?: number } = {},
  ) {
    this.extend(cx - radius, cy - radius, z, cx + radius, cy + radius, z + h);
    return this.solid(cylinder(cx, cy, radius, z, h, this.P, options.steps ?? 20), options);
  }

  /** A prism along an axis, for gable roofs, sawtooth roofs, hulls and wagons. */
  prism(
    axis: "x" | "y",
    from: Point3,
    length: number,
    profile: Array<[number, number]>,
    options: SolidOptions = {},
  ) {
    // Profile coordinates are (across, up) in the plane normal to the axis.
    const F: Frame =
      axis === "x"
        ? { o: from, a: [1, 0, 0], u: [0, 1, 0], v: [0, 0, 1] }
        : { o: from, a: [0, 1, 0], u: [-1, 0, 0], v: [0, 0, 1] };
    const across = profile.map(([u]) => u);
    const up = profile.map(([, v]) => v);
    if (axis === "x") {
      this.extend(
        from[0],
        from[1] + Math.min(...across),
        from[2] + Math.min(...up),
        from[0] + length,
        from[1] + Math.max(...across),
        from[2] + Math.max(...up),
      );
    } else {
      this.extend(
        from[0] - Math.max(...across),
        from[1],
        from[2] + Math.min(...up),
        from[0] - Math.min(...across),
        from[1] + length,
        from[2] + Math.max(...up),
      );
    }
    return this.solid(prismOf(F, profile, 0, length, this.P), options);
  }

  /** A turned body standing on the ground: profile is [height, radius] pairs. */
  turned(
    cx: number,
    cy: number,
    z: number,
    profile: Array<[number, number] | [number, number, 0 | 1]>,
    options: SolidOptions = {},
  ) {
    const F = frameAlong([cx, cy, z], [0, 0, 1]);
    const most = Math.max(...profile.map(([, r]) => r));
    const top = Math.max(...profile.map(([s]) => s));
    this.extend(cx - most, cy - most, z, cx + most, cy + most, z + top);
    return this.solid(solidOf(profile, F, this.P), options);
  }

  ball(centre: Point3, radius: number, options: SolidOptions = {}) {
    const [x, y, z] = centre;
    this.extend(x - radius, y - radius, z - radius, x + radius, y + radius, z + radius);
    return this.solid(sphereOf(centre, radius, this.P, { steps: 28 }), options);
  }

  line(
    points: Point3[],
    tone: Tone | "lit" | "red" = "lo",
    extra: { dashed?: boolean; flow?: boolean; free?: boolean; className?: string } = {},
  ) {
    return this.raw(lineSvg(pathOf(points.map((point) => iso(point, this.P))), { tone, ...extra }));
  }

  dots(points: Point3[], size: number, tone: Tone = "mid", pulse = false) {
    return this.raw(
      dotsSvg(
        points.map((point) => iso(point, this.P)),
        { size, tone, pulse },
      ),
    );
  }

  /** Seam round the visible corners of a box at height z, drawn as a faint line. */
  seam(x: number, y: number, w: number, d: number, z: number, tone: Tone = "faint") {
    return this.raw(lineSvg(sideSeam({ x, y, w, d, r: 0.4 }, z, this.P, 3), { tone }));
  }

  svg() {
    return this.parts.join("");
  }

  item(key: string, extra: Omit<Item, "key" | "box" | "svg"> = {}): Item {
    return { key, box: { ...this.box }, svg: this.svg(), ...extra };
  }
}

/* ---------- light ---------- */

/**
 * Windows on the two faces the camera sees (+x and +y). Each window is a quad
 * in the face plane; lit ones are split into three warmth levels so a facade
 * reads as many rooms rather than one sheet. Every window is a closed shape,
 * so nothing on a facade ends in mid-air.
 */
export interface WindowGrid {
  face: "x" | "y";
  /** The face plane: x = at for an "x" face, y = at for a "y" face. */
  at: number;
  from: number;
  to: number;
  z0: number;
  z1: number;
  pitch: number;
  floor: number;
  width: number;
  height: number;
  lit: number;
  seed: number;
}

export function windows(P: Projection, grid: WindowGrid) {
  const rand = seeded(grid.seed);
  const levels = ["", "", "", ""];
  const dark: string[] = [];
  const columns = Math.max(1, Math.floor((grid.to - grid.from) / grid.pitch));
  const margin = (grid.to - grid.from - columns * grid.pitch) / 2 + (grid.pitch - grid.width) / 2;
  const rows = Math.max(1, Math.floor((grid.z1 - grid.z0) / grid.floor));
  const quad = (u0: number, u1: number, z0: number, z1: number) => {
    const at = (u: number, z: number): Point3 =>
      grid.face === "x" ? [grid.at, u, z] : [u, grid.at, z];
    return pathOf(
      [iso(at(u0, z0), P), iso(at(u1, z0), P), iso(at(u1, z1), P), iso(at(u0, z1), P)],
      true,
    );
  };
  // Rooms switch on in runs along a floor, the way a real office tower does.
  for (let row = 0; row < rows; row++) {
    let run = rand() < grid.lit;
    const z0 = grid.z0 + row * grid.floor + (grid.floor - grid.height) / 2;
    for (let column = 0; column < columns; column++) {
      if (rand() < 0.28) run = rand() < grid.lit;
      const u0 = grid.from + margin + column * grid.pitch;
      const d = quad(u0, u0 + grid.width, z0, z0 + grid.height);
      if (run) levels[Math.min(3, Math.floor(rand() * 4))] += d;
      else dark.push(d);
    }
  }
  return (
    `<path class="cw-dark" d="${dark.join("")}"/>` +
    levels
      .map((d, level) => (d ? `<path class="cw-lit" data-l="${level}" d="${d}"/>` : ""))
      .join("")
  );
}

/**
 * A soft pool of light on a horizontal plane. A floor circle projects to an
 * ellipse whose axes are the screen axes, so it needs no transform: every
 * transform in the static city is one more node Chrome walks on each frame.
 */
export function pool(
  P: Projection,
  x: number,
  y: number,
  z: number,
  radius: number,
  color: "amber" | "red" | "cool" = "amber",
) {
  const ex = axisVector(P, [1, 0, 0]);
  const ey = axisVector(P, [0, 1, 0]);
  const [cx, cy] = iso([x, y, z], P);
  const rx = Math.hypot(ex[0], ey[0]) * radius;
  const ry = Math.hypot(ex[1], ey[1]) * radius;
  return `<ellipse class="glow-pool" data-c="${color}" cx="${round(cx)}" cy="${round(cy)}" rx="${round(rx)}" ry="${round(ry)}"/>`;
}

export type NeonColor = "red" | "rose" | "white";

/**
 * A neon tube along world points: a wide, faint stroke for the glow and a thin
 * bright core on top. No blur filter, which would cost a GPU pass per tube.
 * Tubes never animate: anything animated is lifted to the lights layer, above
 * every building, and a tube behind a tower would then show through it.
 */
export function neon(
  P: Projection,
  points: Point3[],
  color: NeonColor = "red",
  { closed = false }: { closed?: boolean } = {},
) {
  const d = pathOf(
    points.map((point) => iso(point, P)),
    closed,
  );
  return `<path class="neon-glow" data-c="${color}" d="${d}"/><path class="neon" data-c="${color}" d="${d}"/>`;
}

/** A closed neon rectangle on a face, framing a sign or a doorway. */
export function neonFrame(
  P: Projection,
  face: "x" | "y",
  at: number,
  from: number,
  to: number,
  z0: number,
  z1: number,
  color: NeonColor = "red",
) {
  const point = (u: number, z: number): Point3 => (face === "x" ? [at, u, z] : [u, at, z]);
  return neon(P, [point(from, z0), point(to, z0), point(to, z1), point(from, z1)], color, {
    closed: true,
  });
}

/** A closed neon outline round a roof, at height z. */
export function neonRoof(
  P: Projection,
  x: number,
  y: number,
  w: number,
  d: number,
  z: number,
  color: NeonColor = "red",
) {
  return neon(
    P,
    [
      [x, y, z],
      [x + w, y, z],
      [x + w, y + d, z],
      [x, y + d, z],
    ],
    color,
    { closed: true },
  );
}

/** A glow around a small light seen from any side: a circle on screen. */
export function halo(
  P: Projection,
  point: Point3,
  radius: number,
  color: "amber" | "red" | "white" = "amber",
  pulse = false,
) {
  const [sx, sy] = iso(point, P);
  const k = Math.hypot(
    ...(iso([1, 0, 0], P).map((v, i) => v - iso([0, 0, 0], P)[i]) as [number, number]),
  );
  return `<circle class="glow-halo" data-c="${color}"${pulse ? ' data-pulse=""' : ""} cx="${round(sx)}" cy="${round(sy)}" r="${round(radius * k)}"/>`;
}

/**
 * Light washing up a facade from a source at its foot. Drawn as a rectangle in
 * the face plane with a vertical gradient, so it lies exactly on the face.
 */
export function wash(
  P: Projection,
  face: "x" | "y",
  at: number,
  from: number,
  to: number,
  z0: number,
  height: number,
) {
  const corner: [number, number] = face === "x" ? [at, to] : [from, at];
  const matrix = sideMatrix(corner, z0 + height, P, face === "x" ? "right" : "left");
  return `<rect class="glow-wash" x="0" y="0" width="${round(to - from)}" height="${round(height)}" transform="${matrix}"/>`;
}

/** A lit rectangle on a face: signs, screens, open dock doors. */
export function panel(
  P: Projection,
  face: "x" | "y",
  at: number,
  from: number,
  to: number,
  z0: number,
  z1: number,
  className: string,
) {
  const point = (u: number, z: number): Point3 => (face === "x" ? [at, u, z] : [u, at, z]);
  return `<path class="${className}" d="${pathOf([iso(point(from, z0), P), iso(point(to, z0), P), iso(point(to, z1), P), iso(point(from, z1), P)], true)}"/>`;
}

/** Text painted on a face: the one engraved label a sign may carry. */
export function faceLabel(
  P: Projection,
  face: "x" | "y",
  at: number,
  from: number,
  baseline: number,
  text: string,
  size: number,
  className = "city-sign",
) {
  const corner: [number, number] = face === "x" ? [at, from] : [from, at];
  const matrix =
    face === "x"
      ? sideMatrix([at, from], baseline, P, "right")
      : sideMatrix(corner, baseline, P, "left");
  // sideMatrix "right" runs along -y; flip it so text on an x face reads left to right.
  const flip = face === "x" ? " scale(-1 1)" : "";
  return `<text class="${className}" font-size="${size}" transform="${matrix}${flip}">${text}</text>`;
}

/* ---------- small furniture ---------- */

export function tree(P: Projection, x: number, y: number, scale = 1, seed = 1) {
  const rand = seeded(seed);
  const piece = new Piece(P);
  const trunk = 3.2 * scale;
  piece.cyl(x, y, 0.45 * scale, 0, trunk, { tone: "lo", steps: 10 });
  piece.ball([x, y, trunk + 2.4 * scale], (2.6 + rand() * 0.8) * scale, {
    tone: "mid",
    className: "m-leaf",
  });
  return piece;
}

export function streetlamp(P: Projection, x: number, y: number, arm: "x" | "y" | "-x" | "-y") {
  const piece = new Piece(P);
  const h = 7;
  const dx = arm === "x" ? 1.6 : arm === "-x" ? -1.6 : 0;
  const dy = arm === "y" ? 1.6 : arm === "-y" ? -1.6 : 0;
  piece.cyl(x, y, 0.5, 0, 0.6, { tone: "lo", steps: 10 });
  piece.cyl(x, y, 0.22, 0.6, h, { tone: "mid", steps: 8, crease: "none" });
  piece.line(
    [
      [x, y, h + 0.4],
      [x + dx, y + dy, h + 0.4],
    ],
    "mid",
  );
  piece.box3(x + dx - 0.5, y + dy - 0.5, h - 0.1, 1, 1, 0.5, { tone: "hi", r: 0.2 });
  piece.raw(halo(P, [x + dx, y + dy, h - 0.2], 2.2, "amber"));
  piece.dots([[x + dx, y + dy, h - 0.15]], 0.55, "hi");
  return piece;
}

export const lampPool = (P: Projection, x: number, y: number) => pool(P, x, y, 0.05, 7, "amber");
