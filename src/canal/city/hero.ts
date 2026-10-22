import { ledgeOf } from "./build/tower";
import { iso, type Projection } from "./kit/iso-kit.ts";
import { type Box3, boundsOf, type SlotIndex } from "./order";
import { LOTS } from "./plan";

/**
 * Spider-Man's round of Directos, as a pure function of time.
 *
 * He goes round a loop of streets between the towers: two wide streets at
 * the front, where he is seen whole, and two alleys at the back, where the
 * towers hide him. Along each street he shoots a web to a roof edge, swings
 * under it like a pendulum (the web keeps its length) and lets go, flies a
 * short arc and catches the next roof. Corners are turned in the air,
 * through the crossing, never through a tower.
 */

export type P3 = [number, number, number];

export interface Swing {
  /** Where the web is stuck, on a roof edge. */
  anchor: P3;
  /** Horizontal offset from the anchor to the line he swings along. */
  side: [number, number];
  /** Direction of travel along the street. */
  dir: [number, number];
  rope: number;
  /** The street the swing belongs to, to turn corners between streets. */
  leg: number;
}

export interface HeroPath {
  swings: Swing[];
  corners: Array<[number, number]>;
  /** When each swing starts, and how long the flight after it lasts. */
  starts: number[];
  flights: number[];
  period: number;
}

export interface HeroPose {
  pos: P3;
  /** The anchor he hangs from, or null while flying free. */
  web: P3 | null;
  /** Unit direction of travel on the ground. */
  dir: [number, number];
  /** Unit vector along his body, feet to head, before any trick. */
  lean: P3;
  /** Trick angles in radians: zero while hanging, whole turns by the catch. */
  pitch: number;
  roll: number;
  twist: number;
  /** How tucked up, how spread like a star, and how tight the web hand grips, 0 to 1. */
  tuck: number;
  spread: number;
  grip: number;
  /** The next web leaving his hand, growing towards its anchor. */
  shoot: { anchor: P3; grow: number } | null;
}

/**
 * His beat: the two streets along the district's lit faces, the front one
 * and the east one, out and back. Nothing taller stands between them and the
 * viewer; the inner streets are canyons the towers hide.
 */
const LOOP: Array<[number, number]> = [
  [-287.5, -50],
  [50, -50],
  [50, -287.5],
  [50, -50],
];
const STRIDE = 60;
/** Half the swing's angle: the web sweeps from -THETA to +THETA. */
const THETA = 0.6;
/** Share of the gap between anchors covered hanging; the rest is flight. */
const SPAN = 0.7;
const SWING_TIME = 1.5;
/** Free flight goes at about the speed he leaves a swing with. */
const FLIGHT_SPEED = 38;
const FLIGHT_MIN = 0.4;
const FLIGHT_LIFT = 14;

function towerAt(towers: Box3[], x: number, y: number) {
  return towers.find((b) => x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1);
}

/**
 * How much bigger than life he is drawn. The city is not to scale (a van is
 * three units tall, a floor four), and at true size he is lost among the lit
 * windows; at this size he reads as a figure from the Directos view.
 */
export const HERO_SCALE = 1.45;

/** The space his body takes round `pos`, his hips: about ten units tall. */
export function heroBox([x, y, z]: P3): Box3 {
  const s = HERO_SCALE;
  return {
    x0: x - 1.6 * s,
    x1: x + 1.6 * s,
    y0: y - 1.6 * s,
    y1: y + 1.6 * s,
    z0: z - 3.8 * s,
    z1: z + 3.6 * s,
  };
}

/**
 * His place in the painter's order, from his body, and the buildings in front
 * of him or of his web, whose copies are drawn over both.
 */
export function heroCover(pose: HeroPose, slots: SlotIndex, P: Projection) {
  const box = heroBox(pose.pos);
  const bounds = boundsOf(box, P);
  const slot = slots.slotFor(box, bounds);
  let reach = bounds;
  const target = pose.web ?? pose.shoot?.anchor;
  if (target) {
    const [ax, ay] = iso(target, P);
    reach = {
      x0: Math.min(bounds.x0, ax - 1),
      y0: Math.min(bounds.y0, ay - 1),
      x1: Math.max(bounds.x1, ax + 1),
      y1: Math.max(bounds.y1, ay + 1),
    };
  }
  return { box, bounds, reach, slot, front: slots.frontOf(reach, slot) };
}

