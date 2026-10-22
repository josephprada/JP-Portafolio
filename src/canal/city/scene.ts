import { bridge, ground, lamps, monorail, station, trees } from "./build/infrastructure";
import { buildProps } from "./build/props";
import { buildRegions } from "./build/regions";
import { tower } from "./build/tower";
import { townHall } from "./build/townhall";
import { fitProjection, type Point3, type Projection } from "./kit/iso-kit.ts";
import { type Bounds, boundsOf, paintOrder } from "./order";
import type { Item } from "./parts";
import { ISLAND_DEPTH, ISLANDS, LOTS, SEA } from "./plan";

/** The drawing's own coordinate space; the page scales it to fit. */
export const VIEW = { W: 2400, H: 1500 };

function frame(): Projection {
  const points: Point3[] = [];
  for (const island of ISLANDS) {
    for (const [x, y] of [
      [island.x - 40, island.y - 40],
      [island.x + island.w + 60, island.y - 40],
      [island.x - 40, island.y + island.d + 50],
      [island.x + island.w + 60, island.y + island.d + 50],
    ]) {
      points.push([x, y, SEA - ISLAND_DEPTH]);
    }
  }
  // Headroom for the tallest towers at the back.
  points.push([-290, -290, 175], [-200, -290, 175], [-290, -200, 175]);
  return fitProjection(points, VIEW.W, VIEW.H, { pad: 30 });
}

export const P = frame();

export interface SceneItem extends Item {
  bounds: Bounds;
}

export interface Scene {
  ground: string;
  items: SceneItem[];
}

let cached: Scene | null = null;

export function buildScene(): Scene {
  if (cached) return cached;
  const lampSet = lamps(P);
  const items: Item[] = [
    ...LOTS.filter((lot) => lot.kind === "torre" || lot.kind === "torre-directo").map((lot) =>
      tower(lot, P),
    ),
    ...LOTS.filter((lot) => lot.kind === "ayuntamiento").map((lot) => townHall(lot, P)),
    ...LOTS.filter((lot) => lot.kind === "estacion").map((lot) => station(lot, P)),
    ...buildRegions(P),
    ...buildProps(P),
    ...monorail(P),
    ...lampSet.items,
    ...trees(P),
    bridge(P),
  ];
  const placed = items.map((item) => ({ ...item, bounds: boundsOf(item.box, P) }));
  cached = { ground: ground(P, lampSet.pools), items: paintOrder(placed, P) };
  return cached;
}
