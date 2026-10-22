import { iso, type Projection } from "./kit/iso-kit.ts";
import { halo, Piece, panel, pool } from "./parts";
import { MONORAIL, SEA } from "./plan";
import type { Route } from "./routes";

/**
 * Vehicle motion, as pure functions of time so the page, the tests and a
 * reduced-motion still frame all agree. Sprites are built once at the world
 * origin, one per heading, and the page only translates them.
 */

export type Heading = "+x" | "-x" | "+y" | "-y";

export interface Pose {
  x: number;
  y: number;
  z: number;
  heading: Heading;
  /** 0..1, for boats that fade out at the edge of the picture. */
  alpha: number;
}

type Path = Array<[number, number]>;

const length = (path: Path) =>
  path.reduce(
    (sum, point, index) =>
      index ? sum + Math.hypot(point[0] - path[index - 1][0], point[1] - path[index - 1][1]) : 0,
    0,
  );

/** The path shifted to the right-hand side of travel, mitred at the corners. */
export function laneOf(path: Path, lane: number): Path {
  if (!lane) return path;
  const normals = path.slice(1).map((point, index) => {
    const dx = point[0] - path[index][0];
    const dy = point[1] - path[index][1];
    const len = Math.hypot(dx, dy) || 1;
    return [dy / len, -dx / len] as [number, number];
  });
  return path.map(([x, y], index) => {
    const a = normals[Math.max(0, index - 1)];
    const b = normals[Math.min(normals.length - 1, index)];
    // At a right-angle corner both offsets apply: the corner of the two lane lines.
    if (index > 0 && index < path.length - 1 && (a[0] !== b[0] || a[1] !== b[1])) {
      return [x + (a[0] + b[0]) * lane, y + (a[1] + b[1]) * lane];
    }
    return [x + a[0] * lane, y + a[1] * lane];
  });
}

function along(path: Path, distance: number): { x: number; y: number; dx: number; dy: number } {
  let left = Math.max(0, distance);
  for (let index = 1; index < path.length; index++) {
    const [ax, ay] = path[index - 1];
    const [bx, by] = path[index];
    const seg = Math.hypot(bx - ax, by - ay);
    if (left <= seg || index === path.length - 1) {
      const t = seg ? Math.min(1, left / seg) : 0;
      return { x: ax + (bx - ax) * t, y: ay + (by - ay) * t, dx: bx - ax, dy: by - ay };
    }
    left -= seg;
  }
  const [x, y] = path[0];
  return { x, y, dx: 1, dy: 0 };
}

const headingOf = (dx: number, dy: number): Heading =>
  Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? "+x" : "-x") : dy >= 0 ? "+y" : "-y";

const CLIMB = 3.2;

export function scheduleOf(route: Route) {
  const distance = length(route.path);
  const travel = distance / route.speed + (route.mode === "air" ? CLIMB * 2 : 0);
  const period = route.loop === "shuttle" ? (travel + route.dwell) * 2 : travel + route.dwell;
  return { distance, leg: travel, period };
}

const smooth = (t: number) => {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
};

const baseZ = (route: Route) =>
  route.mode === "monorail"
    ? MONORAIL.z + 2.6
    : route.mode === "water"
      ? SEA
      : route.mode === "rail"
        ? 0.2
        : 0.1;

/** Where vehicle `index` of a route is at time `t` seconds. */
export function poseAt(route: Route, index: number, t: number): Pose {
  const { distance, leg, period } = scheduleOf(route);
  const phase = (((t + (index * period) / route.count) % period) + period) % period;
  const lane = route.lane ?? 0;

  if (route.loop === "outbound") {
    const out = laneOf(route.path, lane);
    if (phase < route.dwell) {
      const p = along(out, 0);
      return {
        x: p.x,
        y: p.y,
        z: baseZ(route),
        heading: headingOf(p.dx, p.dy),
        alpha: smooth(phase / route.dwell),
      };
    }
    const d = (phase - route.dwell) * route.speed;
    const p = along(out, d);
    const tail = 1 - smooth((d - distance * 0.82) / (distance * 0.18));
    return { x: p.x, y: p.y, z: baseZ(route), heading: headingOf(p.dx, p.dy), alpha: tail };
  }

  const forward = phase < leg + route.dwell;
  const local = forward ? phase : phase - leg - route.dwell;
  const moving = local < leg;
  const path = forward ? route.path : [...route.path].reverse();
  const lanePath = laneOf(path, lane);

  if (route.mode === "air") {
    const [pad, cruise, landing] = route.heights ?? [0, 60, 0];
    const [z0, z1] = forward ? [pad, landing] : [landing, pad];
    if (!moving) {
      const end = along(lanePath, distance);
      return { x: end.x, y: end.y, z: z1, heading: headingOf(end.dx, end.dy), alpha: 1 };
    }
    const flying = Math.max(0, Math.min(distance, (local - CLIMB) * route.speed));
    const p = along(lanePath, flying);
    let z = cruise;
    if (local < CLIMB) z = z0 + (cruise - z0) * smooth(local / CLIMB);
    else if (local > leg - CLIMB) z = z1 + (cruise - z1) * smooth((leg - local) / CLIMB);
    return { x: p.x, y: p.y, z, heading: headingOf(p.dx, p.dy), alpha: 1 };
  }

  const d = moving ? local * route.speed : distance;
  const p = along(lanePath, d);
  return { x: p.x, y: p.y, z: baseZ(route), heading: headingOf(p.dx, p.dy), alpha: 1 };
}

