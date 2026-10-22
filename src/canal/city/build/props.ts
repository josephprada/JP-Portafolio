import type { Point3, Projection } from "../kit/iso-kit.ts";
import { frameAlong, solidOf } from "../kit/lathe.mjs";
import type { RegionId } from "../model";
import { halo, type Item, neon, neonFrame, Piece, panel, pool } from "../parts";
import type { Rect } from "../plan";

/**
 * Street furniture and yards: the parts of each district that are not
 * buildings but make it read as a place where work happens. Each prop has a
 * footprint, checked against the plan in props.test.ts, and builds one item.
 */

export type PropKind =
  | "fuente"
  | "puestos"
  | "escenario"
  | "bancos"
  | "patio-furgonetas"
  | "contenedores"
  | "antenas"
  | "parqueo-camiones";

export interface Prop {
  id: string;
  region: RegionId;
  kind: PropKind;
  rect: Rect;
}

export const PROPS: Prop[] = [
  // Malecón creativo
  { id: "fuente", region: "malecon", kind: "fuente", rect: { x: 182, y: 96, w: 28, d: 28 } },
  { id: "puestos", region: "malecon", kind: "puestos", rect: { x: 70, y: 196, w: 64, d: 14 } },
  { id: "escenario", region: "malecon", kind: "escenario", rect: { x: 150, y: 206, w: 40, d: 24 } },
  { id: "bancos", region: "malecon", kind: "bancos", rect: { x: 70, y: 250, w: 172, d: 5 } },
  // Parque logístico Shorts · TikTok
  {
    id: "patio-furgonetas",
    region: "shorts",
    kind: "patio-furgonetas",
    rect: { x: 66, y: -98, w: 62, d: 30 },
  },
  {
    id: "contenedores",
    region: "shorts",
    kind: "contenedores",
    rect: { x: 136, y: -100, w: 50, d: 32 },
  },
  // Estudios de video
  { id: "antenas", region: "videos", kind: "antenas", rect: { x: -142, y: 214, w: 30, d: 30 } },
  {
    id: "parqueo-camiones",
    region: "videos",
    kind: "parqueo-camiones",
    rect: { x: -100, y: 168, w: 28, d: 40 },
  },
];

/* ---------- Malecón ---------- */

/** A round basin with a two-tier bowl, lit water and jets, ringed by benches. */
function fountain({ x, y, w }: Rect, P: Projection): Piece {
  const p = new Piece(P);
  const cx = x + w / 2;
  const cy = y + w / 2;
  // Benches on the four sides, behind the basin first.
  const bench = (bx: number, by: number, along: "x" | "y") => {
    const [bw, bd] = along === "x" ? [4.4, 1.2] : [1.2, 4.4];
    p.box3(bx - bw / 2, by - bd / 2, 0.9, bw, bd, 0.35, {
      tone: "mid",
      r: 0.15,
      className: "m-wood",
    });
    for (const s of [-1, 1]) {
      const [lx, ly] = along === "x" ? [bx + s * 1.6, by] : [bx, by + s * 1.6];
      p.box3(lx - 0.25, ly - 0.25, 0, 0.5, 0.5, 0.9, { tone: "lo", r: 0 });
    }
  };
  bench(cx, cy - 13, "x");
  bench(cx - 13, cy, "y");
  p.cyl(cx, cy, 12, 0, 1.3, { tone: "mid", steps: 48, className: "m-stone" });
  p.cyl(cx, cy, 11, 1.3, 0.05, { tone: "lo", steps: 48, className: "m-water" });
  // A red tube round the rim of the basin.
  p.raw(
    neon(
      P,
      Array.from({ length: 40 }, (_, i): Point3 => {
        const a = (i / 40) * Math.PI * 2;
        return [cx + Math.cos(a) * 11.6, cy + Math.sin(a) * 11.6, 1.32];
      }),
      "red",
      { closed: true },
    ),
  );
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    p.raw(halo(P, [cx + Math.cos(a) * 8, cy + Math.sin(a) * 8, 1.4], 2.2, "amber"));
  }
  // Jets: arcs from the inner ring to the lower bowl.
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    const at = (r: number, z: number): Point3 => [cx + Math.cos(a) * r, cy + Math.sin(a) * r, z];
    p.line([at(8.5, 1.35), at(7, 4.2), at(5, 5.4), at(3.4, 4.6)], "hi", { className: "jet" });
  }
  p.turned(
    cx,
    cy,
    1.3,
    [
      [0, 1.4],
      [2.6, 0.8],
      [3, 3.4, 1],
      [3.6, 3.6],
      [4.4, 0.7],
      [6.4, 0.6],
      [6.8, 1.8, 1],
      [7.2, 1.9],
      [8.4, 0.4],
    ],
    { tone: "hi", className: "m-stone" },
  );
  p.raw(halo(P, [cx, cy, 8.6], 2.4, "white", false));
  bench(cx + 13, cy, "y");
  bench(cx, cy + 13, "x");
  return p;
}

