import { iso, type Point3, type Projection, pathOf, sideRing } from "../kit/iso-kit.ts";
import { marketing, projects } from "../model";
import {
  faceLabel,
  halo,
  hashOf,
  type Item,
  neonRoof,
  Piece,
  panel,
  pool,
  seeded,
  wash,
  windows,
} from "../parts";
import { LOTS, type Lot, SEA } from "../plan";

/* ---------- Parque logístico Shorts · TikTok ---------- */

/** Fulfilment shed: sawtooth roof with lit north lights, dock doors, rooftop plant. */
function warehouse(lot: Lot, P: Projection): Item {
  const { x, y, w, d } = lot.rect;
  const p = new Piece(P);
  const h = 12;
  p.box3(x, y, 0, w, d, h, { tone: "mid", bevel: 0.4, className: "m-metal" });
  p.raw(neonRoof(P, x + 0.3, y + 0.3, w - 0.6, d - 0.6, h + 0.05, "red"));
  // Wall cladding ribs on both visible faces, full height.
  for (let u = x + 4; u < x + w; u += 4)
    p.line(
      [
        [u, y + d, 0.4],
        [u, y + d, h],
      ],
      "faint",
    );
  for (let v = y + 4; v < y + d; v += 4)
    p.line(
      [
        [x + w, v, 0.4],
        [x + w, v, h],
      ],
      "faint",
    );
  p.seam(x, y, w, d, 4.2, "lo");
  // Sawtooth roof along x: each tooth a prism, glazed face lit.
  const teeth = Math.floor(d / 12);
  for (let t = 0; t < teeth; t++) {
    const ty = y + 2 + t * ((d - 4) / teeth);
    const depth = (d - 4) / teeth;
    p.prism(
      "x",
      [x + 2, ty, h],
      w - 4,
      [
        [0, 0],
        [depth, 0],
        [depth, 4.4],
      ],
      { tone: "mid", className: "m-metal" },
    );
    p.raw(panel(P, "y", ty + depth + 0.02, x + 3, x + w - 3, h + 0.6, h + 4, "lit-glass"));
  }
  // Dock doors on the street face; about half open and lit.
  const rand = seeded(hashOf(lot.id));
  for (let u = x + 4; u + 5 < x + w - 2; u += 7) {
    const open = rand() > 0.45;
    p.raw(panel(P, "y", y + d + 0.02, u, u + 5, 0.6, 5.4, open ? "lit-door" : "dock-shut"));
    p.box3(u - 0.4, y + d, 5.6, 5.8, 1.6, 0.4, { tone: "hi", r: 0.1 });
    if (open) p.raw(pool(P, u + 2.5, y + d + 4, 0.12, 6));
  }
  // Rooftop plant: fans and a vent stack.
  for (let i = 0; i < 3; i++)
    p.cyl(x + 12 + i * ((w - 24) / 2), y + d / 2, 1.8, h + 4.4, 1.4, { tone: "lo", steps: 16 });
  p.raw(wash(P, "x", x + w, y, y + d, 0, 8));
  return p.item(lot.id, {
    region: "shorts",
    hover: {
      kind: "Parque logístico",
      title: "Bodega de recorte",
      summary: "Recibe los directos y los corta en clips de menos de un minuto.",
    },
  });
}

/** One of the two output docks: a long shed with a lit sign and a row of bays. */
function dock(lot: Lot, P: Projection): Item {
  const { x, y, w, d } = lot.rect;
  const p = new Piece(P);
  const h = 10;
  const platform = lot.ref === "tiktok" ? "TIKTOK" : "SHORTS";
  p.box3(x, y, 0, w, d, h, { tone: "mid", bevel: 0.4, className: "m-metal" });
  p.box3(x - 0.6, y - 0.6, h, w + 1.2, d + 1.2, 1, { tone: "hi", r: 0.2 });
  p.raw(neonRoof(P, x - 0.6, y - 0.6, w + 1.2, d + 1.2, h + 1.05, "red"));
  // Bays with dock levellers and bumpers.
  for (let u = x + 3; u + 6 < x + w - 2; u += 8.5) {
    p.raw(panel(P, "y", y + d + 0.02, u, u + 6, 0.8, 6.2, "lit-door"));
    p.box3(u, y + d, 0, 6, 2.4, 0.8, { tone: "lo", r: 0.1 });
    p.box3(u - 0.6, y + d, 0.9, 0.5, 0.8, 1.6, { tone: "lo", r: 0.1 });
    p.box3(u + 6.1, y + d, 0.9, 0.5, 0.8, 1.6, { tone: "lo", r: 0.1 });
    p.raw(pool(P, u + 3, y + d + 5, 0.12, 6));
  }
  // The sign: a lit band with the platform name, the one label this building carries.
  p.raw(panel(P, "y", y + d + 0.05, x + 6, x + w - 6, h - 3.4, h - 0.6, "sign-band"));
  p.raw(
    faceLabel(
      P,
      "y",
      y + d + 0.1,
      x + w / 2 - platform.length * 1.1,
      h - 1.2,
      platform,
      2.6,
      "city-sign dark",
    ),
  );
  p.raw(halo(P, [x + w / 2, y + d + 1, h - 2], 12, "amber"));
  // Control cabin on the roof.
  p.box3(x + w - 14, y + 4, h + 1, 10, 8, 4, { tone: "mid", bevel: 0.3 });
  p.raw(panel(P, "y", y + 12.02, x + w - 13, x + w - 5, h + 2, h + 4.2, "lit-glass"));
  return p.item(lot.id, {
    region: "shorts",
    hover: {
      kind: "Muelle de salida",
      title: lot.ref === "tiktok" ? "Muelle TikTok" : "Muelle Shorts",
      summary: "Cada clip sale dos veces: una por este muelle y otra por el de al lado.",
    },
  });
}

