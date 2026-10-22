import { channel } from "../../data";
import type { Projection } from "../kit/iso-kit.ts";
import type { Box3 } from "../order";
import {
  faceLabel,
  halo,
  hashOf,
  type Item,
  type NeonColor,
  neon,
  neonRoof,
  Piece,
  panel,
  seeded,
  wash,
  windows,
} from "../parts";
import { type Lot, SIGNAL_TOWER } from "../plan";

const FLOOR = 3.6;
const PODIUM = 9;

/** The shaft's setbacks as [inset, share of height]. Narrow lots get fewer. */
function tiersOf(w: number, d: number) {
  return (
    [
      [3, 0.62],
      [5.5, 0.86],
      [8, 1],
    ] as Array<[number, number]>
  ).filter(([inset]) => w - inset * 2 > 8 && d - inset * 2 > 8);
}

/** The top tier's footprint and the height of its roof. */
export function crownOf(lot: Lot) {
  const { x, y, w, d } = lot.rect;
  const tiers = tiersOf(w, d);
  const [inset] = tiers[tiers.length - 1] ?? [3];
  return {
    x: x + inset,
    y: y + inset,
    w: w - inset * 2,
    d: d - inset * 2,
    roof: (lot.height ?? 80) + 0.8 * tiers.length,
  };
}

/**
 * The shaft's first tier, up to the terrace edge on top of it: the face and
 * ledge a web can stick to.
 */
export function ledgeOf(lot: Lot): Box3 {
  const { x, y, w, d } = lot.rect;
  const tiers = tiersOf(w, d);
  const H = lot.height ?? 80;
  const [inset, share] = tiers[0] ?? [3, 1];
  const top = tiers.length > 1 ? Math.round(PODIUM + (H - PODIUM) * share) : H;
  return { x0: x + inset, y0: y + inset, z0: 0, x1: x + w - inset, y1: y + d - inset, z1: top };
}

/** Where the searchlight of the JP signal stands on its tower's roof. */
export function searchlightOf(lot: Lot): [number, number, number] {
  const c = crownOf(lot);
  return [c.x + c.w * 0.72, c.y + c.d * 0.74, c.roof];
}

/**
 * A stream tower: podium with lit shopfronts, a shaft in up to three
 * setbacks with lit offices, corner fins, floor seams, and a crown of plant,
 * tank and mast. Towers that stand for a stream carry the red EN VIVO sign
 * and a dish; the rest are the district's fabric.
 */
