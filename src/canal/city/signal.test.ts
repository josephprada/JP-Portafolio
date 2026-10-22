import { describe, expect, test } from "bun:test";
import { searchlightOf } from "./build/tower";
import { clampView, OVERVIEW, regionView } from "./camera";
import { iso } from "./kit/iso-kit.ts";
import { LOTS, SIGNAL_TOWER } from "./plan";
import { buildScene, P } from "./scene";
import { signalAt } from "./signal";

const inside = (view: { x: number; y: number; w: number; h: number }, x: number, y: number) =>
  x >= view.x && x <= view.x + view.w && y >= view.y && y <= view.y + view.h;

describe("signal", () => {
  test("the lamp stands on the roof of a Directos tower", () => {
    const tower = buildScene().items.find((item) => item.key === SIGNAL_TOWER);
    const lot = LOTS.find((l) => l.id === SIGNAL_TOWER);
    expect(tower?.region).toBe("directos");
    if (!tower || !lot) return;
    const [x, y, z] = searchlightOf(lot);
    const { box } = tower;
    expect(x > box.x0 + 3 && x < box.x1 - 3 && y > box.y0 + 3 && y < box.y1 - 3).toBe(true);
    expect(z).toBeLessThan(box.z1);
    const { lamp } = signalAt(0);
    const lens = iso([x, y, z + 5.4], P);
    expect(Math.hypot(lamp[0] - lens[0], lamp[1] - lens[1])).toBeLessThan(0.5);
  });

  test("the disc is in the sky above the lamp and in view from Directos and the overview", () => {
    for (const t of [0, 3, 7, 11]) {
      const { lamp, disc } = signalAt(t);
      expect(disc.cy).toBeLessThan(lamp[1] - 60);
      // The views as a frame really crops them: wide desktop frames and 16:9.
      const views = [16 / 9, 1.9].flatMap((aspect) => [
        clampView(OVERVIEW, aspect),
        clampView(regionView("directos"), aspect),
      ]);
      for (const view of views)
        for (const [x, y] of [
          [disc.cx - disc.rx, disc.cy - disc.ry],
          [disc.cx + disc.rx, disc.cy + disc.ry],
        ])
          expect(inside(view, x, y)).toBe(true);
    }
  });

  test("the beam runs from the lamp to the rim of the disc", () => {
    const { lamp, disc, beam } = signalAt(2);
    expect(beam).toHaveLength(4);
    expect(Math.hypot(beam[0][0] - lamp[0], beam[0][1] - lamp[1])).toBeLessThan(3);
    expect(Math.abs(beam[2][1] - disc.cy)).toBeLessThan(disc.ry);
    expect(Math.abs(beam[2][0] - beam[3][0])).toBeGreaterThan(disc.rx);
  });

  test("sways slowly", () => {
    expect(signalAt(0).disc.cx).not.toBe(signalAt(4).disc.cx);
    expect(Math.abs(signalAt(0).disc.cx - signalAt(1 / 60).disc.cx)).toBeLessThan(0.2);
  });
});
