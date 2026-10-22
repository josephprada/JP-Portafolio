import { describe, expect, test } from "bun:test";
import { flows, marketing, projects, REGION_IDS, regions } from "./model";

const into = (id: string) => flows.filter((flow) => flow.to === id);
const from = (id: string) => flows.filter((flow) => flow.from === id);

describe("regions", () => {
  test("one entry per region id, in order", () => {
    expect(regions.map((region) => region.id)).toEqual([...REGION_IDS]);
  });
});

describe("flows follow the brief", () => {
  test("every flow joins known places", () => {
    const known = new Set<string>([...REGION_IDS, "redes"]);
    for (const flow of flows) {
      expect(known.has(flow.from)).toBe(true);
      expect(known.has(flow.to)).toBe(true);
      expect(flow.from).not.toBe(flow.to);
    }
  });

  test("the foundation feeds every other region", () => {
    const fed = new Set(from("fundacion").map((flow) => flow.to));
    for (const id of REGION_IDS.filter((region) => region !== "fundacion")) {
      expect(fed.has(id)).toBe(true);
    }
  });

  test("the foundation's main lines go to projects and streams", () => {
    const main = from("fundacion")
      .filter((flow) => flow.weight === "principal")
      .map((flow) => flow.to)
      .sort();
    expect(main).toEqual(["directos", "stack"]);
  });

  test("Shorts are fed mainly by streams, plus projects and the foundation", () => {
    const feeders = into("shorts");
    expect(feeders.filter((flow) => flow.weight === "principal").map((flow) => flow.from)).toEqual([
      "directos",
    ]);
    expect(new Set(feeders.map((flow) => flow.from))).toEqual(
      new Set(["directos", "stack", "fundacion"]),
    );
  });

  test("streams are fed by projects", () => {
    expect(into("directos").some((flow) => flow.from === "stack")).toBe(true);
  });

  test("videos are mainly fed by streams", () => {
    const main = into("videos").filter((flow) => flow.weight === "principal");
    expect(main.map((flow) => flow.from)).toEqual(["directos"]);
  });

  test("JP-Stack talks to marketing, videos and Shorts", () => {
    const touches = flows
      .filter((flow) => flow.from === "stack" || flow.to === "stack")
      .flatMap((flow) => [flow.from, flow.to]);
    for (const id of ["malecon", "videos", "shorts"]) expect(touches).toContain(id);
  });

  test("marketing ships out to the networks by boat", () => {
    expect(from("malecon").some((flow) => flow.to === "redes" && flow.vehicle === "barco")).toBe(
      true,
    );
  });

  test("flow ids are unique", () => {
    expect(new Set(flows.map((flow) => flow.id)).size).toBe(flows.length);
  });
});

describe("JP-Stack", () => {
  test("lists the five named applications", () => {
    const names = projects.map((project) => project.name);
    for (const name of [
      "JP-Wallet",
      "JP-Venta",
      "JP-Portafolio",
      "JP-Apartment",
      "JP-Metodología",
    ]) {
      expect(names).toContain(name);
    }
  });
});

describe("marketing", () => {
  test("every format has a landmark on the boardwalk", () => {
    for (const format of marketing) expect(format.landmark.length).toBeGreaterThan(0);
  });
});