/** His round of Directos, webbed to the first ledge of each tower. */
export function directosHero(): HeroPath {
  return heroPath(
    LOTS.filter((lot) => lot.kind === "torre" || lot.kind === "torre-directo").map(ledgeOf),
  );
}

/**
 * `ledges` are the faces a web sticks to, each up to the ledge on top: the
 * anchor is where a line across the street first meets one, just under it.
 */
export function heroPath(ledges: Box3[]): HeroPath {
  const swings: Swing[] = [];
  LOOP.forEach((from, leg) => {
    const to = LOOP[(leg + 1) % LOOP.length];
    const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
    const dir: [number, number] = [(to[0] - from[0]) / length, (to[1] - from[1]) / length];
    const normal: [number, number] = [-dir[1], dir[0]];
    const count = Math.max(1, Math.round(length / STRIDE));
    const gap = length / count;
    for (let k = 0; k < count; k++) {
      const s = (k + 0.5) * gap;
      const p: [number, number] = [from[0] + dir[0] * s, from[1] + dir[1] * s];
      // Alternate sides of the street, falling back to whichever has a tower.
      const sides = k % 2 ? [-1, 1] : [1, -1];
      let anchor: P3 | null = null;
      for (const side of sides) {
        for (let reach = 2; reach <= 26 && !anchor; reach++) {
          const x = p[0] + normal[0] * side * reach;
          const y = p[1] + normal[1] * side * reach;
          const tower = towerAt(ledges, x, y);
          if (tower) anchor = [x, y, tower.z1 - 1];
        }
        if (anchor) break;
      }
      if (!anchor) continue;
      const rope = Math.min((SPAN * gap) / 2 / Math.sin(THETA), anchor[2] - 40);
      swings.push({
        anchor,
        side: [p[0] - anchor[0], p[1] - anchor[1]],
        dir,
        rope,
        leg,
      });
    }
  });
  const starts: number[] = [];
  const flights: number[] = [];
  let clock = 0;
  swings.forEach((swing, index) => {
    starts.push(clock);
    const length = flightOf(swing, swings[(index + 1) % swings.length], LOOP).lengths.reduce(
      (a, b) => a + b,
      0,
    );
    flights.push(Math.max(FLIGHT_MIN, length / FLIGHT_SPEED));
    clock += SWING_TIME + flights[index];
  });
  return { swings, corners: LOOP, starts, flights, period: clock };
}

/** The ground track of the flight between two swings, through a corner if any. */
function flightOf(swing: Swing, next: Swing, corners: Array<[number, number]>) {
  const start = onSwing(swing, THETA);
  const end = onSwing(next, -THETA);
  const points: Array<[number, number]> = [[start[0], start[1]]];
  if (next.leg !== swing.leg) points.push(corners[next.leg]);
  points.push([end[0], end[1]]);
  const lengths = points
    .slice(1)
    .map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
  return { start, end, points, lengths };
}

/** Where he is on a swing at angle `angle` from the vertical. */
function onSwing(swing: Swing, angle: number): P3 {
  const [ax, ay, az] = swing.anchor;
  const along = Math.sin(angle) * swing.rope;
  return [
    ax + swing.side[0] + swing.dir[0] * along,
    ay + swing.side[1] + swing.dir[1] * along,
    az - Math.cos(angle) * swing.rope,
  ];
}

