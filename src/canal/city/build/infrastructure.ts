import {
  iso,
  lineSvg,
  type Point3,
  type Projection,
  pathOf,
  slabOf,
  solidSvg,
} from "../kit/iso-kit.ts";
import { halo, type Item, Piece, panel, pool, seeded, streetlamp, tree } from "../parts";
import {
  GROUND,
  ISLAND_DEPTH,
  ISLANDS,
  LOTS,
  type Lot,
  MAIN_ISLAND,
  MONORAIL,
  overlaps,
  RAIL,
  REGION_RECTS,
  type Rect,
  ROADS,
  SEA,
  SEA_RECT,
  STACK_ISLAND,
} from "../plan";

const flat = (P: Projection, rect: Rect, z: number, className: string) => {
  const { x, y, w, d } = rect;
  const corners: Point3[] = [
    [x, y, z],
    [x + w, y, z],
    [x + w, y + d, z],
    [x, y + d, z],
  ];
  return `<path class="${className}" d="${pathOf(
    corners.map((point) => iso(point, P)),
    true,
  )}"/>`;
};

const line = (P: Projection, points: Point3[], tone: "hi" | "mid" | "lo" | "faint", extra = "") =>
  lineSvg(pathOf(points.map((point) => iso(point, P))), { tone, className: extra || undefined });

