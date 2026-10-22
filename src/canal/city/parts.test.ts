import { describe, expect, test } from "bun:test";
import { iso } from "./kit/iso-kit.ts";
import { neon, pool } from "./parts";
import { P } from "./scene";

const attr = (svg: string, name: string) =>
  Number(svg.match(new RegExp(` ${name}="([-\\d.]+)"`))?.[1]);

describe("pool", () => {
  test("is a plain ellipse, with no transform, through the projected floor circle", () => {
    const svg = pool(P, 40, -20, 0.1, 7);
    expect(svg).toStartWith("<ellipse");
    expect(svg).not.toContain("transform");
    const [cx, cy, rx, ry] = ["cx", "cy", "rx", "ry"].map((name) => attr(svg, name));
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const [sx, sy] = iso([40 + Math.cos(a) * 7, -20 + Math.sin(a) * 7, 0.1], P);
      // Every projected rim point lies on the ellipse (rounded to a tenth).
      expect(((sx - cx) / rx) ** 2 + ((sy - cy) / ry) ** 2).toBeCloseTo(1, 1);
    }
  });
});

describe("neon", () => {
  test("draws a soft glow and a bright core along the same path", () => {
    const svg = neon(P, [
      [0, 0, 10],
      [10, 0, 10],
    ]);
    const paths = [...svg.matchAll(/<path class="([^"]+)"[^>]* d="([^"]+)"/g)];
    expect(paths.map((m) => m[1])).toEqual(["neon-glow", "neon"]);
    expect(paths[0][2]).toBe(paths[1][2]);
    expect(svg).toContain('data-c="red"');
  });
});