/** Three food stalls with striped awnings and lit counters. */
function stalls({ x, y }: Rect, P: Projection): Piece {
  const p = new Piece(P);
  for (let i = 0; i < 3; i++) {
    const sx = x + i * 23;
    p.box3(sx, y + 2, 0, 18, 9, 5.2, { tone: "mid", bevel: 0.3, className: "m-wood" });
    p.seam(sx, y + 2, 18, 9, 2.6);
    p.raw(panel(P, "y", y + 11.02, sx + 2, sx + 16, 1.4, 4.4, "lit-store"));
    p.raw(panel(P, "x", sx + 18.02, y + 4, y + 9, 1.4, 4.4, "lit-glass"));
    p.box3(sx + 1, y + 11, 0, 16, 1.6, 2.2, { tone: "hi", r: 0.15 });
    // Awning out over the counter, then the roof sign.
    p.prism(
      "x",
      [sx, y + 11, 0],
      18,
      [
        [-0.6, 6.6],
        [2.8, 5.4],
        [2.8, 5],
        [-0.6, 6.2],
      ],
      { tone: "hi", className: i % 2 ? "m-canvas" : "m-canvas b" },
    );
    p.box3(sx + 4, y + 3, 5.2, 10, 1.2, 2.6, { tone: "hi", r: 0.1, className: "m-sign" });
    p.raw(
      neon(
        P,
        [
          [sx, y + 13.8, 5.02],
          [sx + 18, y + 13.8, 5.02],
        ],
        i === 1 ? "rose" : "red",
      ),
    );
    p.raw(pool(P, sx + 9, y + 13, 0.1, 6, "red"));
  }
  return p;
}

/** An open-air stage with an LED wall, a lighting truss and speaker stacks. */
function stage({ x, y, w, d }: Rect, P: Projection): Piece {
  const p = new Piece(P);
  p.box3(x, y, 0, w, d - 1, 2.2, { tone: "mid", bevel: 0.3, className: "m-wood" });
  p.seam(x, y, w, d - 1, 1.1);
  p.box3(x + 1, y, 2.2, w - 2, 2, 13, { tone: "mid", bevel: 0.3 });
  p.raw(panel(P, "y", y + 2.02, x + 4, x + w - 4, 4.4, 13.6, "stage-screen"));
  p.raw(panel(P, "y", y + 2.03, x + 7, x + w - 7, 7.6, 10.2, "stage-screen-ink"));
  p.raw(neonFrame(P, "y", y + 2.05, x + 3.4, x + w - 3.4, 3.8, 14.2, "red"));
  // Front steps.
  p.box3(x + w / 2 - 4, y + d - 1, 0, 8, 1, 1.1, { tone: "hi", r: 0 });
  for (const sx of [x + 1, x + w - 4]) {
    p.box3(sx, y + d - 6, 2.2, 3, 3, 5.4, { tone: "lo", bevel: 0.2 });
    p.dots(
      [
        [sx + 3.02, y + d - 4.5, 3.6],
        [sx + 3.02, y + d - 4.5, 6],
      ],
      0.55,
      "mid",
    );
  }
  // Truss: two posts at the front, a beam across, spotlights hanging from it.
  for (const tx of [x + 1.2, x + w - 1.2])
    p.cyl(tx, y + d - 2, 0.45, 2.2, 15, { tone: "hi", steps: 8 });
  p.box3(x + 0.6, y + d - 2.6, 17.2, w - 1.2, 1.2, 1.2, { tone: "hi", r: 0 });
  for (let i = 0; i < 4; i++) {
    const lx = x + 7 + i * ((w - 14) / 3);
    p.box3(lx - 0.7, y + d - 2.4, 15.6, 1.4, 1.4, 1.6, { tone: "lo", r: 0.2 });
    p.raw(halo(P, [lx, y + d - 2.6, 15.4], 2.6, "white"));
    p.raw(pool(P, lx, y + d - 8, 2.25, 4.6, "cool"));
  }
  return p;
}

