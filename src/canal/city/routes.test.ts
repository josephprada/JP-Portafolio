import { describe, expect, test } from "bun:test";
import { flows } from "./model";
import { ISLANDS, inside, MAIN_ISLAND, REGION_RECTS, type Rect, ROADS } from "./plan";
import { ROUTES } from "./routes";

const on = (rect: Rect, [x, y]: [number, number], slack = 0) =>
  x >= rect.x - slack &&
  x <= rect.x + rect.w + slack &&
  y >= rect.y - slack &&
  y <= rect.y + rect.d + slack;

describe("routes", () => {
  test("every flow has at least one route, and every route serves a flow", () => {
    const ids = new Set(flows.map((flow) => flow.id));
    for (const flow of flows) expect(ROUTES.some((route) => route.flow === flow.id)).toBe(true);
    for (const route of ROUTES) expect(ids.has(route.flow)).toBe(true);
  });

  test("routes use the flow's vehicle", () => {
    for (const route of ROUTES) {
      const flow = flows.find((f) => f.id === route.flow);
      expect(route.vehicle).toBe(flow?.vehicle as string);
    }
  });

  test("ground routes start in the source region and end in the target region", () => {
    for (const route of ROUTES.filter((r) => r.mode === "road" || r.mode === "rail")) {
      const flow = flows.find((f) => f.id === route.flow);
      if (!flow || flow.to === "redes") continue;
      const first = route.path[0];
      const last = route.path[route.path.length - 1];
      expect({ route: route.id, start: on(REGION_RECTS[flow.from], first, 12) }).toEqual({
        route: route.id,
        start: true,
      });
      expect({ route: route.id, end: on(REGION_RECTS[flow.to], last, 12) }).toEqual({
        route: route.id,
        end: true,
      });
    }
  });

  test("road routes turn only at right angles and stay on roads", () => {
    const paved = ROADS.map((road) => road.rect);
    for (const route of ROUTES.filter((r) => r.mode === "road")) {
      route.path.forEach((point, index) => {
        if (index > 0) {
          const prev = route.path[index - 1];
          expect(prev[0] === point[0] || prev[1] === point[1]).toBe(true);
          // Sample the segment: every sample lies on some road.
          for (let t = 0; t <= 1; t += 0.05) {
            const sample: [number, number] = [
              prev[0] + (point[0] - prev[0]) * t,
              prev[1] + (point[1] - prev[1]) * t,
            ];
            expect({
              route: route.id,
              sample,
              paved: paved.some((rect) => on(rect, sample, 1)),
            }).toEqual({
              route: route.id,
              sample,
              paved: true,
            });
          }
        }
      });
    }
  });

  test("boats never cross an island", () => {
    for (const route of ROUTES.filter((r) => r.mode === "water")) {
      route.path.forEach((point, index) => {
        if (index === 0) return;
        const prev = route.path[index - 1];
        for (let t = 0; t <= 1; t += 0.02) {
          const sample: [number, number] = [
            prev[0] + (point[0] - prev[0]) * t,
            prev[1] + (point[1] - prev[1]) * t,
          ];
          const land = ISLANDS.some((island) => on(island, sample, -0.5));
          expect({ route: route.id, sample, land }).toEqual({
            route: route.id,
            sample,
            land: false,
          });
        }
      });
    }
  });

  test("the main lines carry more traffic than the secondary ones", () => {
    const count = (id: string) =>
      ROUTES.filter((r) => r.flow === id).reduce((n, r) => n + r.count, 0);
    expect(count("directos-shorts")).toBeGreaterThan(count("fundacion-shorts"));
    expect(count("directos-shorts")).toBeGreaterThan(count("stack-shorts"));
  });

  test("everything stays within the picture", () => {
    const frame: Rect = { x: MAIN_ISLAND.x - 160, y: MAIN_ISLAND.y - 160, w: 900, d: 1000 };
    for (const route of ROUTES)
      for (const point of route.path)
        expect(inside({ x: point[0], y: point[1], w: 0, d: 0 }, frame)).toBe(true);
  });
});