/** Everything that lies flat: sea, island tops, pavings, roads, rails, pools of light. */
export function ground(P: Projection, lampPools: string[]): string {
  const out: string[] = [];
  out.push(flat(P, SEA_RECT, SEA, "sea"));
  // Swell lines run the full width of the sea, so none of them ends in the
  // open. Uneven spacing and two strengths keep them from reading as a grid.
  const swell = seeded(23);
  for (let y = SEA_RECT.y + 10; y < SEA_RECT.y + SEA_RECT.d; y += 12 + swell() * 22) {
    out.push(
      line(
        P,
        [
          [SEA_RECT.x, y, SEA],
          [SEA_RECT.x + SEA_RECT.w, y, SEA],
        ],
        "faint",
        swell() > 0.6 ? "sea-swell strong" : "sea-swell",
      ),
    );
  }

  for (const island of ISLANDS) {
    out.push(
      solidSvg(slabOf({ ...island, r: 3 }, -ISLAND_DEPTH, ISLAND_DEPTH, P, 4, 1.2), {
        tone: "lo",
        className: "m-island",
      }),
    );
    // Sea wall coping round the island top.
    out.push(
      line(
        P,
        [
          [island.x, island.y + island.d, 0.02],
          [island.x + island.w, island.y + island.d, 0.02],
          [island.x + island.w, island.y, 0.02],
        ],
        "mid",
      ),
    );
  }

  // Region pavings.
  out.push(flat(P, { x: -290, y: -290, w: 226, d: 234 }, GROUND + 0.02, "pave pave-directos"));
  out.push(flat(P, { x: -40, y: -290, w: 80, d: 234 }, GROUND + 0.02, "pave pave-directos"));
  out.push(flat(P, REGION_RECTS.shorts, GROUND + 0.02, "pave pave-shorts"));
  out.push(flat(P, REGION_RECTS.videos, GROUND + 0.02, "pave pave-videos"));
  out.push(flat(P, { x: 56, y: 56, w: 194, d: 194 }, GROUND + 0.02, "pave pave-malecon"));
  out.push(flat(P, { x: -40, y: -40, w: 80, d: 80 }, GROUND + 0.02, "pave pave-plaza"));
  out.push(flat(P, { x: -40, y: 56, w: 30, d: 194 }, GROUND + 0.02, "pave lawn"));
  out.push(flat(P, { x: 10, y: 56, w: 30, d: 194 }, GROUND + 0.02, "pave lawn"));
  out.push(flat(P, { x: -160, y: 330, w: 260, d: 172 }, GROUND + 0.02, "pave pave-stack"));

  // Plaza grid: stone joints from edge to edge.
  for (let u = -32; u <= 32; u += 8) {
    out.push(
      line(
        P,
        [
          [u, -40, 0.04],
          [u, 40, 0.04],
        ],
        "faint",
      ),
    );
    out.push(
      line(
        P,
        [
          [-40, u, 0.04],
          [40, u, 0.04],
        ],
        "faint",
      ),
    );
  }

  // Boardwalk: planks across the full width of the deck.
  const boardwalks: Rect[] = [
    { x: 250, y: 56, w: 10, d: 204 },
    { x: 56, y: 250, w: 194, d: 10 },
  ];
  for (const deck of boardwalks) {
    out.push(flat(P, deck, 0.04, "pave boardwalk"));
    if (deck.w < deck.d) {
      for (let v = deck.y + 2; v < deck.y + deck.d; v += 2.4)
        out.push(
          line(
            P,
            [
              [deck.x, v, 0.06],
              [deck.x + deck.w, v, 0.06],
            ],
            "faint",
          ),
        );
    } else {
      for (let u = deck.x + 2; u < deck.x + deck.w; u += 2.4)
        out.push(
          line(
            P,
            [
              [u, deck.y, 0.06],
              [u, deck.y + deck.d, 0.06],
            ],
            "faint",
          ),
        );
    }
  }

  // Roads.
  for (const road of ROADS) {
    if (road.kind === "puente") continue;
    const { x, y, w, d } = road.rect;
    out.push(flat(P, road.rect, 0.08, road.kind === "avenida" ? "road road-avenue" : "road"));
    const mid = road.along === "x" ? y + d / 2 : x + w / 2;
    if (road.id.startsWith("av-oeste")) {
      // The west avenue carries the freight line in its median; lane lines sit either side.
      for (const u of [x + 7.6, x + w - 7.6])
        out.push(
          line(
            P,
            [
              [u, y, 0.1],
              [u, y + d, 0.1],
            ],
            "lo",
          ),
        );
    } else if (road.along === "x") {
      out.push(
        line(
          P,
          [
            [x, mid, 0.1],
            [x + w, mid, 0.1],
          ],
          "mid",
          "lane-dash",
        ),
      );
    } else {
      out.push(
        line(
          P,
          [
            [mid, y, 0.1],
            [mid, y + d, 0.1],
          ],
          "mid",
          "lane-dash",
        ),
      );
    }
  }

  // Zebra crossings where avenues meet the plaza.
  const zebra = (x: number, y: number, along: "x" | "y", length: number) => {
    for (let s = 0; s < 6; s++) {
      const rect: Rect =
        along === "x"
          ? { x: x + s * 2.4, y, w: 1.2, d: length }
          : { x, y: y + s * 2.4, w: length, d: 1.2 };
      out.push(flat(P, rect, 0.12, "zebra"));
    }
  };
  zebra(-7, -56, "x", 16);
  zebra(-7, 40, "x", 16);
  zebra(-64, -7, "y", 24);
  zebra(40, -7, "y", 16);

  // Freight line: ballast, sleepers ending on the ballast edges, two rails.
  const ballast: Rect = { x: RAIL.x - 3.6, y: RAIL.from, w: 7.2, d: RAIL.to - RAIL.from };
  out.push(flat(P, RAIL.yards.directos, 0.09, "rail-yard"));
  out.push(flat(P, RAIL.yards.videos, 0.09, "rail-yard"));
  out.push(flat(P, ballast, 0.11, "ballast"));
  for (let v = ballast.y + 1; v < ballast.y + ballast.d; v += 1.8)
    out.push(
      line(
        P,
        [
          [ballast.x, v, 0.13],
          [ballast.x + ballast.w, v, 0.13],
        ],
        "faint",
      ),
    );
  for (const u of [RAIL.x - RAIL.gauge / 2, RAIL.x + RAIL.gauge / 2])
    out.push(
      line(
        P,
        [
          [u, ballast.y, 0.16],
          [u, ballast.y + ballast.d, 0.16],
        ],
        "hi",
        "rail",
      ),
    );
  // Sidings in both yards.
  for (const yard of [RAIL.yards.directos, RAIL.yards.videos]) {
    for (const u of [yard.x + 3, yard.x + 6, yard.x + yard.w - 6, yard.x + yard.w - 3])
      out.push(
        line(
          P,
          [
            [u, yard.y, 0.16],
            [u, yard.y + yard.d, 0.16],
          ],
          "mid",
          "rail",
        ),
      );
  }

  out.push(...lampPools);
  return out.join("");
}

