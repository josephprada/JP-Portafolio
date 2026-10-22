import { LEVELS, type Rect, TILE, type Tile, tileKey, tilesIn } from "./plan";
import { drawSource, type Source } from "./source";

/**
 * The city as a pyramid of bitmap tiles, rastered on demand from the chunk
 * images and kept in a small cache.
 *
 * Every tile is rastered in one scratch canvas and kept as an ImageBitmap: an
 * immutable texture that goes to the GPU once. Keeping tiles as canvases
 * instead runs past the browser's budget of accelerated canvases, and the
 * ones over it are uploaded again on every frame they are drawn.
 *
 * Each tile is drawn one device pixel wider on every side than the area it
 * owns, onto the sea's colour, so neighbours overlap with identical opaque
 * pixels and no seam shows however the camera scales them. The coarsest level
 * covers the whole city in a couple of tiles and is made first, so there is
 * always something to show while sharper tiles arrive.
 */

const SEA = "#05080d";
const SIDE = TILE + 2;

interface Entry {
  image: ImageBitmap;
  level: number;
  used: number;
}

export class Pyramid {
  private readonly sources: Source[];
  private readonly size: { w: number; h: number };
  private readonly limit: number;
  private readonly ready = new Map<string, Entry>();
  /** Tiles whose bitmap is on its way. */
  private readonly making = new Set<string>();
  private readonly scratch = document.createElement("canvas");
  private queue: Tile[] = [];
  private clock = 0;
  private dead = false;

  constructor(sources: Source[], size: { w: number; h: number }, limit = 96) {
    this.sources = sources;
    this.size = size;
    this.limit = limit;
    this.scratch.width = SIDE;
    this.scratch.height = SIDE;
  }

  /**
   * Raster every tile of the coarsest level, the fallback for all others.
   * It is the first paint of every chunk image, so it goes a few chunks per
   * frame within a budget rather than in one long task.
   */
  async primeBase(budget = 8) {
    const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
    const ctx = this.scratch.getContext("2d") as CanvasRenderingContext2D;
    for (const tile of tilesIn({ x: 0, y: 0, ...this.size }, 0, this.size)) {
      const { area, s } = this.areaOf(tile);
      ctx.fillStyle = SEA;
      ctx.fillRect(0, 0, SIDE, SIDE);
      let since = performance.now();
      for (const source of this.sources) {
        drawSource(ctx, source, area, area, s);
        if (performance.now() - since > budget) {
          await nextFrame();
          since = performance.now();
        }
      }
      const image = await createImageBitmap(this.scratch);
      this.ready.set(tileKey(tile), { image, level: 0, used: this.clock });
    }
  }

  /** The area a tile is rastered over: its own, one pixel wider all round. */
  private areaOf(tile: Tile) {
    const s = LEVELS[tile.level];
    const m = 1 / s;
    const area = {
      x: tile.rect.x - m,
      y: tile.rect.y - m,
      w: tile.rect.w + 2 * m,
      h: tile.rect.h + 2 * m,
    };
    return { area, s };
  }

  get pending() {
    return this.queue.length > 0 || this.making.size > 0;
  }

  /** Ask for the tiles a view needs at a level; the nearest the centre go first. */
  want(view: Rect, level: number) {
    // A new view replaces the old wishes: tiles the camera has left are not made.
    this.queue = tilesIn(view, level, this.size).filter((t) => !this.has(tileKey(t)));
  }

  /**
   * Raster a few queued tiles, until the deadline (a performance.now() time).
   * The real cost lands on the GPU after this returns, out of sight of the
   * clock, so the count is capped too.
   */
  work(deadline: number, most = 2) {
    let made = 0;
    while (this.queue.length && made < most && performance.now() < deadline) {
      const tile = this.queue.shift() as Tile;
      if (this.has(tileKey(tile))) continue;
      void this.raster(tile);
      made++;
    }
  }

  /**
   * Draw a view into a context already transformed to drawing units. Each
   * pixel is drawn once: a tile of the wanted level where it is ready, else
   * the matching part of its nearest ready ancestor, softer but in place.
   */
  draw(ctx: CanvasRenderingContext2D, view: Rect, level: number) {
    this.clock++;
    for (const tile of tilesIn(view, level, this.size)) {
      for (let up = 0; up <= tile.level; up++) {
        const at = tile.level - up;
        const tx = tile.tx >> up;
        const ty = tile.ty >> up;
        const entry = this.ready.get(tileKey({ level: at, tx, ty }));
        if (!entry) continue;
        entry.used = this.clock;
        const s = LEVELS[at];
        const { x, y, w, h } = tile.rect;
        if (up === 0) {
          const m = 1 / s;
          ctx.drawImage(entry.image, x - m, y - m, w + 2 * m, h + 2 * m);
        } else {
          // The ancestor's pixels over this tile; its image has a one-pixel rim.
          const units = TILE / s;
          ctx.drawImage(
            entry.image,
            (x - tx * units) * s + 1,
            (y - ty * units) * s + 1,
            w * s,
            h * s,
            x,
            y,
            w,
            h,
          );
        }
        break;
      }
    }
  }

  private has(key: string) {
    return this.ready.has(key) || this.making.has(key);
  }

  private async raster(tile: Tile) {
    const key = tileKey(tile);
    this.making.add(key);
    const { area, s } = this.areaOf(tile);
    const ctx = this.scratch.getContext("2d") as CanvasRenderingContext2D;
    ctx.fillStyle = SEA;
    ctx.fillRect(0, 0, SIDE, SIDE);
    for (const source of this.sources) drawSource(ctx, source, area, area, s);
    // The snapshot is taken now; the bitmap arrives later.
    const image = await createImageBitmap(this.scratch);
    this.making.delete(key);
    if (this.dead) {
      image.close();
      return;
    }
    this.evict();
    this.ready.set(key, { image, level: tile.level, used: this.clock });
  }

  /** Over the limit, drop the least recently drawn tile; the base stays. */
  private evict() {
    if (this.ready.size < this.limit) return;
    let oldest: [string, Entry] | null = null;
    for (const pair of this.ready) {
      if (pair[1].level === 0) continue;
      if (!oldest || pair[1].used < oldest[1].used) oldest = pair;
    }
    if (!oldest) return;
    oldest[1].image.close();
    this.ready.delete(oldest[0]);
  }

  destroy() {
    this.dead = true;
    for (const { image } of this.ready.values()) image.close();
    this.ready.clear();
    this.queue = [];
    this.scratch.width = 0;
  }
}
