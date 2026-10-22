import { directosHero, heroAt, heroCover } from "./hero";
import { type Light, parseLights } from "./lights";
import { boundsOf, SlotIndex } from "./order";
import { ROUTES } from "./routes";
import { P, type Scene } from "./scene";
import { poseAt, scheduleOf, sprites } from "./vehicles";

/**
 * The work the page needs from the scene before the city can move, done in
 * the scene's worker with the scene itself so the page never waits on it.
 */
export interface Prepared {
  /** The live lights, read out of the markup. */
  lights: Light[];
  /** Every building that can ever stand in front of a vehicle or Spider-Man. */
  occluders: number[];
}

const SAMPLES = 240;

export function prepare(scene: Scene): Prepared {
  const slots = new SlotIndex(scene.items);
  const kinds = sprites(P);
  const wanted = new Set<number>();
  for (const route of ROUTES) {
    // Helicopters fly over everything and are never covered.
    if (route.mode === "air") continue;
    const { period } = scheduleOf(route);
    const [along, across, height] = kinds[route.vehicle].size;
    for (let k = 0; k < SAMPLES; k++) {
      const pose = poseAt(route, 0, (period * k) / SAMPLES);
      const [hx, hy] =
        pose.heading === "+x" || pose.heading === "-x" ? [along, across] : [across, along];
      const box = {
        x0: pose.x - hx,
        x1: pose.x + hx,
        y0: pose.y - hy,
        y1: pose.y + hy,
        z0: pose.z,
        z1: pose.z + height,
      };
      const bounds = boundsOf(box, P);
      for (const index of slots.frontOf(bounds, slots.slotFor(box, bounds))) wanted.add(index);
    }
  }
  // Spider-Man's round is the same every lap: sample it finer than he moves.
  const hero = directosHero();
  const steps = Math.ceil(hero.period * 30);
  for (let k = 0; k < steps; k++) {
    for (const index of heroCover(heroAt(hero, (hero.period * k) / steps), slots, P).front)
      wanted.add(index);
  }
  return { lights: parseLights(scene.items.map((item) => item.svg)), occluders: [...wanted] };
}
