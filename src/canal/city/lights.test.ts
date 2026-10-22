import { describe, expect, test } from "bun:test";
import { beatAt } from "./beat";
import { alphaOf, HIDE_ANIMATED, parseLights } from "./lights";
import { buildScene } from "./scene";

describe("parseLights", () => {
  test("reads every kind of animated element, in paint order", () => {
    const lights = parseLights([
      '<circle class="glow-halo" data-c="red" data-pulse cx="10" cy="20" r="3"/>',
      '<g class="bulbs"><circle class="bulb" data-p3="2" cx="1.5" cy="2" r="0.7"/></g>' +
        '<path class="iso-line belt" data-tone="hi" data-flow="" d="M0 0L5 5"/>' +
        '<path data-s="1" class="screen screen-2" d="M0 0L1 0L1 1Z"/>' +
        '<path class="screen-ink" d="M0 0L2 0L2 2Z"/>' +
        '<circle class="glow-halo core-aura" data-c="amber" cx="4" cy="5" r="26"/>' +
        '<path class="clock-hand" data-hand="m" data-len="1.45" data-c="3,4" data-u="1,0" data-v="0,-1" d=""/>',
    ]);
    expect(lights.map((l) => l.kind)).toEqual([
      "pulse",
      "bulb",
      "belt",
      "screen",
      "ink",
      "aura",
      "hand",
    ]);
    expect(lights[0]).toMatchObject({ cx: 10, cy: 20, r: 3, color: "red" });
    expect(lights[1]).toMatchObject({ cx: 1.5, cy: 2, r: 0.7, chase: "c3", phase: "2" });
    expect(lights[3]).toMatchObject({ d: "M0 0L1 0L1 1Z", slide: "1", fill: "#1f3a36" });
    expect(lights[6]).toMatchObject({ hour: false, len: 1.45, c: [3, 4], u: [1, 0], v: [0, -1] });
  });

  test("leaves static light alone: plain halos stay in the tiles", () => {
    expect(parseLights(['<circle class="glow-halo" data-c="red" cx="1" cy="1" r="2"/>'])).toEqual(
      [],
    );
  });

  test("finds the city's animated lights", () => {
    const lights = parseLights(buildScene().items.map((item) => item.svg));
    const kinds = new Set(lights.map((l) => l.kind));
    for (const kind of ["pulse", "bulb", "belt", "screen", "ink", "aura", "hand"])
      expect(kinds.has(kind as never)).toBe(true);
  });
});

describe("alphaOf", () => {
  test("follows the beat the way the stylesheet used to", () => {
    const off = { ...beatAt(0), blink: "0", c3: "2", slide: "0" } as const;
    const on = { ...off, blink: "1", c3: "0" } as const;
    const pulse = { kind: "pulse", cx: 0, cy: 0, r: 1, color: "red" } as const;
    expect(alphaOf(pulse, off)).toBeCloseTo(0.3);
    expect(alphaOf(pulse, on)).toBe(1);
    const bulb = { kind: "bulb", cx: 0, cy: 0, r: 1, chase: "c3", phase: "2" } as const;
    expect(alphaOf(bulb, off)).toBeCloseTo(0.3);
    expect(alphaOf(bulb, on)).toBe(1);
  });
});

describe("HIDE_ANIMATED", () => {
  test("hides in the tiles exactly what is drawn live", () => {
    for (const selector of [".glow-halo[data-pulse]", ".bulb", ".belt", ".screen", "[data-hand]"])
      expect(HIDE_ANIMATED).toContain(selector);
  });
});
