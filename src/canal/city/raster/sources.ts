import { LEVELS, type Rect, svgDoc } from "./plan";
import { drawSource, loadSource, releaseSource, type Source } from "./source";

/**
 * SVG images of small things (a vehicle, a cabin, one building), decoded on
 * request and kept, each with a bitmap at the level last asked for.
 *
 * Drawing an SVG image replays its whole picture on the GPU, so it is done
 * once per thing and level, in one scratch canvas, and kept as an
 * ImageBitmap; every frame after that only draws textures. While a new
 * level is on its way the old bitmap stands in, scaled.
 */

export interface Bitmap {
  image: ImageBitmap;
  rect: Rect;
  level: number;
}

interface Entry extends Bitmap {
  used: number;
}

export class SourceSet {
  /** Called when a decoded image or a new bitmap is ready to draw. */
  onReady = () => {};
  private readonly css: string;
  private readonly defs: string;
  private readonly limit: number;
  private readonly sources = new Map<string, Source>();
  private readonly loading = new Map<string, Promise<Source | null>>();
  private readonly bitmaps = new Map<string, Entry>();
  private readonly making = new Set<string>();
  private readonly scratch = document.createElement("canvas");
  private clock = 0;
  private dead = false;

  constructor(css: string, defs: string, limit = 160) {
    this.css = css;
    this.defs = defs;
    this.limit = limit;
  }

  load(key: string, body: string, rect: Rect): Promise<Source | null> {
    const known = this.sources.get(key);
    if (known) return Promise.resolve(known);
    let pending = this.loading.get(key);
    if (!pending) {
      const markup = svgDoc({ css: this.css, defs: this.defs, body, rect });
      pending = loadSource(markup, rect).then(
        (source) => {
          if (this.dead) {
            releaseSource(source);
            return null;
          }
          this.sources.set(key, source);
          this.onReady();
          return source;
        },
        () => null,
      );
      this.loading.set(key, pending);
    }
    return pending;
  }

  has(key: string) {
    return this.sources.has(key);
  }

  /**
   * The thing as a bitmap at a level. Until that one is made, the bitmap of
   * another level (or null, before the first) is returned.
   */
  bitmap(key: string, level: number): Bitmap | null {
    const cached = this.bitmaps.get(key);
    if (cached) cached.used = ++this.clock;
    if (cached?.level === level) return cached;
    const source = this.sources.get(key);
    if (source && !this.making.has(key)) void this.raster(key, source, level);
    return cached ?? null;
  }

  private async raster(key: string, source: Source, level: number) {
    this.making.add(key);
    const s = LEVELS[level];
    const w = Math.max(1, Math.ceil(source.rect.w * s));
    const h = Math.max(1, Math.ceil(source.rect.h * s));
    if (this.scratch.width < w) this.scratch.width = w;
    if (this.scratch.height < h) this.scratch.height = h;
    const ctx = this.scratch.getContext("2d") as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, w, h);
    drawSource(ctx, source, source.rect, source.rect, s);
    // The snapshot is taken now; the bitmap arrives later.
    const image = await createImageBitmap(this.scratch, 0, 0, w, h);
    this.making.delete(key);
    if (this.dead) {
      image.close();
      return;
    }
    const old = this.bitmaps.get(key);
    if (old) old.image.close();
    else this.evict();
    this.bitmaps.set(key, { image, rect: source.rect, level, used: ++this.clock });
    this.onReady();
  }

  /** Over the limit, drop the least recently used bitmap. */
  private evict() {
    if (this.bitmaps.size < this.limit) return;
    let oldest: [string, Entry] | null = null;
    for (const pair of this.bitmaps) if (!oldest || pair[1].used < oldest[1].used) oldest = pair;
    if (!oldest) return;
    oldest[1].image.close();
    this.bitmaps.delete(oldest[0]);
  }

  destroy() {
    this.dead = true;
    for (const source of this.sources.values()) releaseSource(source);
    for (const { image } of this.bitmaps.values()) image.close();
    this.sources.clear();
    this.bitmaps.clear();
    this.scratch.width = 0;
  }
}

/**
 * A small bitmap of a few bitmaps stacked over a rect: the hovered building,
 * lit, with what stands in front of it. It is incomplete while any layer is
 * missing or not yet at the level, so the caller paints it again later.
 */
export function paintPatch(
  canvas: HTMLCanvasElement,
  rect: Rect,
  level: number,
  layers: Array<{ bitmap: Bitmap | null; filter?: string; atop?: boolean }>,
): boolean {
  const s = LEVELS[level];
  canvas.width = Math.max(1, Math.ceil(rect.w * s));
  canvas.height = Math.max(1, Math.ceil(rect.h * s));
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  let complete = true;
  for (const { bitmap, filter, atop } of layers) {
    if (!bitmap) {
      complete = false;
      continue;
    }
    if (bitmap.level !== level) complete = false;
    ctx.filter = filter ?? "none";
    ctx.globalCompositeOperation = atop ? "source-atop" : "source-over";
    const { x, y, w, h } = bitmap.rect;
    ctx.drawImage(bitmap.image, (x - rect.x) * s, (y - rect.y) * s, w * s, h * s);
  }
  ctx.filter = "none";
  ctx.globalCompositeOperation = "source-over";
  return complete;
}
