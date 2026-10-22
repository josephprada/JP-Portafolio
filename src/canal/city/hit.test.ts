import { describe, expect, test } from "bun:test";
import { hullOf, inside, pickItem } from "./hit";
import { iso } from "./kit/iso-kit.ts";
import { buildScene, P } from "./scene";

describe("hullOf", () => {
  test("is the convex outline of a box's eight projected corners", () => {
    const box = { x0: 0, y0: 0, z0: 0, x1: 10, y1: 6, z1: 20 };
    const hull = hullOf(box, P);
    expect(hull.length).toBe(6);
    // The middle of the box is inside, a point far away is not.
    expect(inside(hull, iso([5, 3, 10], P))).toBe(true);
    expect(inside(hull, iso([40, 40, 0], P))).toBe(false);
  });
});

describe("pickItem", () => {
  const scene = buildScene();

  test("finds the building under a point on its face", () => {
    const index = scene.items.findIndex((item) => item.key.startsWith("torre") && item.hover);
    const { box } = scene.items[index];
    const point = iso([box.x1, (box.y0 + box.y1) / 2, (box.z0 + box.z1) / 2], P);
    const picked = pickItem(scene.items, point, P);
    // The front-most item there: this tower or one painted after it.
    expect(picked).toBeGreaterThanOrEqual(index);
    expect(scene.items[picked].hover).toBeDefined();
  });

  test("finds nothing over open sea", () => {
    expect(pickItem(scene.items, [5, 5], P)).toBe(-1);
  });
});
