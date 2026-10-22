import { depthOf, iso, type Projection } from "./kit/iso-kit.ts";

/**
 * Painter's order for a city, measured rather than tuned.
 *
 * Sorting by the centre of each footprint fails on a city: a long warehouse's
 * centre can sit "behind" a van that is plainly in front of its near face, and
 * a guideway on posts is above the street it spans. For boxes that do not
 * intersect there is an exact rule instead: the camera looks from +x +y and
 * from above, so a box is in front of another when it lies entirely beyond it
 * along +x, +y or +z. Only pairs whose pictures overlap on screen need an
 * order at all; a topological sort over those pairs gives one that satisfies
 * every one of them, with the footprint depth deciding between free items.
 */

export interface Box3 {
  x0: number;
  y0: number;
  z0: number;
  x1: number;
  y1: number;
  z1: number;
}

export interface Bounds {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface Placed {
  key: string;
  box: Box3;
  bounds: Bounds;
}

const EPS = 1e-6;

/** True when `a` must be painted before `b`. */
export function behind(a: Box3, b: Box3): boolean {
  return a.x1 <= b.x0 + EPS || a.y1 <= b.y0 + EPS || a.z1 <= b.z0 + EPS;
}

export function boundsOf(box: Box3, P: Projection): Bounds {
  const out: Bounds = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  for (const x of [box.x0, box.x1]) {
    for (const y of [box.y0, box.y1]) {
      for (const z of [box.z0, box.z1]) {
        const [sx, sy] = iso([x, y, z], P);
        out.x0 = Math.min(out.x0, sx);
        out.y0 = Math.min(out.y0, sy);
        out.x1 = Math.max(out.x1, sx);
        out.y1 = Math.max(out.y1, sy);
      }
    }
  }
  return out;
}

const touches = (a: Bounds, b: Bounds) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

/** Uniform grid over screen space, so overlap queries only look at neighbours. */
class Grid {
  private cells = new Map<string, number[]>();
  private readonly size: number;

  constructor(size: number, bounds: Bounds[]) {
    this.size = size;
    bounds.forEach((b, index) => {
      for (const key of this.keysOf(b)) {
        const list = this.cells.get(key);
        if (list) list.push(index);
        else this.cells.set(key, [index]);
      }
    });
  }

  private *keysOf(b: Bounds) {
    for (let i = Math.floor(b.x0 / this.size); i <= Math.floor(b.x1 / this.size); i++) {
      for (let j = Math.floor(b.y0 / this.size); j <= Math.floor(b.y1 / this.size); j++)
        yield `${i},${j}`;
    }
  }

  near(b: Bounds): Set<number> {
    const out = new Set<number>();
    for (const key of this.keysOf(b)) for (const index of this.cells.get(key) ?? []) out.add(index);
    return out;
  }
}

const CELL = 48;

function footprintDepth(box: Box3, P: Projection) {
  return depthOf([(box.x0 + box.x1) / 2, (box.y0 + box.y1) / 2, box.z0], P);
}

export function paintOrder<T extends Placed>(items: T[], P?: Projection): T[] {
  const n = items.length;
  const key = items.map((item) =>
    P ? footprintDepth(item.box, P) : item.box.x0 + item.box.x1 + item.box.y0 + item.box.y1,
  );
  const grid = new Grid(
    CELL,
    items.map((item) => item.bounds),
  );
  const after: number[][] = Array.from({ length: n }, () => []);
  const waiting = new Array<number>(n).fill(0);

  for (let a = 0; a < n; a++) {
    for (const b of grid.near(items[a].bounds)) {
      if (b <= a || !touches(items[a].bounds, items[b].bounds)) continue;
      const ab = behind(items[a].box, items[b].box);
      const ba = behind(items[b].box, items[a].box);
      if (ab && !ba) {
        after[a].push(b);
        waiting[b]++;
      } else if (ba && !ab) {
        after[b].push(a);
        waiting[a]++;
      }
    }
  }

  // Kahn's algorithm, always releasing the farthest ready item first.
  const heap: number[] = [];
  const push = (index: number) => {
    heap.push(index);
    let at = heap.length - 1;
    while (at > 0) {
      const parent = (at - 1) >> 1;
      if (key[heap[parent]] <= key[heap[at]]) break;
      [heap[parent], heap[at]] = [heap[at], heap[parent]];
      at = parent;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop() as number;
    if (heap.length) {
      heap[0] = last;
      let at = 0;
      for (;;) {
        const l = at * 2 + 1;
        const r = l + 1;
        let low = at;
        if (l < heap.length && key[heap[l]] < key[heap[low]]) low = l;
        if (r < heap.length && key[heap[r]] < key[heap[low]]) low = r;
        if (low === at) break;
        [heap[low], heap[at]] = [heap[at], heap[low]];
        at = low;
      }
    }
    return top;
  };

  for (let index = 0; index < n; index++) if (waiting[index] === 0) push(index);
  const out: T[] = [];
  const done = new Array<boolean>(n).fill(false);
  while (out.length < n) {
    if (!heap.length) {
      // A cycle means two items interlock; release the farthest one and carry on.
      let pick = -1;
      for (let index = 0; index < n; index++)
        if (!done[index] && (pick < 0 || key[index] < key[pick])) pick = index;
      waiting[pick] = 0;
      push(pick);
    }
    const index = pop();
    if (done[index]) continue;
    done[index] = true;
    out.push(items[index]);
    for (const next of after[index]) if (--waiting[next] === 0 && !done[next]) push(next);
  }
  return out;
}

/**
 * Where a moving box belongs in a settled order: right after the last item
 * that is behind it among the items it overlaps on screen.
 */
export class SlotIndex {
  private readonly grid: Grid;
  private readonly items: Placed[];

  constructor(items: Placed[]) {
    this.items = items;
    this.grid = new Grid(
      CELL,
      items.map((item) => item.bounds),
    );
  }

  slotFor(box: Box3, bounds: Bounds): number {
    let slot = 0;
    for (const index of this.grid.near(bounds)) {
      const item = this.items[index];
      if (!touches(item.bounds, bounds)) continue;
      if (behind(item.box, box) && !behind(box, item.box)) slot = Math.max(slot, index + 1);
    }
    return slot;
  }

  /**
   * The items painted after a moving box that its picture overlaps: drawn
   * again over the box, they hide it exactly where the settled order would.
   */
  frontOf(bounds: Bounds, slot: number): number[] {
    const out: number[] = [];
    for (const index of this.grid.near(bounds)) {
      if (index >= slot && touches(this.items[index].bounds, bounds)) out.push(index);
    }
    return out.sort((a, b) => a - b);
  }
}
