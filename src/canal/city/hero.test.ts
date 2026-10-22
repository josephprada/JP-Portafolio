import { describe, expect, test } from "bun:test";
import { ledgeOf } from "./build/tower";
import { directosHero, heroAt, heroBox } from "./hero";
import { LOTS } from "./plan";
import { buildScene } from "./scene";

const towers = buildScene()
  .items.filter((item) => item.region === "directos" && item.key.startsWith("torre"))
  .map((item) => item.box);
const ledges = LOTS.filter((lot) => lot.kind === "torre" || lot.kind === "torre-directo").map(
  ledgeOf,
);
const hero = directosHero();
const dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const samples = Array.from({ length: 4000 }, (_, i) => (i / 4000) * hero.period);

describe("heroPath", () => {
  test("swings from many towers round a loop of streets", () => {
    expect(hero.swings.length).toBeGreaterThan(10);
    expect(hero.period).toBeGreaterThan(20);
  });

  test("every web sticks to the face of a tower, at or below its first ledge", () => {
    for (const { anchor } of hero.swings) {
      const [x, y, z] = anchor;
      const ledge = ledges.find(
        (b) => x >= b.x0 - 0.01 && x <= b.x1 + 0.01 && y >= b.y0 - 0.01 && y <= b.y1 + 0.01,
      );
      expect(ledge).toBeDefined();
      if (!ledge) continue;
      const onFace = Math.min(
        Math.abs(x - ledge.x0),
        Math.abs(x - ledge.x1),
        Math.abs(y - ledge.y0),
        Math.abs(y - ledge.y1),
      );
      expect(onFace).toBeLessThan(1.01);
      expect(z).toBeLessThanOrEqual(ledge.z1);
    }
  });
});

describe("heroAt", () => {
  test("moves without jumps and comes back to the start", () => {
    for (const t of samples) {
      const a = heroAt(hero, t).pos;
      const b = heroAt(hero, t + 1 / 60).pos;
      expect(dist(a, b)).toBeLessThan(4);
    }
    const start = heroAt(hero, 0).pos;
    const again = heroAt(hero, hero.period).pos;
    expect(dist(start, again)).toBeLessThan(1e-6);
  });

  test("hangs on a web of constant length while swinging, flies free between", () => {
    let swinging = 0;
    let free = 0;
    for (const swing of hero.swings) {
      const lengths = samples
        .map((t) => heroAt(hero, t))
        .filter((s) => s.web && s.web === swing.anchor)
        .map((s) => dist(s.pos, swing.anchor));
      if (!lengths.length) continue;
      expect(Math.max(...lengths) - Math.min(...lengths)).toBeLessThan(1e-6);
    }
    for (const t of samples) {
      if (heroAt(hero, t).web) swinging++;
      else free++;
    }
    expect(swinging).toBeGreaterThan(free);
    expect(free).toBeGreaterThan(0);
  });

  test("stays well above the street and his body never enters a tower", () => {
    for (const t of samples) {
      const box = heroBox(heroAt(hero, t).pos);
      expect(box.z0).toBeGreaterThan(20);
      for (const b of towers) {
        const within = box.x1 > b.x0 && box.x0 < b.x1 && box.y1 > b.y0 && box.y0 < b.y1;
        if (within) expect(box.z0).toBeGreaterThan(b.z1);
      }
    }
  });

  test("never turns while hanging and is upright, ungripped-free and closed up at every catch", () => {
    for (const t of samples) {
      const pose = heroAt(hero, t);
      if (!pose.web) continue;
      expect(pose.pitch).toBe(0);
      expect(pose.roll).toBe(0);
      expect(pose.twist).toBe(0);
      expect(pose.spread).toBe(0);
      expect(pose.grip).toBe(1);
      expect(pose.shoot).toBeNull();
    }
    const whole = (angle: number) => {
      const turns = angle / (2 * Math.PI);
      return Math.abs(turns - Math.round(turns)) < 1e-3;
    };
    for (let i = 0; i < hero.swings.length; i++) {
      const end = hero.starts[i] + 1.5 + hero.flights[i];
      const pose = heroAt(hero, end - 1e-6);
      expect(whole(pose.pitch) && whole(pose.roll) && whole(pose.twist)).toBe(true);
      expect(pose.tuck).toBeLessThan(1e-3);
      expect(pose.spread).toBeLessThan(1e-3);
      expect(pose.grip).toBeGreaterThan(0.999);
    }
  });

  test("goes through every trick: flips both ways, corkscrews, spins, stars and upside down", () => {
    const seen = new Set<string>();
    for (const t of samples) {
      const pose = heroAt(hero, t);
      if (pose.pitch > 3) seen.add("front");
      if (pose.pitch < -3) seen.add("back");
      if (Math.abs(pose.roll) > 3) seen.add("corkscrew");
      if (Math.abs(pose.twist) > 3) seen.add("spin");
      if (pose.spread > 0.8) seen.add("star");
      if (pose.pitch > 3 && pose.pitch < 3.3 && pose.tuck < 0.1) seen.add("inverted");
    }
    expect([...seen].sort()).toEqual(["back", "corkscrew", "front", "inverted", "spin", "star"]);
  });

  test("every part of the pose moves smoothly from frame to frame", () => {
    const keys = ["pitch", "roll", "twist", "tuck", "spread", "grip"] as const;
    // Whole turns are the same pose: compare angles round the circle.
    const gap = (x: number, y: number) => {
      const d = Math.abs(x - y) % (Math.PI * 2);
      return Math.min(d, Math.PI * 2 - d);
    };
    for (const t of samples) {
      const a = heroAt(hero, t);
      const b = heroAt(hero, t + 1 / 60);
      for (const key of keys) expect(gap(a[key], b[key])).toBeLessThan(0.4);
      expect(dist(a.lean, b.lean)).toBeLessThan(0.25);
      expect(Math.hypot(...a.lean)).toBeCloseTo(1, 5);
    }
  });

  test("shoots the next web before catching it, growing to the anchor", () => {
    let shooting = 0;
    for (const t of samples) {
      const pose = heroAt(hero, t);
      if (!pose.shoot) continue;
      shooting++;
      expect(pose.web).toBeNull();
      expect(pose.shoot.grow).toBeGreaterThanOrEqual(0);
      expect(pose.shoot.grow).toBeLessThanOrEqual(1);
      expect(hero.swings.some((swing) => swing.anchor === pose.shoot?.anchor)).toBe(true);
    }
    expect(shooting).toBeGreaterThan(0);
  });

  test("faces the way it travels", () => {
    const { dir } = heroAt(hero, 0.3);
    expect(Math.hypot(dir[0], dir[1])).toBeCloseTo(1, 5);
  });
});