/** Benches and planters along the boardwalk, facing the sea. */
function benches({ x, y, w }: Rect, P: Projection): Piece {
  const p = new Piece(P);
  for (let bx = x + 2; bx + 8 <= x + w; bx += 28) {
    p.box3(bx, y + 1, 0.9, 6, 1.6, 0.35, { tone: "mid", r: 0.15, className: "m-wood" });
    p.box3(bx, y + 0.4, 1.25, 6, 0.4, 1.4, { tone: "mid", r: 0.1, className: "m-wood" });
    for (const lx of [bx + 0.8, bx + 5.2])
      p.box3(lx - 0.25, y + 1.5, 0, 0.5, 0.6, 0.9, { tone: "lo", r: 0 });
    // A planter between benches.
    if (bx + 22 <= x + w) {
      p.box3(bx + 13, y + 0.5, 0, 4, 4, 1.4, { tone: "lo", bevel: 0.2, className: "m-stone" });
      p.ball([bx + 15, y + 2.5, 2.4], 1.6, { tone: "mid", className: "m-leaf" });
    }
  }
  return p;
}

/* ---------- Shorts · TikTok ---------- */

/** One van parked along y at (x, y), in place. */
function van(p: Piece, x: number, y: number) {
  p.box3(x - 1.15, y, 0.3, 2.3, 5.2, 0.4, { tone: "lo", r: 0.2 });
  p.box3(x - 1.15, y + 1.4, 0.7, 2.3, 3.8, 2.1, {
    tone: "hi",
    r: 0.2,
    bevel: 0.15,
    className: "m-van",
  });
  p.box3(x - 1.1, y, 0.7, 2.2, 1.4, 1.4, { tone: "hi", r: 0.2, bevel: 0.15, className: "m-van" });
}

/** Vans waiting for the next load, in marked bays, with pallets and a forklift. */
function vanYard({ x, y, w, d }: Rect, P: Projection): Piece {
  const p = new Piece(P);
  for (let i = 0; i <= 5; i++) {
    const lx = x + 3 + i * 7;
    p.line(
      [
        [lx, y + 2, 0.06],
        [lx, y + 10, 0.06],
      ],
      "mid",
    );
  }
  for (let i = 0; i < 5; i++) if (i !== 2) van(p, x + 6.5 + i * 7, y + 3.4);
  // Pallets of parcels.
  for (let i = 0; i < 3; i++) {
    const px = x + 42 + i * 6;
    p.box3(px, y + 4, 0, 4, 4, 0.5, { tone: "lo", r: 0, className: "m-wood" });
    p.box3(px + 0.3, y + 4.3, 0.5, 3.4, 3.4, 1.6 + (i % 2) * 1.2, {
      tone: "hi",
      r: 0.1,
      className: "m-parcel",
    });
  }
  // Forklift.
  const fx = x + 46;
  const fy = y + d - 12;
  p.box3(fx, fy, 0.3, 3, 4.6, 1.8, { tone: "hi", r: 0.3, className: "m-forklift" });
  p.box3(fx + 0.4, fy + 1.4, 2.1, 2.2, 2.6, 0.2, { tone: "mid", r: 0 });
  for (const ux of [fx + 0.5, fx + 2.5]) {
    p.line(
      [
        [ux, fy + 1.4, 2.1],
        [ux, fy + 1.4, 3.8],
      ],
      "mid",
    );
  }
  p.box3(fx + 0.6, fy + 4.6, 0, 1.8, 2.4, 0.3, { tone: "lo", r: 0 });
  p.raw(pool(P, x + w / 2, y + 8, 0.08, 14));
  return p;
}

