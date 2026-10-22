import { describe, expect, test } from "bun:test";
import { heroFigure } from "./figures";
import { directosHero, heroAt } from "./hero";
import { iso } from "./kit/iso-kit.ts";
import { P } from "./scene";

const hero = directosHero();

describe("heroFigure", () => {
  test("hanging, his head is toward the web and his hand nearer to it than his head", () => {
    for (let k = 0; k < 200; k++) {
      const pose = heroAt(hero, (hero.period * k) / 200);
      if (!pose.web) continue;
      const figure = heroFigure(pose, P);
      const [ax, ay] = iso(pose.web, P);
      const [hipX, hipY] = iso(pose.pos, P);
      const far = (p: [number, number]) => Math.hypot(p[0] - ax, p[1] - ay);
      expect(far(figure.head)).toBeLessThan(far([hipX, hipY]));
      expect(far(figure.hand)).toBeLessThan(far(figure.head));
    }
  });

  test("is about ten units tall, whatever the pose", () => {
    const unit = Math.hypot(iso([0, 0, 1], P)[1] - iso([0, 0, 0], P)[1]);
    for (let k = 0; k < 200; k++) {
      const figure = heroFigure(heroAt(hero, (hero.period * k) / 200), P);
      const points = figure.limbs.flatMap((limb) => limb.points);
      const ys = points.map(([, y]) => y);
      const xs = points.map(([x]) => x);
      const extent = Math.max(Math.max(...ys) - Math.min(...ys), Math.max(...xs) - Math.min(...xs));
      expect(extent).toBeGreaterThan(unit * 3.5);
      expect(extent).toBeLessThan(unit * 17);
    }
  });
});