/** Overhead conveyor from a shed across the street to its dock. */
function conveyor(from: Lot, to: Lot, P: Projection): Item {
  const x = from.rect.x + from.rect.w / 2 - 2;
  const y0 = from.rect.y + from.rect.d;
  const y1 = to.rect.y;
  const p = new Piece(P);
  for (const v of [y0 + 3, y1 - 3]) {
    p.cyl(x + 0.8, v, 0.4, 0, 9, { tone: "mid", steps: 8 });
    p.cyl(x + 3.2, v, 0.4, 0, 9, { tone: "mid", steps: 8 });
  }
  p.box3(x, y0, 9, 4, y1 - y0, 1.2, { tone: "mid", r: 0.2, className: "m-metal" });
  p.line(
    [
      [x + 2, y0, 10.25],
      [x + 2, y1, 10.25],
    ],
    "hi",
    { flow: true, className: "belt" },
  );
  p.box3(x - 0.2, y0, 10.2, 0.4, y1 - y0, 1.2, { tone: "hi", r: 0.1 });
  p.box3(x + 3.8, y0, 10.2, 0.4, y1 - y0, 1.2, { tone: "hi", r: 0.1 });
  return p.item(`cinta-${from.id}`, {
    region: "shorts",
    hover: {
      kind: "Parque logístico",
      title: "Cinta transportadora",
      summary: "Lleva los clips de la bodega al muelle.",
    },
  });
}

/** The workshop where original Shorts are made from scratch. */
function workshop(lot: Lot, P: Projection): Item {
  const { x, y, w, d } = lot.rect;
  const p = new Piece(P);
  p.box3(x, y, 0, w, d, 7, { tone: "mid", bevel: 0.4, className: "m-stone" });
  p.raw(neonRoof(P, x + 0.3, y + 0.3, w - 0.6, d - 0.6, 7.05, "rose"));
  p.prism(
    "x",
    [x - 0.6, y + d / 2, 7],
    w + 1.2,
    [
      [-d / 2 - 0.8, 0],
      [d / 2 + 0.8, 0],
      [0, 6],
    ],
    { tone: "mid" },
  );
  p.raw(panel(P, "y", y + d + 0.02, x + 4, x + 14, 0.4, 5.6, "lit-door"));
  p.raw(
    windows(P, {
      face: "y",
      at: y + d,
      from: x + 18,
      to: x + w - 2,
      z0: 1.6,
      z1: 6,
      pitch: 5,
      floor: 4.4,
      width: 3.2,
      height: 2.6,
      lit: 0.9,
      seed: 5,
    }),
  );
  p.raw(
    windows(P, {
      face: "x",
      at: x + w,
      from: y + 2,
      to: y + d - 2,
      z0: 1.6,
      z1: 6,
      pitch: 5,
      floor: 4.4,
      width: 3.2,
      height: 2.6,
      lit: 0.9,
      seed: 9,
    }),
  );
  p.cyl(x + 8, y + 6, 0.9, 7, 7, { tone: "lo", steps: 10 });
  p.raw(pool(P, x + 9, y + d + 5, 0.12, 8));
  return p.item(lot.id, {
    region: "shorts",
    hover: {
      kind: "Taller",
      title: "Shorts originales",
      summary: "Shorts hechos desde cero: un truco, un error común o un antes y después.",
    },
  });
}

/* ---------- Estudios de video ---------- */

