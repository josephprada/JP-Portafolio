import { iso, type Projection } from "./kit/iso-kit.ts";
import type { Bounds, Box3 } from "./order";

/**
 * What is under the pointer, found by geometry: there is no DOM to ask any
 * more, only bitmaps. Every building is its box, and a box seen from above is
 * a convex hexagon on screen.
 */

export type Polygon = Array<[number, number]>;

/** The convex screen outline of a box, optionally padded on every side. */
export function hullOf(box: Box3, P: Projection, pad = 0): Polygon {
  const corners: Polygon = [];
  for (const x of [box.x0 - pad, box.x1 + pad]) {
    for (const y of [box.y0 - pad, box.y1 + pad]) {
      for (const z of [box.z0 - pad, box.z1 + pad]) corners.push(iso([x, y, z], P));
    }
  }
  // Andrew's monotone chain.
  corners.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: number[], a: number[], b: number[]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (points: Polygon) => {
    const out: Polygon = [];
    for (const point of points) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], point) <= 0)
        out.pop();
      out.push(point);
    }
    out.pop();
    return out;
  };
  return [...half(corners), ...half([...corners].reverse())];
}

/** Even-odd test of a point against a polygon. */
export function inside(polygon: Polygon, [x, y]: [number, number]): boolean {
  let hit = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

/**
 * The front-most item with something to say under a point of the drawing,
 * or -1. Items are in paint order, so the last hit is the one on top.
 */
export function pickItem(
  items: Array<{ box: Box3; bounds: Bounds; hover?: unknown }>,
  point: [number, number],
  P: Projection,
): number {
  const [x, y] = point;
  for (let index = items.length - 1; index >= 0; index--) {
    const { box, bounds, hover } = items[index];
    if (!hover || x < bounds.x0 || x > bounds.x1 || y < bounds.y0 || y > bounds.y1) continue;
    if (inside(hullOf(box, P), point)) return index;
  }
  return -1;
}
