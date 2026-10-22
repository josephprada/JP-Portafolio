import { describe, expect, test } from "bun:test";
import { ROUTES } from "./routes";
import { laneOf, poseAt, scheduleOf } from "./vehicles";

const route = (id: string) => {
  const found = ROUTES.find((r) => r.id === id);
  if (!found) throw new Error(id);
  return found;
};

describe("laneOf", () => {
  test("keeps to the right of the centre line in both directions", () => {
    const path: Array<[number, number]> = [
      [0, 0],
      [0, 100],
    ];
    // Heading +y with z up, the right-hand side is -x... from above with x right and y up, right of +y is +x.
    const out = laneOf(path, 3);
    const back = laneOf([...path].reverse(), 3);
    expect(out[0][0]).toBeCloseTo(3);
    expect(back[0][0]).toBeCloseTo(-3);
  });

  test("turns a corner on the offset lines' intersection", () => {
    const out = laneOf(
      [
        [0, 0],
        [0, 50],
        [50, 50],
      ],
      2,
    );
    expect(out[1][0]).toBeCloseTo(2);
    expect(out[1][1]).toBeCloseTo(48);
  });
});

describe("poseAt", () => {
  test("a shuttle starts at the first point, waits, and reaches the far end", () => {
    const r = route("tren-carga");
    const s = scheduleOf(r);
    const start = poseAt(r, 0, 0);
    expect(start.x).toBeCloseTo(-52);
    expect(start.y).toBeCloseTo(-275);
    const far = poseAt(r, 0, s.leg + r.dwell * 0.5);
    expect(far.y).toBeCloseTo(236);
  });

  test("road vehicles always face along an axis", () => {
    const r = route("camiones-directos");
    for (let t = 0; t < scheduleOf(r).period; t += 0.7) {
      expect(["+x", "-x", "+y", "-y"]).toContain(poseAt(r, 0, t).heading);
    }
  });

  test("vehicles on one route are spread along it", () => {
    const r = route("furgonetas-directos-1");
    const a = poseAt(r, 0, 3);
    const b = poseAt(r, 1, 3);
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(5);
  });

  test("helicopters climb, cruise and land on their pads", () => {
    const r = route("helicoptero-videos");
    const s = scheduleOf(r);
    const [pad, cruise, landing] = r.heights ?? [0, 0, 0];
    expect(poseAt(r, 0, 0).z).toBeCloseTo(pad);
    expect(poseAt(r, 0, s.leg / 2).z).toBeCloseTo(cruise);
    expect(poseAt(r, 0, s.leg + r.dwell / 2).z).toBeCloseTo(landing);
  });

  test("boats leaving for the networks fade out at the edge and come back", () => {
    const r = route("barcos-redes");
    const s = scheduleOf(r);
    expect(poseAt(r, 0, 0).alpha).toBeCloseTo(0, 1);
    expect(poseAt(r, 0, s.period * 0.5).alpha).toBeCloseTo(1, 1);
    expect(poseAt(r, 0, s.period - 0.01).alpha).toBeLessThan(0.1);
  });
});
