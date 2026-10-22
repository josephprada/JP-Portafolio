import { describe, expect, test } from "bun:test";
import { clampView, fitAspect, labelAnchor, OVERVIEW, regionView, toFrame, zoomAt } from "./camera";
import { REGION_IDS } from "./model";

describe("camera", () => {
  test("fitAspect grows a view to the container's shape around the same centre", () => {
    const view = fitAspect({ x: 0, y: 0, w: 100, h: 100 }, 2);
    expect(view.w / view.h).toBeCloseTo(2);
    expect(view.x + view.w / 2).toBeCloseTo(50);
    expect(view.y + view.h / 2).toBeCloseTo(50);
    expect(view.w).toBeGreaterThanOrEqual(100);
    expect(view.h).toBeGreaterThanOrEqual(100);
  });

  test("every region has a view inside the overview", () => {
    for (const id of REGION_IDS) {
      const view = regionView(id);
      expect(view.w).toBeGreaterThan(0);
      expect(view.x).toBeGreaterThanOrEqual(OVERVIEW.x - 1);
      expect(view.y).toBeGreaterThanOrEqual(OVERVIEW.y - 1);
      expect(view.x + view.w).toBeLessThanOrEqual(OVERVIEW.x + OVERVIEW.w + 1);
      expect(view.y + view.h).toBeLessThanOrEqual(OVERVIEW.y + OVERVIEW.h + 1);
    }
  });

  test("zoomAt keeps the point under the pointer fixed", () => {
    const view = { x: 0, y: 0, w: 400, h: 200 };
    const out = zoomAt(view, 0.5, [100, 50]);
    expect(out.w).toBeCloseTo(200);
    // The focus sat at a quarter of the width; it still does.
    expect((100 - out.x) / out.w).toBeCloseTo(0.25);
    expect((50 - out.y) / out.h).toBeCloseTo(0.25);
  });

  test("clampView never zooms past the limits or leaves the city", () => {
    const tiny = clampView({ x: 0, y: 0, w: 1, h: 0.5 }, 2);
    expect(tiny.w).toBeGreaterThanOrEqual(OVERVIEW.w / 8 - 1e-6);
    const huge = clampView({ x: -9999, y: -9999, w: OVERVIEW.w * 4, h: OVERVIEW.w * 2 }, 2);
    expect(huge.w).toBeLessThanOrEqual(OVERVIEW.w * 1.0001);
    const far = clampView({ x: 99999, y: 99999, w: 300, h: 150 }, 2);
    expect(far.x + far.w).toBeLessThanOrEqual(OVERVIEW.x + OVERVIEW.w + 1e-6);
    expect(far.y + far.h).toBeLessThanOrEqual(OVERVIEW.y + OVERVIEW.h + 1e-6);
  });

  test("on a tall screen the overview still shows the whole width, centred", () => {
    const tall = clampView(OVERVIEW, 0.75);
    expect(tall.w).toBeCloseTo(OVERVIEW.w);
    expect(tall.y + tall.h / 2).toBeCloseTo(OVERVIEW.y + OVERVIEW.h / 2);
  });

  test("toFrame maps the view's corners onto the frame's corners", () => {
    const view = { x: 100, y: 50, w: 800, h: 400 };
    expect(toFrame(view, [1600, 800], [100, 50])).toEqual([0, 0]);
    const [x, y] = toFrame(view, [1600, 800], [900, 450]);
    expect(x).toBeCloseTo(1600);
    expect(y).toBeCloseTo(800);
  });

  test("every region's title floats over its own region, inside the drawing", () => {
    for (const id of REGION_IDS) {
      const [x, y] = labelAnchor(id);
      const view = regionView(id);
      expect(x).toBeGreaterThan(view.x);
      expect(x).toBeLessThan(view.x + view.w);
      expect(y).toBeGreaterThan(OVERVIEW.y);
      expect(y).toBeLessThan(OVERVIEW.y + OVERVIEW.h);
    }
  });
});