/** A large soundstage: barrel roof, hangar door half open, office annex, plant. */
function studio(lot: Lot, P: Projection, index: number): Item {
  const { x, y, w, d } = lot.rect;
  const p = new Piece(P);
  const h = 16;
  const annex = 14;
  // Office annex along the street face.
  p.box3(x, y + d - annex, 0, 26, annex, 9, { tone: "mid", bevel: 0.4, className: "m-glass" });
  // Main hall behind it.
  p.box3(x + 26, y, 0, w - 26, d, h, { tone: "mid", bevel: 0.5, className: "m-metal" });
  p.raw(neonRoof(P, x + 26.3, y + 0.3, w - 26.6, d - 0.6, h + 0.05, "red"));
  p.box3(x, y, 0, 26, d - annex, h - 4, { tone: "mid", bevel: 0.5, className: "m-metal" });
  for (let u = x + 30; u < x + w; u += 4.5)
    p.line(
      [
        [u, y + d, 0.4],
        [u, y + d, h],
      ],
      "faint",
    );
  // Barrel roof over the hall, along y.
  const R = (w - 26) / 2;
  const arc: Array<[number, number]> = [];
  for (let s = 0; s <= 12; s++) {
    const a = Math.PI * (s / 12);
    arc.push([Math.cos(a) * R, Math.sin(a) * R * 0.32]);
  }
  p.prism("y", [x + 26 + R, y, h], d, arc, { tone: "mid", className: "m-metal" });
  // Ridge skylight, lit.
  p.raw(
    `<path class="lit-glass" d="${pathOf(
      [
        iso([x + 26 + R - 1.2, y + 2, h + R * 0.32 + 0.05], P),
        iso([x + 26 + R + 1.2, y + 2, h + R * 0.32 + 0.05], P),
        iso([x + 26 + R + 1.2, y + d - 2, h + R * 0.32 + 0.05], P),
        iso([x + 26 + R - 1.2, y + d - 2, h + R * 0.32 + 0.05], P),
      ],
      true,
    )}"/>`,
  );
  // Hangar door: a lit opening with the door slid half across.
  const doorFrom = x + 32;
  const doorTo = Math.min(x + w - 6, doorFrom + 30);
  p.raw(panel(P, "y", y + d + 0.02, doorFrom, doorTo, 0.4, 12, "lit-door"));
  p.raw(panel(P, "y", y + d + 0.06, doorFrom, (doorFrom + doorTo) / 2 + 2, 0.4, 12, "dock-shut"));
  p.raw(pool(P, (doorFrom + doorTo) / 2 + 6, y + d + 8, 0.12, 14));
  p.raw(
    windows(P, {
      face: "y",
      at: y + d,
      from: x + 1,
      to: x + 25,
      z0: 1,
      z1: 8.6,
      pitch: 3.6,
      floor: 3.8,
      width: 2.6,
      height: 2.4,
      lit: 0.75,
      seed: hashOf(lot.id),
    }),
  );
  p.raw(
    windows(P, {
      face: "x",
      at: x + w,
      from: y + 3,
      to: y + d - 3,
      z0: 6,
      z1: 14,
      pitch: 6,
      floor: 8,
      width: 3.6,
      height: 1.6,
      lit: 0.6,
      seed: hashOf(lot.id) + 3,
    }),
  );
  // A small REC lamp over the door: amber, the stage is busy.
  p.box3((doorFrom + doorTo) / 2 - 1.2, y + d, 13, 2.4, 0.8, 1.2, { tone: "hi", r: 0.2 });
  p.raw(halo(P, [(doorFrom + doorTo) / 2, y + d + 0.8, 13.6], 4, "amber", true));
  // Rooftop plant on the low wing.
  p.box3(x + 4, y + 4, h - 4, 8, 6, 3, { tone: "lo", bevel: 0.2 });
  p.cyl(x + 18, y + 8, 2, h - 4, 1.6, { tone: "lo", steps: 16 });
  return p.item(lot.id, {
    region: "videos",
    hover: {
      kind: "Estudios de video",
      title: `Nave de edición ${index + 1}`,
      summary: "Aquí cada directo se convierte en un video largo editado, con capítulos.",
    },
  });
}

/** Backlot water tower on four legs, a landmark for the studios. */
function waterTower(P: Projection, x: number, y: number): Item {
  const p = new Piece(P);
  for (const [u, v] of [
    [x - 3, y - 3],
    [x + 3, y - 3],
  ])
    p.cyl(u, v, 0.35, 0, 16, { tone: "mid", steps: 8 });
  p.cyl(x, y, 4.2, 16, 0.6, { tone: "hi", steps: 28 });
  p.cyl(x, y, 4, 16.6, 6, { tone: "mid", steps: 28, className: "m-metal" });
  p.turned(
    x,
    y,
    22.6,
    [
      [0, 4.1],
      [1.4, 2.6, 1],
      [2.2, 0.4],
    ],
    { tone: "mid" },
  );
  for (const [u, v] of [
    [x - 3, y + 3],
    [x + 3, y + 3],
  ])
    p.cyl(u, v, 0.35, 0, 16, { tone: "mid", steps: 8 });
  p.raw(halo(P, [x, y, 25], 3, "white", true));
  return p.item("torre-agua", { region: "videos" });
}

/* ---------- Malecón creativo ---------- */

/**
 * The ferris wheel. Its frame and rim are static; the cabins hang from the rim
 * and are moved by the page, so the wheel turns. The wheel stands in the
 * x-z plane, facing the sea.
 */
export const WHEEL = { cx: 178, cy: 178, hub: 30, r: 24, cabins: 12 };

function ferrisWheel(lot: Lot, P: Projection): Item {
  const { cx, cy, hub, r } = WHEEL;
  const p = new Piece(P);
  const y0 = lot.rect.y;
  // Base platform and ticket booth.
  p.box3(lot.rect.x, y0, 0, lot.rect.w, lot.rect.d, 1, {
    tone: "lo",
    bevel: 0.3,
    className: "m-stone",
  });
  p.box3(cx - 4, cy + 6, 1, 8, 4, 4, { tone: "mid", bevel: 0.3 });
  p.raw(panel(P, "y", cy + 10.02, cx - 3, cx + 3, 2, 4, "lit-door"));
  // A-frame legs behind and in front of the wheel plane.
  const legs = (y: number) => {
    p.line(
      [
        [cx - 16, y, 1],
        [cx, y, hub],
      ],
      "mid",
    );
    p.line(
      [
        [cx + 16, y, 1],
        [cx, y, hub],
      ],
      "mid",
    );
    p.line(
      [
        [cx - 10, y, 11],
        [cx + 10, y, 11],
      ],
      "lo",
    );
  };
  legs(cy - 4);
  // Rim, double, in the plane y = cy; spokes from the hub.
  p.raw(`<path class="wheel-rim" d="${sideRing([cx, cy, hub], r, "y", P, 72)}"/>`);
  p.raw(`<path class="wheel-rim inner" d="${sideRing([cx, cy, hub], r - 2, "y", P, 72)}"/>`);
  const spokes: string[] = [];
  for (let s = 0; s < 24; s++) {
    const a = (s / 24) * Math.PI * 2;
    spokes.push(
      pathOf([iso([cx, cy, hub], P), iso([cx + Math.cos(a) * r, cy, hub + Math.sin(a) * r], P)]),
    );
  }
  p.raw(`<path class="wheel-spokes" d="${spokes.join("")}"/>`);
  // Bulbs round the rim; they chase (city.css).
  const bulbs = Array.from({ length: 36 }, (_, s) => {
    const a = (s / 36) * Math.PI * 2;
    const [sx, sy] = iso([cx + Math.cos(a) * r, cy, hub + Math.sin(a) * r], P);
    return `<circle class="bulb" data-p3="${s % 3}" cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="0.7"/>`;
  }).join("");
  p.raw(`<g class="bulbs">${bulbs}</g>`);
  p.extend(cx - r - 3, cy - 5, 0, cx + r + 3, cy + 5, hub + r + 3);
  p.cyl(cx, cy - 1.4, 1.6, hub - 1.6, 3.2, { tone: "hi", steps: 16 });
  // The cabins hang in the wheel's plane, between the two pairs of legs; the
  // page fills this group and turns them.
  p.raw(`<g data-wheel=""></g>`);
  legs(cy + 4);
  p.raw(halo(P, [cx, cy, hub], 34, "amber"));
  return p.item(lot.id, {
    region: "malecon",
    hover: {
      kind: "Marketing",
      title: "La noria",
      summary: marketing.find((m) => m.id === "carruseles")?.landmark,
    },
  });
}