/* ---------- sprites ---------- */

export interface Sprite {
  /** One SVG per heading, built at the world origin. */
  svg: Record<Heading, string>;
  /** Half extents along and across the direction of travel, and height. */
  size: [number, number, number];
}

const HEADINGS: Heading[] = ["+x", "-x", "+y", "-y"];

/** Build a sprite whose body lies along +x, then rotate the plan for each heading. */
function spriteOf(
  P: Projection,
  size: [number, number, number],
  draw: (p: Piece, map: (u: number, v: number) => [number, number], h: Heading) => void,
): Sprite {
  const svg = {} as Record<Heading, string>;
  for (const heading of HEADINGS) {
    const p = new Piece(P);
    const map = (u: number, v: number): [number, number] => {
      switch (heading) {
        case "+x":
          return [u, v];
        case "-x":
          return [-u, -v];
        case "+y":
          return [-v, u];
        case "-y":
          return [v, -u];
      }
    };
    draw(p, map, heading);
    svg[heading] = p.svg();
  }
  return { svg, size };
}

/** A box given in the vehicle's own frame (u forward, v left), placed for the heading. */
function bodyBox(
  p: Piece,
  map: (u: number, v: number) => [number, number],
  u0: number,
  u1: number,
  v0: number,
  v1: number,
  z: number,
  h: number,
  tone: "hi" | "mid" | "lo",
  className?: string,
) {
  const [ax, ay] = map(u0, v0);
  const [bx, by] = map(u1, v1);
  p.box3(Math.min(ax, bx), Math.min(ay, by), z, Math.abs(bx - ax), Math.abs(by - ay), h, {
    tone,
    r: 0.2,
    bevel: 0.15,
    className,
  });
}

const lights = (
  p: Piece,
  map: (u: number, v: number) => [number, number],
  u: number,
  half: number,
  z: number,
) => {
  for (const v of [-half + 0.4, half - 0.4]) {
    const [x, y] = map(u, v);
    p.raw(halo(p.P, [x, y, z], 1.4, "amber"));
  }
  const [fx, fy] = map(u + 5, 0);
  p.raw(pool(p.P, fx, fy, 0.12, 4.2));
};

