import { describe, expect, test } from "bun:test";
import { fitProjection, type Projection } from "./kit/iso-kit.ts";
import { type Box3, behind, boundsOf, paintOrder, SlotIndex } from "./order";

const P: Projection = fitProjection(
  [
    [-100, -100, 0],
    [100, 100, 0],
    [0, 0, 80],
  ],
  800,
  600,
);

const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): Box3 => ({
  x0,
  y0,
  z0,
  x1,
  y1,
  z1,
});

/** A street of buildings of mixed sizes, some tall, on a jittered grid. */
function city(): Box3[] {
  const out: Box3[] = [];
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      const x = -90 + i * 20 + rand() * 3;
      const y = -90 + j * 20 + rand() * 3;
      const w = 6 + rand() * 10;
      const d = 6 + rand() * 10;
      out.push(box(x, y, 0, x + w, y + d, 4 + rand() * 60));
    }
  }
  // A long warehouse and a beam over a street: the cases a centre sort gets wrong.
  out.push(box(-95, 95, 0, 95, 99, 6));
  out.push(box(97, -95, 30, 99, 95, 32));
  return out;
}

describe("behind", () => {
  test("a box further along +x, +y or up is in front", () => {
    const a = box(0, 0, 0, 10, 10, 10);
    expect(behind(a, box(10, 0, 0, 20, 10, 10))).toBe(true);
    expect(behind(a, box(0, 10, 0, 10, 20, 10))).toBe(true);
    expect(behind(a, box(0, 0, 10, 10, 10, 20))).toBe(true);
    expect(behind(box(10, 0, 0, 20, 10, 10), a)).toBe(false);
  });
});

describe("paintOrder", () => {
  const boxes = city();
  const items = boxes.map((b, index) => ({ key: String(index), box: b, bounds: boundsOf(b, P) }));
  const order = paintOrder(items);
  const position = new Map(order.map((item, index) => [item.key, index]));

  test("keeps every item exactly once", () => {
    expect(order).toHaveLength(items.length);
    expect(new Set(order.map((item) => item.key)).size).toBe(items.length);
  });

  test("every pair that overlaps on screen is painted back to front", () => {
    let checked = 0;
    for (const a of items) {
      for (const b of items) {
        if (a === b) continue;
        const touch =
          a.bounds.x0 < b.bounds.x1 &&
          b.bounds.x0 < a.bounds.x1 &&
          a.bounds.y0 < b.bounds.y1 &&
          b.bounds.y0 < a.bounds.y1;
        if (!touch || !behind(a.box, b.box) || behind(b.box, a.box)) continue;
        checked++;
        expect(position.get(a.key) as number).toBeLessThan(position.get(b.key) as number);
      }
    }
    expect(checked).toBeGreaterThan(50);
  });
});

describe("SlotIndex", () => {
  const boxes = city();
  const items = paintOrder(
    boxes.map((b, index) => ({ key: String(index), box: b, bounds: boundsOf(b, P) })),
  );
  const index = new SlotIndex(items);

  test("a moving box is slotted after everything behind it and before everything in front", () => {
    for (let x = -90; x < 90; x += 7) {
      for (let y = -90; y < 90; y += 11) {
        const car = box(x, y, 0, x + 3, y + 1.6, 1.6);
        const slot = index.slotFor(car, boundsOf(car, P));
        items.forEach((item, at) => {
          const b = item.bounds;
          const c = boundsOf(car, P);
          const touch = b.x0 < c.x1 && c.x0 < b.x1 && b.y0 < c.y1 && c.y0 < b.y1;
          if (!touch) return;
          if (behind(item.box, car) && !behind(car, item.box)) expect(at).toBeLessThan(slot);
          if (behind(car, item.box) && !behind(item.box, car))
            expect(at).toBeGreaterThanOrEqual(slot);
        });
      }
    }
  });

  test("frontOf lists, in paint order, exactly the overlapping items at or after the slot", () => {
    for (let x = -90; x < 90; x += 13) {
      const car = box(x, x / 2, 0, x + 3, x / 2 + 1.6, 1.6);
      const c = boundsOf(car, P);
      const slot = index.slotFor(car, c);
      const expected = items
        .map((item, at) => ({ b: item.bounds, at }))
        .filter(
          ({ b, at }) => at >= slot && b.x0 < c.x1 && c.x0 < b.x1 && b.y0 < c.y1 && c.y0 < b.y1,
        )
        .map(({ at }) => at);
      expect(index.frontOf(c, slot)).toEqual(expected);
    }
  });
});