/** The lighthouse at the end of the jetty. The beam is drawn live by the page. */
export const LIGHTHOUSE = { x: 289, y: 243, lamp: 36 };

function lighthouse(lot: Lot, P: Projection): Item {
  const { x, y } = LIGHTHOUSE;
  const p = new Piece(P);
  // Jetty from the boardwalk out to the rock.
  p.box3(258, 238, -1.4, 22, 10, 1.6, { tone: "lo", bevel: 0.3, className: "m-stone" });
  p.cyl(x, y, 10, SEA, -SEA + 0.6, { tone: "lo", steps: 32, className: "m-stone" });
  // Tower in bands, tapering.
  const bands = 6;
  for (let b = 0; b < bands; b++) {
    const z0 = 0.6 + b * 4.6;
    const r0 = 5 - b * 0.38;
    p.turned(
      x,
      y,
      z0,
      [
        [0, r0],
        [4.6, r0 - 0.38],
      ],
      { tone: b % 2 ? "hi" : "mid", className: b % 2 ? "m-band" : "m-stone" },
    );
  }
  const top = 0.6 + bands * 4.6;
  p.cyl(x, y, 3.8, top, 0.8, { tone: "hi", steps: 28 });
  p.cyl(x, y, 2.4, top + 0.8, 4.2, { tone: "hi", steps: 24, className: "m-lantern" });
  p.turned(
    x,
    y,
    top + 5,
    [
      [0, 3],
      [1.6, 1.6, 1],
      [2.6, 0.3],
    ],
    { tone: "mid" },
  );
  p.raw(halo(P, [x, y, top + 2.9], 18, "amber", false).replace("glow-halo", "glow-halo lamp-aura"));
  p.raw(pool(P, x, y, SEA + 0.1, 30));
  return p.item(lot.id, {
    region: "malecon",
    hover: { kind: "Marketing", title: "El faro", summary: "Anuncia el próximo directo." },
  });
}

/** Octagonal kiosk with a lit counter, a cone roof and strings of bulbs. */
function kiosk(lot: Lot, P: Projection): Item {
  const { x, y, w } = lot.rect;
  const c = x + w / 2;
  const cy = y + w / 2;
  const p = new Piece(P);
  for (const [u, v] of [
    [x - 6, y - 6],
    [x + w + 6, y - 6],
  ])
    p.cyl(u, v, 0.3, 0, 7, { tone: "mid", steps: 8 });
  p.cyl(c, cy, 6, 0, 0.6, { tone: "lo", steps: 8, className: "m-stone" });
  p.cyl(c, cy, 5, 0.6, 4.6, { tone: "mid", steps: 8 });
  p.raw(panel(P, "y", cy + 4.1, c - 2.5, c + 2.5, 1.8, 4.2, "lit-door"));
  p.raw(panel(P, "x", c + 4.1, cy - 2.5, cy + 2.5, 1.8, 4.2, "lit-door"));
  p.turned(
    c,
    cy,
    5.2,
    [
      [0, 7],
      [0.4, 7],
      [3.6, 0.6],
    ],
    { tone: "mid" },
  );
  // Strings of bulbs from the roof to the two front poles.
  const strings = (
    [
      [x + w + 6, y + w + 6],
      [x - 6, y + w + 6],
    ] as Array<[number, number]>
  ).map(([u, v]) => {
    const pts: Point3[] = [];
    for (let s = 0; s <= 10; s++) {
      const t = s / 10;
      pts.push([
        c + (u - c) * t,
        cy + (v - cy) * t,
        6.6 + (7 - 6.6) * t - Math.sin(Math.PI * t) * 1.4,
      ]);
    }
    return pts;
  });
  for (const [u, v] of [
    [x + w + 6, y + w + 6],
    [x - 6, y + w + 6],
  ])
    p.cyl(u, v, 0.3, 0, 7, { tone: "mid", steps: 8 });
  for (const pts of strings) {
    p.line(pts, "lo");
    p.raw(
      `<g class="bulbs">${pts
        .slice(1, -1)
        .map((pt, i) => {
          const [sx, sy] = iso(pt, P);
          return `<circle class="bulb" data-p2="${i % 2}" cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="0.5"/>`;
        })
        .join("")}</g>`,
    );
  }
  p.extend(x - 7, y - 7, 0, x + w + 7, y + w + 7, 9);
  p.raw(pool(P, c, cy + 8, 0.12, 12));
  return p.item(lot.id, {
    region: "malecon",
    hover: {
      kind: "Marketing",
      title: "El kiosco",
      summary: marketing.find((m) => m.id === "stories")?.landmark,
    },
  });
}

