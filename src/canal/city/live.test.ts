import { describe, expect, test } from "bun:test";
import { TOUR } from "./live";
import { REGION_IDS } from "./model";

describe("tour", () => {
  test("starts on the overview and visits every region exactly once", () => {
    expect(TOUR[0]).toBeNull();
    expect([...TOUR.slice(1)].sort()).toEqual([...REGION_IDS].sort());
  });
});