/** Street lamps along every avenue and street, skipping anything they would stand in. */
export function lamps(P: Projection): { items: Item[]; pools: string[] } {
  const items: Item[] = [];
  const pools: string[] = [];
  const blocked = [
    ...LOTS.map((lot) => lot.rect),
    ...ROADS.map((road) => road.rect),
    RAIL.yards.directos,
    RAIL.yards.videos,
  ];
  const free = (x: number, y: number) => {
    const spot: Rect = { x: x - 0.6, y: y - 0.6, w: 1.2, d: 1.2 };
    return (
      ISLANDS.some(
        (island) =>
          overlaps(spot, island) &&
          x > island.x + 1 &&
          y > island.y + 1 &&
          x < island.x + island.w - 1 &&
          y < island.y + island.d - 1,
      ) && !blocked.some((rect) => overlaps(spot, rect, 0.4))
    );
  };
  let index = 0;
  for (const road of ROADS) {
    if (road.kind === "puente") continue;
    const { x, y, w, d } = road.rect;
    const spacing = road.kind === "avenida" ? 26 : 22;
    if (road.along === "x") {
      for (let u = x + 10; u < x + w - 4; u += spacing) {
        for (const [ly, arm] of [
          [y - 1.4, "y"],
          [y + d + 1.4, "-y"],
        ] as const) {
          if (!free(u, ly)) continue;
          items.push(streetlamp(P, u, ly, arm).item(`farol-${index++}`));
          pools.push(pool(P, u, ly + (arm === "y" ? 2.6 : -2.6), 0.1, 7.5));
        }
      }
    } else {
      for (let v = y + 10; v < y + d - 4; v += spacing) {
        for (const [lx, arm] of [
          [x - 1.4, "x"],
          [x + w + 1.4, "-x"],
        ] as const) {
          if (!free(lx, v)) continue;
          items.push(streetlamp(P, lx, v, arm).item(`farol-${index++}`));
          pools.push(pool(P, lx + (arm === "x" ? 2.6 : -2.6), v, 0.1, 7.5));
        }
      }
    }
  }
  return { items, pools };
}

/** Trees in the park strip, round the plaza and on the JP-Stack island. */
export function trees(P: Projection): Item[] {
  const spots: Array<[number, number, number]> = [];
  const rand = seeded(91);
  for (let v = 64; v < 246; v += 11) {
    for (const u of [-34, -22, 22, 34])
      spots.push([u + (rand() - 0.5) * 3, v + (rand() - 0.5) * 3, 0.9 + rand() * 0.4]);
  }
  for (const [u, v] of [
    [-36, -36],
    [36, -36],
    [-36, 36],
    [36, 36],
  ])
    spots.push([u, v, 1.1]);
  // JP-Stack island.
  for (let u = -150; u < 100; u += 16) {
    for (const v of [324, 512 - 6]) spots.push([u + rand() * 4, v, 0.85 + rand() * 0.3]);
  }
  for (const [u, v] of [
    [-24, 340],
    [24, 344],
    [-30, 452],
    [26, 446],
    [100, 380],
    [102, 452],
  ])
    spots.push([u, v, 1]);
  // Malecón lawn edge.
  for (let u = 70; u < 246; u += 14) spots.push([u, 244, 0.8 + rand() * 0.3]);

  const blocked = [...LOTS.map((lot) => lot.rect), ...ROADS.map((road) => road.rect)];
  return spots
    .filter(
      ([x, y]) =>
        !blocked.some((rect) => overlaps({ x: x - 3.4, y: y - 3.4, w: 6.8, d: 6.8 }, rect)),
    )
    .map(([x, y, scale], index) => tree(P, x, y, scale, index + 1).item(`arbol-${index}`));
}

/** The bridge to JP-Stack: deck, parapets, piers into the sea and lamps on it. */
export function bridge(P: Projection): Item {
  const road = ROADS.find((r) => r.kind === "puente");
  if (!road) throw new Error("no bridge");
  const { x, y, w, d } = road.rect;
  const p = new Piece(P);
  for (let v = y + 10; v < y + d; v += 20) {
    for (const u of [x + 4, x + w - 4])
      p.cyl(u, v, 2, SEA, -SEA - 1.2, { tone: "lo", steps: 14, className: "m-stone" });
  }
  p.box3(x, y - 2, -1.2, w, d + 4, 1.4, { tone: "mid", bevel: 0.3, className: "m-stone" });
  p.raw(flat(P, { x: x + 2, y: y - 2, w: w - 4, d: d + 4 }, 0.22, "road"));
  p.line(
    [
      [x + w / 2, y - 2, 0.25],
      [x + w / 2, y + d + 2, 0.25],
    ],
    "mid",
    { className: "lane-dash" },
  );
  p.box3(x, y - 2, 0.2, 1.2, d + 4, 1.4, { tone: "hi", r: 0.2 });
  p.box3(x + w - 1.2, y - 2, 0.2, 1.2, d + 4, 1.4, { tone: "hi", r: 0.2 });
  for (let v = y + 4; v < y + d; v += 14) {
    p.raw(halo(P, [x + w - 0.6, v, 2.4], 2, "amber"));
    p.dots([[x + w - 0.6, v, 1.7]], 0.45, "hi");
  }
  return p.item("puente", {
    region: "stack",
    hover: {
      kind: "Puente",
      title: "Puente a JP-Stack",
      summary: "Camiones y furgonetas cruzan desde los proyectos.",
    },
  });
}

/* ---------- tren aéreo ---------- */

const SEGMENT = 19;