/** Billboard on two posts; the screen cycles through posts (city.css). */
function billboard(lot: Lot, P: Projection, index: number): Item {
  const { x, y, w } = lot.rect;
  const p = new Piece(P);
  for (const u of [x + 5, x + w - 5]) p.cyl(u, y + 3, 0.6, 0, 8, { tone: "mid", steps: 10 });
  p.box3(x, y + 1.6, 8, w, 1.4, 14, { tone: "mid", bevel: 0.3, className: "m-metal" });
  const face = y + 3;
  for (let slide = 0; slide < 3; slide++) {
    p.raw(
      panel(P, "y", face + 0.02, x + 1, x + w - 1, 9, 21, `screen screen-${slide}`).replace(
        "<path",
        `<path data-s="${(index * 2 + slide) % 3}"`,
      ),
    );
  }
  // Each slide is a layout of blocks, like a real post: image, title, caption lines.
  p.raw(panel(P, "y", face + 0.04, x + 3, x + w / 2, 11, 19, "screen-ink"));
  p.raw(panel(P, "y", face + 0.04, x + w / 2 + 2, x + w - 3, 16.5, 18.5, "screen-ink"));
  p.raw(panel(P, "y", face + 0.04, x + w / 2 + 2, x + w - 6, 13.5, 14.6, "screen-ink"));
  p.raw(panel(P, "y", face + 0.04, x + w / 2 + 2, x + w - 8, 11.5, 12.4, "screen-ink"));
  p.box3(x - 0.4, y + 1.2, 22, w + 0.8, 2.2, 0.6, { tone: "hi", r: 0.2 });
  p.raw(halo(P, [x + w / 2, face + 2, 15], 18, "white"));
  p.raw(pool(P, x + w / 2, y + 12, 0.12, 14));
  return p.item(lot.id, {
    region: "malecon",
    hover: {
      kind: "Marketing",
      title: "Pantalla del paseo",
      summary: marketing.find((m) => m.id === "publicaciones")?.landmark,
    },
  });
}

/** A seafront café with a striped awning, terrace umbrellas and string lights. */
function cafe(lot: Lot, P: Projection): Item {
  const { x, y, w, d } = lot.rect;
  const p = new Piece(P);
  p.box3(x + 8, y, 0, w - 8, d, 8, { tone: "mid", bevel: 0.4, className: "m-stone" });
  p.raw(panel(P, "x", x + w + 0.02, y + 3, y + d - 3, 0.8, 5.6, "lit-store"));
  p.raw(panel(P, "y", y + d + 0.02, x + 10, x + w - 2, 0.8, 5.6, "lit-store"));
  p.box3(x + 7, y - 0.4, 8, w - 6.6, d + 0.8, 0.8, { tone: "hi", r: 0.2 });
  p.raw(neonRoof(P, x + 7, y - 0.4, w - 6.6, d + 0.8, 8.85, "red"));
  // Terrace on the open side, with umbrellas.
  for (const [u, v] of [
    [x + 3, y + 6],
    [x + 3, y + d - 6],
  ]) {
    p.cyl(u, v, 1.6, 0, 1.4, { tone: "lo", steps: 12 });
    p.cyl(u, v, 0.15, 1.4, 3.6, { tone: "mid", steps: 6, crease: "none" });
    p.turned(
      u,
      v,
      5,
      [
        [0, 3.4],
        [1.6, 0.3],
      ],
      { tone: "hi", className: "m-canvas" },
    );
  }
  p.raw(pool(P, x + 4, y + d / 2, 0.12, 12));
  return p.item(lot.id, {
    region: "malecon",
    hover: { kind: "Marketing", title: "Café del paseo" },
  });
}

/** The pier: deck on piles, bollards, mooring lights. */
function pier(lot: Lot, P: Projection): Item {
  const { x, y, w, d } = lot.rect;
  const p = new Piece(P);
  for (let v = y + 4; v < y + d; v += 8) {
    for (const u of [x + 1.5, x + w - 1.5])
      p.cyl(u, v, 0.8, SEA, -SEA - 0.4, { tone: "lo", steps: 10 });
  }
  p.box3(x, y, -0.6, w, d, 0.8, { tone: "mid", bevel: 0.2, className: "m-wood" });
  for (let v = y + 1.2; v < y + d; v += 1.6)
    p.line(
      [
        [x, v, 0.21],
        [x + w, v, 0.21],
      ],
      "faint",
    );
  for (let v = y + 6; v < y + d; v += 12) {
    p.cyl(x + w - 1, v, 0.5, 0.2, 1, { tone: "hi", steps: 10 });
    p.raw(halo(P, [x + 0.6, v, 2.4], 3, "amber"));
    p.cyl(x + 0.6, v, 0.18, 0.2, 2.2, { tone: "mid", steps: 6 });
  }
  return p.item(lot.id, {
    region: "malecon",
    hover: {
      kind: "Marketing",
      title: "El muelle",
      summary: marketing.find((m) => m.id === "otras-redes")?.landmark,
    },
  });
}

/* ---------- Población JP-Stack ---------- */

const projectHover = (id: string) => {
  const project = projects.find((p) => p.id === id);
  return {
    kind: `JP-Stack · ${project?.building ?? ""}`,
    title: project?.name ?? id,
    summary: project?.summary,
  };
};