export function heroAt(path: HeroPath, t: number): HeroPose {
  const { swings, starts, flights, period } = path;
  const local = ((t % period) + period) % period;
  let index = swings.length - 1;
  while (index > 0 && starts[index] > local) index--;
  const swing = swings[index];
  const u = local - starts[index];
  if (u < SWING_TIME) {
    // A pendulum: slow at both ends, fastest at the bottom.
    const angle = -THETA * Math.cos((Math.PI * u) / SWING_TIME);
    const pos = onSwing(swing, angle);
    return {
      pos,
      web: swing.anchor,
      dir: swing.dir,
      lean: unit3(swing.anchor, pos),
      pitch: 0,
      roll: 0,
      twist: 0,
      // Legs kick out through the bottom of the swing.
      tuck: 0.3 * Math.sin((Math.PI * u) / SWING_TIME),
      spread: 0,
      grip: 1,
      shoot: null,
    };
  }
  // Free flight to the next catch, through the corner if the street turns.
  const next = swings[(index + 1) % swings.length];
  const { start, end, points, lengths } = flightOf(swing, next, path.corners);
  const total = lengths.reduce((a, b) => a + b, 0) || 1;
  const f = Math.min(1, (u - SWING_TIME) / flights[index]);
  let left = f * total;
  let i = 0;
  while (i < lengths.length - 1 && left > lengths[i]) left -= lengths[i++];
  const a = points[i];
  const b = points[i + 1];
  const len = lengths[i] || 1;
  const g = Math.min(1, left / len);
  const z = start[2] + (end[2] - start[2]) * f + 4 * FLIGHT_LIFT * f * (1 - f);
  // He turns to face the next street over the whole flight, not at the corner.
  const turn = Math.atan2(next.dir[1], next.dir[0]) - Math.atan2(swing.dir[1], swing.dir[0]);
  const wrapped = turn - Math.PI * 2 * Math.round(turn / (Math.PI * 2) - 1e-9);
  const heading = Math.atan2(swing.dir[1], swing.dir[0]) + wrapped * smooth(f);
  const dir: [number, number] = [Math.cos(heading), Math.sin(heading)];
  const pos: P3 = [a[0] + (b[0] - a[0]) * g, a[1] + (b[1] - a[1]) * g, z];
  // The body leans along the web he lets go of, glides, then lines up with the next.
  const glide = unit3([dir[0] * 0.7, dir[1] * 0.7, 0.7], [0, 0, 0]);
  const released = unit3(swing.anchor, start);
  const caught = unit3(next.anchor, end);
  const lean = blend3(blend3(released, glide, smooth(f / 0.4)), caught, smooth((f - 0.6) / 0.4));
  const trick = moves(TRICKS[index % TRICKS.length], f, flights[index]);
  return {
    pos,
    web: null,
    dir,
    lean,
    ...trick,
    grip: Math.min(1, Math.max(0, 1 - smooth(f / 0.18) + smooth((f - 0.82) / 0.18))),
    shoot: f > 0.55 ? { anchor: next.anchor, grow: smooth((f - 0.55) / 0.3) } : null,
  };
}

const smooth = (x: number) => {
  const k = Math.min(1, Math.max(0, x));
  return k * k * (3 - 2 * k);
};

function unit3(to: P3, from: P3): P3 {
  const v: P3 = [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
  const n = Math.hypot(...v) || 1;
  return [v[0] / n, v[1] / n, v[2] / n];
}

function blend3(a: P3, b: P3, k: number): P3 {
  return unit3(
    [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k],
    [0, 0, 0],
  );
}

/** The tricks he does in turn, one per flight, round and round. */
export const TRICKS = ["front", "corkscrew", "back", "star", "inverted", "spin"] as const;
type Trick = (typeof TRICKS)[number];

const TURN = Math.PI * 2;

/** One trick at progress `f` of a flight that lasts `seconds`: all zero at both ends. */
function moves(trick: Trick, f: number, seconds: number) {
  const ease = smooth(f);
  const bell = Math.sin(Math.PI * f);
  const turns = seconds > 1.3 ? 2 : 1;
  const zero = { pitch: 0, roll: 0, twist: 0, tuck: 0, spread: 0 };
  switch (trick) {
    case "front":
      return { ...zero, pitch: TURN * turns * ease, tuck: bell ** 0.6 };
    case "back":
      return { ...zero, pitch: -TURN * turns * ease, tuck: bell ** 0.6 };
    case "corkscrew":
      return { ...zero, roll: TURN * ease, tuck: 0.15 * bell };
    case "spin":
      return { ...zero, twist: TURN * ease, tuck: 0.35 * bell };
    case "star":
      return { ...zero, spread: smooth(bell * 1.6), pitch: 0.35 * bell };
    case "inverted": {
      // Flips over, hangs upside down for a beat with his legs split, and back.
      const hold = smooth(f / 0.3) * (1 - smooth((f - 0.7) / 0.3));
      return { ...zero, pitch: Math.PI * hold, spread: 0.35 * hold };
    }
  }
}
