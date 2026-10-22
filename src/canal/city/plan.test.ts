import { describe, expect, test } from "bun:test";
import { channel } from "../data";

import { projects } from "./model";
import { ISLANDS, inside, LOTS, overlaps, RAIL, ROADS } from "./plan";

const { streams } = channel;

const onLand = (rect: Parameters<typeof inside>[0]) =>
  ISLANDS.some((island) => inside(rect, island));

describe("plan", () => {
  test("lot ids are unique", () => {
    expect(new Set(LOTS.map((lot) => lot.id)).size).toBe(LOTS.length);
  });

  test("every lot that is not built over a road or water stands on an island", () => {
    for (const lot of LOTS.filter((l) => !l.spans)) {
      expect({ lot: lot.id, onLand: onLand(lot.rect) }).toEqual({ lot: lot.id, onLand: true });
    }
  });

  test("lots on land never overlap each other", () => {
    const land = LOTS.filter((lot) => !lot.spans);
    land.forEach((a, index) => {
      for (const b of land.slice(index + 1)) {
        expect({ pair: `${a.id}/${b.id}`, hit: overlaps(a.rect, b.rect) }).toEqual({
          pair: `${a.id}/${b.id}`,
          hit: false,
        });
      }
    });
  });

  test("lots on land keep off the roads and the rail yards", () => {
    const blocked = [...ROADS.map((road) => road.rect), RAIL.yards.directos, RAIL.yards.videos];
    for (const lot of LOTS.filter((l) => !l.spans)) {
      for (const rect of blocked) {
        expect({ lot: lot.id, hit: overlaps(lot.rect, rect) }).toEqual({ lot: lot.id, hit: false });
      }
    }
  });

  test("every stream has its own tower in the streams district", () => {
    for (const stream of streams) {
      const tower = LOTS.find((lot) => lot.ref === stream.id);
      expect(tower?.kind).toBe("torre-directo");
      expect(tower?.region).toBe("directos");
    }
  });

  test("the streams district has many more towers than streams", () => {
    const towers = LOTS.filter((lot) => lot.kind === "torre" || lot.kind === "torre-directo");
    expect(towers.length).toBeGreaterThanOrEqual(streams.length * 2);
  });

  test("towers get lower toward the front, so none hides a taller one behind it", () => {
    const towers = LOTS.filter((lot) => lot.kind === "torre" || lot.kind === "torre-directo");
    const depth = (lot: (typeof towers)[number]) =>
      lot.rect.x + lot.rect.w / 2 + lot.rect.y + lot.rect.d / 2;
    const ordered = [...towers].sort((a, b) => depth(a) - depth(b));
    for (let i = 1; i < ordered.length; i++) {
      expect(ordered[i].height ?? 0).toBeLessThanOrEqual((ordered[i - 1].height ?? 0) + 10);
    }
  });

  test("every JP-Stack project has a building in the town", () => {
    for (const project of projects) {
      const lot = LOTS.find((l) => l.ref === project.id);
      expect(lot?.region).toBe("stack");
    }
  });

  test("Shorts leave through two docks, one per platform", () => {
    const docks = LOTS.filter((lot) => lot.kind === "muelle-carga").map((lot) => lot.ref);
    expect(docks.sort()).toEqual(["shorts", "tiktok"]);
  });
});
