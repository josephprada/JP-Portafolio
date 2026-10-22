import { describe, expect, test } from "bun:test";
import { fitProjection } from "../kit/iso-kit.ts";
import { ISLANDS, inside, LOTS, overlaps, RAIL, REGION_RECTS, ROADS } from "../plan";
import { buildProps, PROPS } from "./props";

describe("props", () => {
  test("every prop sits inside its region and on an island", () => {
    for (const prop of PROPS) {
      expect(inside(prop.rect, REGION_RECTS[prop.region])).toBe(true);
      expect(ISLANDS.some((island) => inside(prop.rect, island))).toBe(true);
    }
  });

  test("no prop stands on a building, a road, a rail yard or another prop", () => {
    const blocked = [
      ...LOTS.map((lot) => ({ id: lot.id, rect: lot.rect })),
      ...ROADS.map((road) => ({ id: road.id, rect: road.rect })),
      { id: "rail-directos", rect: RAIL.yards.directos },
      { id: "rail-videos", rect: RAIL.yards.videos },
    ];
    for (const prop of PROPS) {
      // Street lamps stand 1.4 off each road edge; keep clear of them too.
      for (const other of blocked) {
        const gap = ROADS.some((road) => road.id === other.id) ? 3 : 0.5;
        if (overlaps(prop.rect, other.rect, gap)) throw new Error(`${prop.id} hits ${other.id}`);
      }
      for (const other of PROPS) {
        if (other !== prop && overlaps(prop.rect, other.rect, 0.5))
          throw new Error(`${prop.id} hits ${other.id}`);
      }
    }
  });

  test("props keep clear of the malecón's row of trees", () => {
    const row = { x: 56, y: 240, w: 200, d: 8 };
    for (const prop of PROPS) expect(overlaps(prop.rect, row)).toBe(false);
  });

  test("each prop builds one item whose box stays on its footprint", () => {
    const P = fitProjection(
      [
        [-300, -300, 0],
        [300, 500, 0],
      ],
      800,
      600,
    );
    const items = buildProps(P);
    expect(items.length).toBe(PROPS.length);
    for (const [index, item] of items.entries()) {
      const { rect } = PROPS[index];
      expect(item.box.x0).toBeGreaterThanOrEqual(rect.x - 0.01);
      expect(item.box.y0).toBeGreaterThanOrEqual(rect.y - 0.01);
      expect(item.box.x1).toBeLessThanOrEqual(rect.x + rect.w + 0.01);
      expect(item.box.y1).toBeLessThanOrEqual(rect.y + rect.d + 0.01);
      expect(item.hover?.title).toBeTruthy();
    }
  });
});