/** Stacked shipping containers and a guard booth. */
function containerStacks({ x, y, d }: Rect, P: Projection): Piece {
  const p = new Piece(P);
  const box = (cx: number, cy: number, level: number, b: boolean) => {
    p.box3(cx, cy, level * 5, 12, 5, 5, {
      tone: b ? "lo" : "mid",
      r: 0.1,
      bevel: 0.2,
      className: b ? "m-container b" : "m-container",
    });
    for (let u = cx + 1.5; u < cx + 12; u += 1.5) {
      p.line(
        [
          [u, cy + 5.02, level * 5 + 0.4],
          [u, cy + 5.02, level * 5 + 4.6],
        ],
        "faint",
      );
    }
  };
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 2; col++) {
      const levels = 1 + ((row + col * 2) % 3);
      for (let level = 0; level < levels; level++)
        box(x + 2 + col * 14, y + 2 + row * 7, level, (row + level + col) % 2 === 1);
    }
  }
  // Guard booth with a lit window and a barrier arm.
  const gx = x + 34;
  const gy = y + d - 10;
  p.box3(gx, gy, 0, 7, 6, 4.4, { tone: "mid", bevel: 0.3, className: "m-stone" });
  p.raw(panel(P, "y", gy + 6.02, gx + 1.2, gx + 5.8, 1.8, 3.6, "lit-store"));
  p.box3(gx - 0.6, gy - 0.6, 4.4, 8.2, 7.2, 0.6, { tone: "hi", r: 0.1 });
  p.box3(gx + 9, gy + 5, 0, 0.8, 0.8, 2.2, { tone: "hi", r: 0 });
  p.box3(gx + 9.8, gy + 5.2, 1.7, 5, 0.4, 0.4, { tone: "hi", r: 0, className: "m-barrier" });
  p.raw(halo(P, [gx + 3.5, gy + 6.4, 4.8], 2.4, "amber"));
  return p;
}

/* ---------- Estudios de video ---------- */

/** A satellite dish on a pedestal, tilted toward the sky. */
function dish(p: Piece, x: number, y: number, size: number) {
  p.box3(x - size * 0.7, y - size * 0.7, 0, size * 1.4, size * 1.4, 0.8, {
    tone: "lo",
    r: 0.2,
    className: "m-stone",
  });
  p.cyl(x, y, size * 0.18, 0.8, size * 1.1, { tone: "mid", steps: 10 });
  const centre: Point3 = [x, y, 0.8 + size * 1.2];
  const axis: Point3 = [0.55, 0.35, 0.76];
  const F = frameAlong(centre, axis);
  const r = size;
  p.extend(x - r, y - r, centre[2] - r, x + r, y + r, centre[2] + r);
  p.solid(
    solidOf(
      [
        [0, size * 0.2],
        [size * 0.25, size * 0.6, 1],
        [size * 0.42, size],
      ],
      F,
      p.P,
    ),
    { tone: "hi", className: "m-dish" },
  );
  const tip: Point3 = [
    centre[0] + axis[0] * size * 1.1,
    centre[1] + axis[1] * size * 1.1,
    centre[2] + axis[2] * size * 1.1,
  ];
  p.line(
    [
      [
        centre[0] + axis[0] * size * 0.42,
        centre[1] + axis[1] * size * 0.42,
        centre[2] + axis[2] * size * 0.42,
      ],
      tip,
    ],
    "mid",
  );
  p.dots([tip], 0.35, "hi");
}