export function sprites(P: Projection): Record<string, Sprite> {
  return {
    furgoneta: spriteOf(P, [2.6, 1.15, 2.8], (p, map) => {
      bodyBox(p, map, -2.6, 2.6, -1.15, 1.15, 0.3, 0.4, "lo");
      bodyBox(p, map, -2.6, 1.2, -1.15, 1.15, 0.7, 2.1, "hi", "m-van");
      bodyBox(p, map, 1.2, 2.6, -1.1, 1.1, 0.7, 1.4, "hi", "m-van");
      lights(p, map, 2.6, 1.15, 1.1);
    }),
    camion: spriteOf(P, [4.8, 1.3, 3.8], (p, map) => {
      bodyBox(p, map, -4.8, 4.8, -1.3, 1.3, 0.3, 0.5, "lo");
      bodyBox(p, map, -4.8, 2.2, -1.3, 1.3, 0.8, 3, "mid", "m-trailer");
      bodyBox(p, map, 2.6, 4.8, -1.25, 1.25, 0.8, 2.2, "hi", "m-van");
      lights(p, map, 4.8, 1.3, 1.3);
    }),
    monorriel: spriteOf(P, [19, 1.8, 4], (p, map, h) => {
      // Three cars, nose to tail; the lit window band runs along each.
      for (const [u0, u1] of [
        [-19, -7.4],
        [-6.4, 6.4],
        [7.4, 19],
      ]) {
        bodyBox(p, map, u0, u1, -1.8, 1.8, 0, 3.6, "hi", "m-train");
        const [ax, ay] = map(u0 + 0.8, 1.8);
        const [bx, by] = map(u1 - 0.8, 1.8);
        const face = h === "+y" || h === "-y" ? "x" : "y";
        const at = face === "x" ? Math.max(ax, bx) : Math.max(ay, by);
        const lo = face === "x" ? Math.min(ay, by) : Math.min(ax, bx);
        const hi = face === "x" ? Math.max(ay, by) : Math.max(ax, bx);
        p.raw(panel(P, face, at + 0.02, lo, hi, 1.4, 2.8, "lit-store"));
      }
      lights(p, map, 19, 1.8, 1.4);
    }),
    tren: spriteOf(P, [24, 1.6, 4.2], (p, map) => {
      bodyBox(p, map, 14, 24, -1.6, 1.6, 0.4, 4, "hi", "m-loco");
      for (let c = 0; c < 4; c++) {
        const u1 = 13 - c * 9.4;
        bodyBox(
          p,
          map,
          u1 - 8.6,
          u1,
          -1.6,
          1.6,
          0.4,
          3.4,
          c % 2 ? "mid" : "lo",
          c % 2 ? "m-container" : "m-container b",
        );
      }
      lights(p, map, 24, 1.6, 2.2);
    }),
    ferry: spriteOf(P, [7, 2.6, 5], (p, map, h) => {
      const along: "x" | "y" = h === "+x" || h === "-x" ? "x" : "y";
      const [sx, sy] = map(-7, 0);
      const sign = h === "+x" || h === "+y" ? 1 : -1;
      const start: [number, number, number] =
        along === "x"
          ? [Math.min(sx, sx + sign * 14), sy, 0]
          : [sx, Math.min(sy, sy + sign * 14), 0];
      p.prism(
        along,
        start,
        14,
        [
          [-2.6, 0.2],
          [2.6, 0.2],
          [2.2, 2],
          [-2.2, 2],
        ],
        { tone: "mid", className: "m-hull" },
      );
      bodyBox(p, map, -4, 3, -1.8, 1.8, 2, 2.4, "hi", "m-van");
      lights(p, map, 7, 2.6, 2.8);
    }),
    barco: spriteOf(P, [4.6, 1.6, 3.6], (p, map, h) => {
      const along: "x" | "y" = h === "+x" || h === "-x" ? "x" : "y";
      const [sx, sy] = map(-4.6, 0);
      const sign = h === "+x" || h === "+y" ? 1 : -1;
      const start: [number, number, number] =
        along === "x"
          ? [Math.min(sx, sx + sign * 9.2), sy, 0]
          : [sx, Math.min(sy, sy + sign * 9.2), 0];
      p.prism(
        along,
        start,
        9.2,
        [
          [-1.6, 0.2],
          [1.6, 0.2],
          [1.3, 1.6],
          [-1.3, 1.6],
        ],
        { tone: "mid", className: "m-hull" },
      );
      bodyBox(p, map, -2.4, 1.2, -1, 1, 1.6, 1.8, "hi", "m-van");
      const [mx, my] = map(0, 0);
      p.cyl(mx, my, 0.12, 3.4, 3, { tone: "mid", steps: 6, crease: "none" });
      p.raw(halo(P, [mx, my, 6.6], 2.6, "white", true));
    }),
    helicoptero: spriteOf(P, [4.4, 4.2, 3.4], (p, map) => {
      const [tx, ty] = map(-4.4, 0);
      p.line(
        [
          [map(-1, 0)[0], map(-1, 0)[1], 1.6],
          [tx, ty, 1.9],
        ],
        "hi",
      );
      p.ball([0, 0, 1.4], 1.4, { tone: "hi", className: "m-van" });
      const [cx, cy] = map(0.9, 0);
      p.ball([cx, cy, 1.4], 0.8, { tone: "mid", className: "m-glass" });
      // Rotor disc: a faint ellipse in the horizontal plane, with two blades.
      const disc = Array.from({ length: 40 }, (_, i) => {
        const a = (i / 40) * Math.PI * 2;
        return iso([Math.cos(a) * 4.2, Math.sin(a) * 4.2, 3.1], P);
      });
      p.raw(
        `<path class="rotor-disc" d="M${disc.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L")}Z"/>`,
      );
      p.raw(`<path class="rotor-blade" data-rotor="" d=""/>`);
      p.raw(halo(P, [tx, ty, 2], 1.6, "white", true));
      p.raw(halo(P, [0, 0, 0.2], 3, "amber"));
    }),
  };
}

/** Screen offset that carries a sprite built at the origin to a world point. */
export function offsetOf(P: Projection, x: number, y: number, z: number): [number, number] {
  const [ox, oy] = iso([0, 0, 0], P);
  const [sx, sy] = iso([x, y, z], P);
  return [sx - ox, sy - oy];
}
