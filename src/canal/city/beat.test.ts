import { describe, expect, test } from "bun:test";
import { beatAt } from "./beat";

describe("beatAt", () => {
  test("is a pure function of time", () => {
    expect(beatAt(12.34)).toEqual(beatAt(12.34));
  });

  test("beacons are off a little under a quarter of each cycle", () => {
    let off = 0;
    const steps = 2400;
    for (let i = 0; i < steps; i++) if (beatAt((i / steps) * 24).blink === "0") off++;
    expect(off / steps).toBeGreaterThan(0.18);
    expect(off / steps).toBeLessThan(0.26);
  });

  test("billboards show each of their three posts in turn", () => {
    const seen = new Set<string>();
    for (let t = 0; t < 9; t += 0.5) seen.add(beatAt(t).slide);
    expect([...seen].sort()).toEqual(["0", "1", "2"]);
  });

  test("the lights layer changes a few times a second, not every frame", () => {
    let changes = 0;
    let last = JSON.stringify(beatAt(0));
    for (let frame = 1; frame <= 600; frame++) {
      const now = JSON.stringify(beatAt(frame / 60));
      if (now !== last) changes++;
      last = now;
    }
    // Ten seconds at 60 fps: well under one change in five frames.
    expect(changes).toBeLessThan(120);
  });

  test("drives only lights that live on the lights layer: no neon flicker", () => {
    expect(Object.keys(beatAt(0)).sort()).toEqual(["blink", "breath", "c2", "c3", "slide"]);
  });
});
