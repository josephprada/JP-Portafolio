import { describe, expect, test } from "bun:test";
import { apply, BEAM, beamPath, beamTurn } from "./beam";
import { LIGHTHOUSE } from "./build/regions";
import { iso } from "./kit/iso-kit.ts";
import { P } from "./scene";

describe("lighthouse beam", () => {
  test("turning the drawn beam lands on the projection of the turned world point", () => {
    const { x, y, lamp } = LIGHTHOUSE;
    for (const angle of [0.3, 1.2, 2.9, 4.4]) {
      const m = beamTurn(angle);
      const tip = iso([x + BEAM.reach, y, lamp], P);
      const turned = iso(
        [x + Math.cos(angle) * BEAM.reach, y + Math.sin(angle) * BEAM.reach, lamp],
        P,
      );
      const [sx, sy] = apply(m, tip);
      expect(sx).toBeCloseTo(turned[0], 6);
      expect(sy).toBeCloseTo(turned[1], 6);
    }
  });

  test("the lamp itself stays put", () => {
    const { x, y, lamp } = LIGHTHOUSE;
    const centre = iso([x, y, lamp], P);
    const [sx, sy] = apply(beamTurn(2), centre);
    expect(sx).toBeCloseTo(centre[0], 6);
    expect(sy).toBeCloseTo(centre[1], 6);
  });

  test("the beam is drawn once, as a closed wedge", () => {
    expect(beamPath()).toMatch(/^M[^Z]+Z$/);
  });
});
