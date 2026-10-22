import { describe, expect, test } from "bun:test";
import { defsSvg, rgba } from "./gradients";

describe("gradients", () => {
  test("define every fill the stylesheet points at", () => {
    const defs = defsSvg();
    for (const id of [
      "city-pool-amber",
      "city-pool-cool",
      "city-pool-red",
      "city-halo-amber",
      "city-halo-red",
      "city-halo-white",
      "city-wash",
    ])
      expect(defs).toContain(`id="${id}"`);
  });

  test("turn a stop into a canvas colour", () => {
    expect(rgba([0, "#ff2a1f", 0.5])).toBe("rgba(255,42,31,0.5)");
  });
});