/** JP-Wallet: a bank vault behind a portico, with the round vault door on its side. */
function vault(lot: Lot, P: Projection): Item {
  const { x, y, w, d } = lot.rect;
  const p = new Piece(P);
  p.box3(x, y, 0, w, d, 1.4, { tone: "lo", bevel: 0.3, className: "m-stone" });
  p.box3(x + 3, y + 3, 1.4, w - 6, d - 10, 14, { tone: "mid", bevel: 0.5, className: "m-stone" });
  p.raw(neonRoof(P, x + 3.3, y + 3.3, w - 6.6, d - 10.6, 15.45, "red"));
  const face = y + d - 7;
  for (let u = x + 6; u <= x + w - 6; u += (w - 12) / 4) {
    p.cyl(u, face + 3, 0.8, 1.4, 11, { tone: "hi", steps: 12, className: "m-stone" });
  }
  p.box3(x + 3, face + 1, 12.4, w - 6, 4, 1.6, { tone: "mid", bevel: 0.3, className: "m-stone" });
  p.prism(
    "x",
    [x + 3, face + 3, 14],
    w - 6,
    [
      [-2, 0],
      [2, 0],
      [0, 3.4],
    ],
    { tone: "mid", className: "m-stone" },
  );
  p.raw(panel(P, "y", face + 0.02, x + w / 2 - 3, x + w / 2 + 3, 1.4, 8, "lit-door"));
  // Vault door on the x face: rings and bolts, faintly lit.
  const door: Point3 = [x + w - 3 + 0.02, y + 3 + (d - 10) / 2, 8];
  p.raw(`<path class="vault-door" d="${sideRing(door, 4.6, "x", P, 40)}"/>`);
  p.raw(`<path class="vault-ring" d="${sideRing(door, 3.4, "x", P, 40)}"/>`);
  p.raw(`<path class="vault-ring" d="${sideRing(door, 1.1, "x", P, 20)}"/>`);
  p.dots(
    Array.from({ length: 10 }, (_, i) => {
      const a = (i / 10) * Math.PI * 2;
      return [door[0], door[1] + Math.cos(a) * 4, door[2] + Math.sin(a) * 4] as Point3;
    }),
    0.35,
    "hi",
  );
  p.raw(wash(P, "y", face, x + 3, x + w - 3, 1.4, 10));
  return p.item(lot.id, { region: "stack", hover: projectHover(lot.ref ?? lot.id) });
}

/** JP-Venta: a covered market with a glazed gable, striped awnings and stalls. */
function market(lot: Lot, P: Projection): Item {
  const { x, y, w, d } = lot.rect;
  const p = new Piece(P);
  p.box3(x, y, 0, w, d - 8, 9, { tone: "mid", bevel: 0.4, className: "m-stone" });
  p.raw(neonRoof(P, x + 0.3, y + 0.3, w - 0.6, d - 8.6, 9.05, "rose"));
  p.prism(
    "x",
    [x - 0.6, y + (d - 8) / 2, 9],
    w + 1.2,
    [
      [-(d - 8) / 2 - 0.6, 0],
      [(d - 8) / 2 + 0.6, 0],
      [0, 9],
    ],
    { tone: "mid", className: "m-glass" },
  );
  p.raw(panel(P, "x", x + w + 0.62, y + 3, y + d - 11, 9.6, 13, "lit-glass"));
  // Awnings along the street face, alternating tone.
  for (let u = x + 1; u + 6 <= x + w - 1; u += 6.5) {
    p.raw(panel(P, "y", y + d - 8 + 0.02, u + 0.4, u + 5.6, 0.6, 5.6, "lit-store"));
    p.prism(
      "x",
      [u, y + d - 8, 6.4],
      6,
      [
        [0, 0],
        [3.6, -1.6],
        [3.6, -1.2],
        [0, 0.4],
      ],
      { tone: (u / 6.5) % 2 > 1 ? "hi" : "mid", className: "m-canvas" },
    );
  }
  // Stalls in front.
  for (let u = x + 4; u < x + w - 6; u += 13) {
    p.box3(u, y + d - 4, 0, 6, 3, 2.2, { tone: "lo", r: 0.2 });
    p.cyl(u + 3, y + d - 2.5, 0.12, 2.2, 2.4, { tone: "mid", steps: 6 });
    p.turned(
      u + 3,
      y + d - 2.5,
      4.6,
      [
        [0, 3],
        [1.2, 0.3],
      ],
      { tone: "hi", className: "m-canvas" },
    );
    p.raw(halo(P, [u + 3, y + d - 2.5, 4], 4, "amber"));
  }
  return p.item(lot.id, { region: "stack", hover: projectHover(lot.ref ?? lot.id) });
}

