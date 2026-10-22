import { describe, expect, test } from "bun:test";
import { directosHero, heroAt, heroCover } from "./hero";
import { SlotIndex } from "./order";
import { prepare } from "./prepare";
import { buildScene, P } from "./scene";

describe("prepare", () => {
  const scene = buildScene();
  const { lights, occluders } = prepare(scene);

  test("reads the live lights out of the scene", () => {
    expect(lights.length).toBeGreaterThan(100);
  });

  test("lists the buildings that can stand in front of a vehicle, once each", () => {
    expect(occluders.length).toBeGreaterThan(0);
    expect(new Set(occluders).size).toBe(occluders.length);
    for (const index of occluders) expect(scene.items[index]).toBeDefined();
  });

  test("includes every building that can stand in front of Spider-Man or his web", () => {
    const hero = directosHero();
    const slots = new SlotIndex(scene.items);
    const listed = new Set(occluders);
    let covered = 0;
    for (let k = 0; k < 500; k++) {
      const { front } = heroCover(heroAt(hero, (hero.period * k) / 500), slots, P);
      covered += front.length;
      for (const index of front) expect(listed.has(index)).toBe(true);
    }
    expect(covered).toBeGreaterThan(0);
  });

  test("is plain data, so a worker can post it", () => {
    expect(() => structuredClone({ lights, occluders })).not.toThrow();
  });
});