/** Guideway segments and pylons; each segment is its own item so it sorts with what it passes. */
export function monorail(P: Projection): Item[] {
  const items: Item[] = [];
  const { x, z, beam } = MONORAIL;
  const runs = [MONORAIL.north, MONORAIL.south];
  runs.forEach((run, r) => {
    for (let v = run.from; v < run.to; v += SEGMENT) {
      const to = Math.min(run.to, v + SEGMENT);
      const p = new Piece(P);
      p.box3(x - beam / 2, v, z, beam, to - v, 2.6, {
        tone: "mid",
        bevel: 0.3,
        r: 0.2,
        className: "m-metal",
      });
      p.line(
        [
          [x + beam / 2, v, z + 1.3],
          [x + beam / 2, to, z + 1.3],
        ],
        "lo",
      );
      // Guide lights along the near side of the beam.
      p.dots([[x + beam / 2 + 0.05, (v + to) / 2, z + 0.7]], 0.4, "hi");
      items.push(
        p.item(`viga-${r}-${v}`, {
          hover: {
            kind: "Tren aéreo",
            title: "Línea Fundación",
            summary: "Une la Fundación con los directos y con JP-Stack.",
          },
        }),
      );
    }
    for (let v = run.from + 8; v < run.to - 4; v += MONORAIL.pylonEvery) {
      if (
        LOTS.some(
          (lot) => lot.kind === "estacion" && v > lot.rect.y - 2 && v < lot.rect.y + lot.rect.d + 2,
        )
      )
        continue;
      // Pylons over water stand on a footing; on land they stand on the road median.
      const onLand = ISLANDS.some((island) => v > island.y && v < island.y + island.d);
      const base = onLand ? GROUND + 0.1 : SEA;
      const p = new Piece(P);
      p.cyl(x, v, 2.2, base, 1, { tone: "lo", steps: 16, className: "m-stone" });
      p.cyl(x, v, 1.3, base + 1, z - 2.4 - base - 1, {
        tone: "mid",
        steps: 16,
        className: "m-metal",
      });
      p.box3(x - 2.6, v - 1.6, z - 2.4, 5.2, 3.2, 2.4, {
        tone: "hi",
        bevel: 0.3,
        r: 0.3,
        className: "m-metal",
      });
      items.push(p.item(`pilona-${r}-${v}`));
    }
  });
  return items;
}

/** A station: platform on columns, canopy, lit glass and a stair to the street. */
export function station(lot: Lot, P: Projection): Item {
  const { x, y, w, d } = lot.rect;
  const z = MONORAIL.z;
  const p = new Piece(P);
  const legs: Array<[number, number]> = [
    [x + 2, y + 2],
    [x + w - 2, y + 2],
    [x + 2, y + d - 2],
    [x + w - 2, y + d - 2],
  ];
  const floor = GROUND;
  for (const [u, v] of legs.slice(0, 2))
    p.cyl(u, v, 0.9, floor, z - 1 - floor, { tone: "mid", steps: 12, className: "m-metal" });
  p.box3(x, y, z - 1.2, w, d, 1.2, { tone: "mid", bevel: 0.3, className: "m-metal" });
  for (const [u, v] of legs.slice(2))
    p.cyl(u, v, 0.9, floor, z - 1 - floor, { tone: "mid", steps: 12, className: "m-metal" });
  // Platform edges either side of the guideway.
  p.box3(x + 1, y + 1, z, 7, d - 2, 0.6, { tone: "hi", r: 0.2 });
  p.box3(x + w - 8, y + 1, z, 7, d - 2, 0.6, { tone: "hi", r: 0.2 });
  // Glass walls, lit.
  p.raw(panel(P, "y", y + d - 1, x + 1.5, x + w - 1.5, z + 0.6, z + 6, "lit-glass"));
  p.raw(panel(P, "x", x + w - 1, y + 1.5, y + d - 1.5, z + 0.6, z + 6, "lit-glass"));
  p.box3(x - 1, y - 1, z + 6.2, w + 2, d + 2, 1, { tone: "hi", bevel: 0.3, className: "m-metal" });
  p.raw(halo(P, [x + w / 2, y + d / 2, z + 3], 12, "amber"));
  // Canopy lights along the near edge.
  p.dots(
    Array.from(
      { length: 5 },
      (_, i) => [x + 2 + i * ((w - 4) / 4), y + d + 0.6, z + 6.4] as Point3,
    ),
    0.45,
    "hi",
  );
  return p.item(lot.id, {
    region: lot.region,
    hover: {
      kind: "Tren aéreo",
      title: "Estación",
      summary: "Parada de la línea que sale de la Fundación.",
    },
  });
}

export { MAIN_ISLAND, STACK_ISLAND };