/** JP-Portafolio: a glass gallery on a plinth, lit pictures on its inner wall. */
function gallery(lot: Lot, P: Projection): Item {
  const { x, y, w, d } = lot.rect;
  const p = new Piece(P);
  p.box3(x, y, 0, w, d, 1.2, { tone: "lo", bevel: 0.3, className: "m-stone" });
  p.box3(x + 4, y + 4, 1.2, w - 8, d - 8, 12, { tone: "mid", bevel: 0.3, className: "m-glass" });
  // Pictures on the walls, each a lit frame.
  for (let u = x + 7; u + 6 < x + w - 4; u += 9)
    p.raw(panel(P, "y", y + d - 4 + 0.03, u, u + 6, 4, 9, "picture"));
  for (let v = y + 7; v + 6 < y + d - 4; v += 9)
    p.raw(panel(P, "x", x + w - 4 + 0.03, v, v + 6, 4, 9, "picture"));
  // Mullions, full height of the glass.
  for (let u = x + 4 + 4.5; u < x + w - 4; u += 4.5)
    p.line(
      [
        [u, y + d - 4, 1.2],
        [u, y + d - 4, 13.2],
      ],
      "lo",
    );
  for (let v = y + 4 + 4.5; v < y + d - 4; v += 4.5)
    p.line(
      [
        [x + w - 4, v, 1.2],
        [x + w - 4, v, 13.2],
      ],
      "lo",
    );
  p.box3(x + 1, y + 1, 13.2, w - 2, d - 2, 1.2, { tone: "hi", bevel: 0.3 });
  p.raw(neonRoof(P, x + 1, y + 1, w - 2, d - 2, 14.45, "red"));
  // A sculpture in front: a ball on a plinth.
  p.box3(x + w - 10, y + d - 3.4, 1.2, 4, 3, 3, { tone: "mid", r: 0.2 });
  p.ball([x + w - 8, y + d - 1.9, 6.2], 1.9, { tone: "hi", lit: true });
  p.raw(halo(P, [x + w / 2, y + d - 4, 7], 22, "amber"));
  return p.item(lot.id, { region: "stack", hover: projectHover(lot.ref ?? lot.id) });
}

/** JP-Apartment: a residential block with balconies on every floor. */
function residential(lot: Lot, P: Projection): Item {
  const { x, y, w, d } = lot.rect;
  const p = new Piece(P);
  const h = 44;
  p.box3(x, y, 0, w, d - 3, h, { tone: "mid", bevel: 0.5, className: "m-stone" });
  p.raw(
    windows(P, {
      face: "y",
      at: y + d - 3,
      from: x + 1,
      to: x + w - 1,
      z0: 1,
      z1: h - 2,
      pitch: 5.2,
      floor: 4,
      width: 2.8,
      height: 2.6,
      lit: 0.62,
      seed: hashOf(lot.id),
    }),
  );
  p.raw(
    windows(P, {
      face: "x",
      at: x + w,
      from: y + 1,
      to: y + d - 4,
      z0: 1,
      z1: h - 2,
      pitch: 5.2,
      floor: 4,
      width: 2.8,
      height: 2.6,
      lit: 0.55,
      seed: hashOf(lot.id) + 7,
    }),
  );
  for (let z = 4; z < h - 2; z += 4) {
    p.box3(x + 2, y + d - 3, z, w - 4, 2.6, 0.4, { tone: "hi", r: 0.1 });
    p.line(
      [
        [x + 2, y + d - 0.5, z + 1.6],
        [x + w - 2, y + d - 0.5, z + 1.6],
      ],
      "mid",
    );
  }
  p.box3(x - 0.4, y - 0.4, h, w + 0.8, d - 2.2, 1, { tone: "hi", r: 0.2 });
  p.raw(neonRoof(P, x - 0.4, y - 0.4, w + 0.8, d - 2.2, h + 1.05, "rose"));
  // Roof garden.
  for (const [u, v] of [
    [x + 8, y + 8],
    [x + w - 10, y + 12],
  ]) {
    p.cyl(u, v, 2.4, h + 1, 1.2, { tone: "lo", steps: 14 });
    p.ball([u, v, h + 4.4], 2.6, { tone: "mid", className: "m-leaf" });
  }
  return p.item(lot.id, { region: "stack", hover: projectHover(lot.ref ?? lot.id) });
}

/** JP-Metodología: an academy with a library wing and an observatory dome. */
function academy(lot: Lot, P: Projection): Item {
  const { x, y, w, d } = lot.rect;
  const p = new Piece(P);
  p.box3(x, y, 0, w, d, 1.2, { tone: "lo", bevel: 0.3, className: "m-stone" });
  p.box3(x + 2, y + 2, 1.2, w - 4, d - 4, 13, { tone: "mid", bevel: 0.4, className: "m-stone" });
  p.raw(
    windows(P, {
      face: "y",
      at: y + d - 2,
      from: x + 3,
      to: x + w - 3,
      z0: 2.6,
      z1: 13.4,
      pitch: 4.4,
      floor: 5.4,
      width: 2,
      height: 4.2,
      lit: 0.85,
      seed: hashOf(lot.id),
    }),
  );
  p.raw(
    windows(P, {
      face: "x",
      at: x + w - 2,
      from: y + 3,
      to: y + d - 3,
      z0: 2.6,
      z1: 13.4,
      pitch: 4.4,
      floor: 5.4,
      width: 2,
      height: 4.2,
      lit: 0.8,
      seed: hashOf(lot.id) + 2,
    }),
  );
  p.seam(x + 2, y + 2, w - 4, d - 4, 7.6, "lo");
  p.box3(x + 1.4, y + 1.4, 14.2, w - 2.8, d - 2.8, 1, { tone: "hi", r: 0.2 });
  p.raw(neonRoof(P, x + 1.4, y + 1.4, w - 2.8, d - 2.8, 15.25, "red"));
  // Observatory on the roof: drum, dome and its open slit.
  const cx = x + w * 0.35;
  const cy = y + d * 0.4;
  p.cyl(cx, cy, 8, 15.2, 4, { tone: "mid", steps: 40, className: "m-stone" });
  p.turned(
    cx,
    cy,
    19.2,
    [
      [0, 8],
      [2.6, 7.2, 1],
      [5.2, 4.8, 1],
      [7, 1.6],
    ],
    { tone: "mid", className: "m-dome" },
  );
  p.line(
    [
      [cx + 1.6, cy + 6.6, 20],
      [cx + 1, cy + 3.2, 25.6],
    ],
    "hi",
  );
  p.raw(halo(P, [cx, cy, 24], 10, "amber"));
  p.raw(panel(P, "y", y + d - 2 + 0.02, x + w / 2 - 3, x + w / 2 + 3, 1.2, 6.4, "lit-door"));
  return p.item(lot.id, { region: "stack", hover: projectHover(lot.ref ?? lot.id) });
}