/** The uplink yard: three dishes and an equipment cabinet. */
function uplink({ x, y }: Rect, P: Projection): Piece {
  const p = new Piece(P);
  p.box3(x + 20, y + 2, 0, 8, 5, 4.2, { tone: "mid", bevel: 0.3, className: "m-metal" });
  p.dots(
    [
      [x + 28.02, y + 3.5, 3.2],
      [x + 28.02, y + 4.6, 3.2],
      [x + 28.02, y + 5.7, 3.2],
    ],
    0.35,
    "hi",
  );
  dish(p, x + 7, y + 7, 5);
  dish(p, x + 21, y + 17, 4);
  dish(p, x + 8, y + 22, 6);
  p.raw(halo(P, [x + 24, y + 7.2, 4.6], 2, "red", true));
  return p;
}

/** Two articulated trucks parked at the studios, in marked bays. */
function truckBays({ x, y, w }: Rect, P: Projection): Piece {
  const p = new Piece(P);
  for (let i = 0; i <= 2; i++) {
    const lx = x + 4 + i * 10;
    p.line(
      [
        [lx, y + 2, 0.06],
        [lx, y + 30, 0.06],
      ],
      "mid",
    );
  }
  for (let i = 0; i < 2; i++) {
    const tx = x + 9 + i * 10;
    const ty = y + 4 + i * 3;
    p.box3(tx - 1.3, ty, 0.3, 2.6, 22, 0.5, { tone: "lo", r: 0.2 });
    p.box3(tx - 1.3, ty, 0.8, 2.6, 15, 3, {
      tone: "mid",
      r: 0.2,
      bevel: 0.15,
      className: "m-trailer",
    });
    p.box3(tx - 1.25, ty + 16.6, 0.8, 2.5, 4.6, 2.2, {
      tone: "hi",
      r: 0.2,
      bevel: 0.15,
      className: "m-van",
    });
  }
  p.raw(pool(P, x + w / 2, y + 26, 0.08, 12));
  return p;
}

/* ---------- build ---------- */

const HOVER: Record<PropKind, { kind: string; title: string; summary?: string }> = {
  fuente: {
    kind: "Marketing",
    title: "Plaza de la fuente",
    summary: "El punto de encuentro del paseo",
  },
  puestos: { kind: "Marketing", title: "Puestos del paseo" },
  escenario: {
    kind: "Marketing",
    title: "Escenario",
    summary: "Donde se graba el contenido para redes",
  },
  bancos: { kind: "Marketing", title: "Bancos frente al mar" },
  "patio-furgonetas": {
    kind: "Shorts · TikTok",
    title: "Patio de furgonetas",
    summary: "Esperan la próxima carga",
  },
  contenedores: { kind: "Shorts · TikTok", title: "Patio de contenedores" },
  antenas: {
    kind: "Estudios de video",
    title: "Patio de antenas",
    summary: "Por aquí sale cada video publicado",
  },
  "parqueo-camiones": { kind: "Estudios de video", title: "Muelle de camiones" },
};

const BUILDERS: Record<PropKind, (rect: Rect, P: Projection) => Piece> = {
  fuente: fountain,
  puestos: stalls,
  escenario: stage,
  bancos: benches,
  "patio-furgonetas": vanYard,
  contenedores: containerStacks,
  antenas: uplink,
  "parqueo-camiones": truckBays,
};

export function buildProps(P: Projection): Item[] {
  return PROPS.map((prop) =>
    BUILDERS[prop.kind](prop.rect, P).item(prop.id, {
      region: prop.region,
      hover: HOVER[prop.kind],
    }),
  );
}