export function tower(lot: Lot, P: Projection): Item {
  const { x, y, w, d } = lot.rect;
  const H = lot.height ?? 80;
  const seed = hashOf(lot.id);
  const rand = seeded(seed);
  const onAir = lot.kind === "torre-directo";
  const p = new Piece(P);

  // Podium.
  const podium = PODIUM;
  p.box3(x + 0.5, y + 0.5, 0, w - 1, d - 1, podium, {
    tone: "lo",
    bevel: 0.5,
    className: "m-stone",
  });
  p.raw(panel(P, "y", y + d - 0.5, x + 3, x + w - 3, 0.9, 4.4, "lit-store"));
  p.raw(panel(P, "x", x + w - 0.5, y + 3, y + d - 3, 0.9, 4.4, "lit-store"));
  for (let u = x + 3 + 4; u < x + w - 3; u += 4) {
    p.line(
      [
        [u, y + d - 0.5, 0.9],
        [u, y + d - 0.5, 4.4],
      ],
      "lo",
    );
  }
  p.seam(x + 0.5, y + 0.5, w - 1, d - 1, 5.4);
  // Neon underline above the shopfronts, on both street faces.
  const shopNeon: NeonColor = onAir || rand() < 0.6 ? "red" : "rose";
  p.raw(
    neon(
      P,
      [
        [x + 3, y + d - 0.45, 5],
        [x + w - 0.45, y + d - 0.45, 5],
        [x + w - 0.45, y + 3, 5],
      ],
      shopNeon,
    ),
  );
  // Entrance canopy on the street side.
  p.box3(x + w / 2 - 5, y + d - 0.5, 4.6, 10, 2.2, 0.6, { tone: "mid", r: 0.2 });

  // Shaft in setbacks.
  const tiers = tiersOf(w, d);
  let base = podium;
  let firstTop = H;
  tiers.forEach(([inset, share], index) => {
    const top = index === tiers.length - 1 ? H : Math.round(podium + (H - podium) * share);
    const tx = x + inset;
    const ty = y + inset;
    const tw = w - inset * 2;
    const td = d - inset * 2;
    const h = top - base;
    if (index === 0) firstTop = top;
    p.box3(tx, ty, base, tw, td, h, { tone: "mid", bevel: 0.6, className: "m-glass" });
    p.raw(
      windows(P, {
        face: "y",
        at: ty + td,
        from: tx + 1.2,
        to: tx + tw - 1.2,
        z0: base + 1,
        z1: top - 1.5,
        pitch: 3.4,
        floor: FLOOR,
        width: 2.2,
        height: 2.3,
        lit: 0.42 + rand() * 0.3,
        seed: seed + index * 17,
      }),
    );
    p.raw(
      windows(P, {
        face: "x",
        at: tx + tw,
        from: ty + 1.2,
        to: ty + td - 1.2,
        z0: base + 1,
        z1: top - 1.5,
        pitch: 3.4,
        floor: FLOOR,
        width: 2.2,
        height: 2.3,
        lit: 0.36 + rand() * 0.3,
        seed: seed + index * 31,
      }),
    );
    // Every fifth floor carries a plant band that wraps the visible corners.
    for (let z = base + FLOOR * 5; z < top - 2; z += FLOOR * 5) p.seam(tx, ty, tw, td, z, "lo");
    // Corner fin on the near edge, full height of the tier.
    p.box3(tx + tw - 0.3, ty + td - 0.3, base, 0.9, 0.9, h + 0.6, { tone: "hi", r: 0.15 });
    // Setback terrace edge.
    p.box3(tx - 0.2, ty - 0.2, top, tw + 0.4, td + 0.4, 0.8, { tone: "hi", r: 0.3 });
    base = top + 0.8;
  });

  // Light washing up the street face from the podium roof.
  const [inset0] = tiers[0] ?? [3];
  p.raw(wash(P, "y", y + d - inset0, x + inset0, x + w - inset0, podium, Math.min(26, H * 0.3)));

  // Crown.
  const [insetTop] = tiers[tiers.length - 1] ?? [3];
  const cx = x + insetTop;
  const cy = y + insetTop;
  const cw = w - insetTop * 2;
  const cd = d - insetTop * 2;
  const roof = base;
  // Neon round the roof edge: every on-air tower in red, the rest mostly red.
  const roofTone = rand();
  if (onAir || roofTone < 0.75) {
    const color: NeonColor = onAir || roofTone < 0.5 ? "red" : "rose";
    p.raw(neonRoof(P, cx + 0.3, cy + 0.3, cw - 0.6, cd - 0.6, roof - 0.15, color));
  }
  p.box3(cx + 2, cy + 2, roof, cw * 0.45, cd * 0.4, 4.2, { tone: "lo", bevel: 0.3 });
  p.cyl(cx + cw * 0.72, cy + cd * 0.3, 2.2, roof, 5.6, { tone: "mid", steps: 16 });
  p.cyl(cx + cw * 0.72, cy + cd * 0.3, 2.4, roof + 5.6, 0.6, { tone: "hi", steps: 16 });
  const mastX = cx + cw * 0.3;
  const mastY = cy + cd * 0.7;
  const mast = 10 + rand() * 8;
  p.cyl(mastX, mastY, 0.9, roof, 2, { tone: "lo", steps: 10 });
  p.cyl(mastX, mastY, 0.32, roof + 2, mast, { tone: "mid", steps: 8, crease: "none" });

  if (onAir) {
    const stream = channel.streams.find((s) => s.id === lot.ref);
    // The red sign sits on the street face just under the first setback.
    const signTop = Math.min(H - 6, podium + (H - podium) * 0.62 - 3);
    const ty = y + inset0 + (d - inset0 * 2);
    const from = x + inset0 + 2;
    const to = x + w - inset0 - 2;
    p.raw(panel(P, "y", ty + 0.05, from, to, signTop - 4.6, signTop, "onair-panel"));
    p.raw(faceLabel(P, "y", ty + 0.1, from + 1.6, signTop - 1.2, "EN VIVO", 3.2, "onair-text"));
    p.raw(halo(P, [(from + to) / 2, ty + 1, signTop - 2.3], 9, "red", true));
    // A red tube up the near corner fin of the first tier, ending at its terrace.
    const fx = x + inset0 + (w - inset0 * 2) + 0.2;
    const fy = y + inset0 + (d - inset0 * 2) + 0.2;
    p.raw(
      neon(
        P,
        [
          [fx, fy, podium + 0.5],
          [fx, fy, firstTop - 0.5],
        ],
        "red",
      ),
    );
    // Dish on the roof, aimed up and back.
    p.cyl(cx + cw * 0.72, cy + cd * 0.75, 0.5, roof, 3, { tone: "mid", steps: 8 });
    p.turned(
      cx + cw * 0.72,
      cy + cd * 0.75,
      roof + 3,
      [
        [0, 0.6],
        [0.8, 2.4, 1],
        [1.4, 3.4, 1],
      ],
      { tone: "hi" },
    );
    p.raw(halo(P, [mastX, mastY, roof + 2 + mast], 3.4, "red", true));
    p.dots([[mastX, mastY, roof + 2 + mast]], 0.7, "hi");
    return p.item(lot.id, {
      region: "directos",
      hover: {
        kind: "Stream · torre al aire",
        title: stream?.title ?? lot.id,
        summary: stream?.summary,
      },
    });
  }

  p.raw(halo(P, [mastX, mastY, roof + 2 + mast], 2.4, "white", true));
  p.dots([[mastX, mastY, roof + 2 + mast]], 0.55, "hi");
  if (lot.id === SIGNAL_TOWER) {
    // The searchlight of the JP signal: a turntable, a yoke and a drum aimed
    // at the sky. Its beam and the logo are drawn live over the city.
    const [lx, ly] = searchlightOf(lot);
    p.cyl(lx, ly, 3, roof, 0.8, { tone: "lo", steps: 20 });
    p.cyl(lx, ly, 2.4, roof + 0.8, 0.5, { tone: "mid", steps: 20 });
    p.box3(lx - 2.4, ly - 0.5, roof + 1.3, 0.7, 1, 3.2, { tone: "mid", r: 0.2 });
    p.box3(lx + 1.7, ly - 0.5, roof + 1.3, 0.7, 1, 3.2, { tone: "mid", r: 0.2 });
    p.turned(
      lx,
      ly,
      roof + 1.6,
      [
        [0, 1.2],
        [1.2, 1.6, 1],
        [3.4, 1.7, 1],
        [3.8, 1.9],
      ],
      { tone: "hi" },
    );
    p.dots([[lx, ly, roof + 5.4]], 1.3, "hi");
  }
  return p.item(lot.id, {
    region: "directos",
    hover: {
      kind: "Distrito Directos",
      title: "Torre del distrito",
      summary: "Espacio para los próximos directos.",
    },
  });
}