/** A personal project: a gabled house with a chimney and lit rooms. */
function house(lot: Lot, P: Projection, index: number): Item {
  const { x, y, w, d } = lot.rect;
  const p = new Piece(P);
  const rand = seeded(hashOf(lot.id));
  const h = 6 + Math.round(rand() * 3);
  // Garden fence: four sides, so no line ends in the open.
  p.box3(x + 3, y + 3, 0, w - 6, d - 8, h, { tone: "mid", bevel: 0.3, className: "m-stone" });
  const along = index % 2 ? "x" : "y";
  if (along === "x") {
    p.prism(
      "x",
      [x + 2.4, y + 3 + (d - 8) / 2, h],
      w - 4.8,
      [
        [-(d - 8) / 2 - 0.8, 0],
        [(d - 8) / 2 + 0.8, 0],
        [0, 5],
      ],
      { tone: "mid" },
    );
  } else {
    p.prism(
      "y",
      [x + w / 2, y + 2.4, h],
      d - 6.8,
      [
        [-(w - 6) / 2 - 0.8, 0],
        [(w - 6) / 2 + 0.8, 0],
        [0, 5],
      ],
      { tone: "mid" },
    );
  }
  p.box3(x + 5, y + 5, h + 1, 1.6, 1.6, 5, { tone: "lo", r: 0.1 });
  p.raw(
    windows(P, {
      face: "y",
      at: y + d - 5,
      from: x + 4,
      to: x + w - 4,
      z0: 1,
      z1: h - 0.6,
      pitch: 4.6,
      floor: 3.6,
      width: 2.4,
      height: 2,
      lit: 0.7,
      seed: hashOf(lot.id),
    }),
  );
  p.raw(
    windows(P, {
      face: "x",
      at: x + w - 3,
      from: y + 4,
      to: y + d - 6,
      z0: 1,
      z1: h - 0.6,
      pitch: 4.6,
      floor: 3.6,
      width: 2.4,
      height: 2,
      lit: 0.6,
      seed: hashOf(lot.id) + 1,
    }),
  );
  p.raw(pool(P, x + w / 2, y + d - 2, 0.12, 5));
  return p.item(lot.id, {
    region: "stack",
    hover: {
      kind: "JP-Stack · Casa",
      title: "Proyecto personal",
      summary: "Uno de los proyectos personales que conviven en el pueblo.",
    },
  });
}

/* ---------- Distrito Directos: dispatch ---------- */

function dispatch(lot: Lot, P: Projection): Item {
  const { x, y, w, d } = lot.rect;
  const p = new Piece(P);
  p.box3(x, y, 0, w, d, 8, { tone: "mid", bevel: 0.4, className: "m-metal" });
  p.raw(neonRoof(P, x + 0.3, y + 0.3, w - 0.6, d - 0.6, 8.05, "rose"));
  for (let v = y + 3; v + 5 < y + d - 1; v += 7) {
    p.raw(panel(P, "x", x + w + 0.02, v, v + 5, 0.6, 5, "lit-door"));
    p.raw(pool(P, x + w + 4, v + 2.5, 0.12, 5));
  }
  p.raw(panel(P, "y", y + d + 0.02, x + 3, x + w - 3, 5.6, 7.4, "sign-band"));
  return p.item(lot.id, {
    region: "directos",
    hover: {
      kind: "Distrito Directos",
      title: "Centro de despacho",
      summary: "De aquí salen las furgonetas hacia las bodegas de Shorts.",
    },
  });
}

export function buildRegions(P: Projection): Item[] {
  const items: Item[] = [];
  const byId = (id: string) => LOTS.find((lot) => lot.id === id) as Lot;
  let studioIndex = 0;
  let houseIndex = 0;
  let screenIndex = 0;
  for (const lot of LOTS) {
    switch (lot.kind) {
      case "bodega":
        items.push(warehouse(lot, P));
        break;
      case "muelle-carga":
        items.push(dock(lot, P));
        break;
      case "taller":
        items.push(workshop(lot, P));
        break;
      case "nave":
        items.push(studio(lot, P, studioIndex++));
        break;
      case "noria":
        items.push(ferrisWheel(lot, P));
        break;
      case "faro":
        items.push(lighthouse(lot, P));
        break;
      case "kiosco":
        items.push(kiosk(lot, P));
        break;
      case "pantalla":
        items.push(billboard(lot, P, screenIndex++));
        break;
      case "cafe":
        items.push(cafe(lot, P));
        break;
      case "muelle":
        items.push(pier(lot, P));
        break;
      case "boveda":
        items.push(vault(lot, P));
        break;
      case "mercado":
        items.push(market(lot, P));
        break;
      case "galeria":
        items.push(gallery(lot, P));
        break;
      case "residencial":
        items.push(residential(lot, P));
        break;
      case "academia":
        items.push(academy(lot, P));
        break;
      case "casa":
        items.push(house(lot, P, houseIndex++));
        break;
      case "despacho":
        items.push(dispatch(lot, P));
        break;
      default:
        break;
    }
  }
  items.push(conveyor(byId("bodega-norte-1"), byId("muelle-shorts"), P));
  items.push(conveyor(byId("bodega-norte-2"), byId("muelle-tiktok"), P));
  items.push(waterTower(P, -110, 200));
  return items;
}
