import { describe, expect, test } from "bun:test";
import { FrameBudget } from "./budget";

const run = (budget: FrameBudget, dt: number, frames: number, busy = false) => {
  let lowered = false;
  for (let i = 0; i < frames; i++) lowered = budget.push(dt, busy) || lowered;
  return lowered;
};

describe("FrameBudget", () => {
  test("keeps the resolution while frames are on time", () => {
    expect(run(new FrameBudget(), 1 / 60, 600)).toBe(false);
  });

  test("asks for less after two seconds of slow frames", () => {
    const budget = new FrameBudget();
    expect(run(budget, 1 / 30, 30)).toBe(false);
    expect(run(budget, 1 / 30, 60)).toBe(true);
  });

  test("a few hitches are not a slow screen", () => {
    const budget = new FrameBudget();
    let lowered = false;
    for (let i = 0; i < 600; i++)
      lowered = budget.push(i % 20 === 0 ? 0.1 : 1 / 60, false) || lowered;
    expect(lowered).toBe(false);
  });

  test("frames spent making tiles do not count", () => {
    expect(run(new FrameBudget(), 1 / 20, 300, true)).toBe(false);
  });

  test("starts over after asking, so it steps down one notch at a time", () => {
    const budget = new FrameBudget();
    let asks = 0;
    for (let i = 0; i < 120; i++) if (budget.push(1 / 30, false)) asks++;
    expect(asks).toBe(1);
  });
});
