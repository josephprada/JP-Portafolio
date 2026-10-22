import type { Bounds } from "../order";

/**
 * The geometry of the raster city, as pure functions.
 *
 * The city is drawn once by the browser's own SVG renderer, into images, and
 * from then on only bitmaps are composited: a frame costs the same however
 * many buildings there are. Like a web map, the bitmaps form a pyramid of
 * levels, each twice as sharp as the one before, cut in square tiles that are
 * rastered only where the camera looks.
 */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Device pixels per drawing unit at each level of the pyramid. */
export const LEVELS = [0.25, 0.5, 1, 2, 4, 8];
/** Side of a tile, in device pixels. */
export const TILE = 512;

/**
 * A standalone SVG over one rect of the drawing, one pixel per unit. The
 * classes on the root let the page's stylesheet apply as it does on the page;
 * the styles go in CDATA, since CSS may hold characters XML does not allow.
 */
export function svgDoc({
  css,
  defs,
  body,
  rect,
}: {
  css: string;
  defs: string;
  body: string;
  rect: Rect;
}): string {
  const { x, y, w, h } = rect;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" class="iso city iso-svg" data-theme="dark"` +
    ` viewBox="${x} ${y} ${w} ${h}" width="${w}" height="${h}" style="width:${w}px;height:${h}px">` +
    `<style><![CDATA[${css}]]></style><defs>${defs}</defs>${body}</svg>`
  );
}

export interface Chunk {
  rect: Rect;
  /** Items whose picture touches the chunk, in paint order. */
  indices: number[];
}

/**
 * The drawing split in a grid of chunks, each its own SVG image. Drawing an
 * SVG image replays its whole picture, however little of it lands in the
 * target, so small chunks keep a tile's cost in line with its area.
 */
export function chunksOf(
  items: Array<{ bounds: Bounds }>,
  size: { w: number; h: number },
  cols: number,
  rows: number,
  pad: number,
): Chunk[] {
  const chunks: Chunk[] = [];
  // Inner edges on multiples of 1 / LEVELS[0] units land on whole pixels at
  // every level; the outer ones are the drawing's own edges.
  const step = 1 / LEVELS[0];
  const edge = (index: number, count: number, length: number) =>
    index === count ? length : Math.round((index * length) / count / step) * step;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = edge(col, cols, size.w);
      const y = edge(row, rows, size.h);
      const rect = { x, y, w: edge(col + 1, cols, size.w) - x, h: edge(row + 1, rows, size.h) - y };
      const indices: number[] = [];
      items.forEach(({ bounds }, index) => {
        if (
          bounds.x0 - pad < rect.x + rect.w &&
          bounds.x1 + pad > rect.x &&
          bounds.y0 - pad < rect.y + rect.h &&
          bounds.y1 + pad > rect.y
        )
          indices.push(index);
      });
      chunks.push({ rect, indices });
    }
  }
  return chunks;
}

/**
 * The coarsest level sharp enough for `need` device pixels per unit. A tenth
 * of upscaling is invisible and saves a level's worth of tiles.
 */
export function levelFor(need: number): number {
  const index = LEVELS.findIndex((s) => s >= need * 0.9);
  return index < 0 ? LEVELS.length - 1 : index;
}

export interface Tile {
  level: number;
  tx: number;
  ty: number;
  /** The drawing units the tile covers. */
  rect: Rect;
}

export const tileKey = ({ level, tx, ty }: Pick<Tile, "level" | "tx" | "ty">) =>
  `${level}:${tx}:${ty}`;

/** Tiles of a level covering a rect of the drawing, nearest its centre first. */
export function tilesIn(view: Rect, level: number, size: { w: number; h: number }): Tile[] {
  const units = TILE / LEVELS[level];
  const maxX = Math.ceil(size.w / units) - 1;
  const maxY = Math.ceil(size.h / units) - 1;
  const x0 = Math.max(0, Math.floor(view.x / units));
  const y0 = Math.max(0, Math.floor(view.y / units));
  const x1 = Math.min(maxX, Math.ceil((view.x + view.w) / units) - 1);
  const y1 = Math.min(maxY, Math.ceil((view.y + view.h) / units) - 1);
  const cx = view.x + view.w / 2;
  const cy = view.y + view.h / 2;
  const tiles: Tile[] = [];
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++)
      tiles.push({ level, tx, ty, rect: { x: tx * units, y: ty * units, w: units, h: units } });
  }
  const distance = (t: Tile) => (t.rect.x + units / 2 - cx) ** 2 + (t.rect.y + units / 2 - cy) ** 2;
  return tiles.sort((a, b) => distance(a) - distance(b));
}

/** Markup cut into its top-level elements; groups stay whole. */
export function splitTopLevel(markup: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (const match of markup.matchAll(/<(\/?)[a-zA-Z][^>]*?(\/?)>/g)) {
    const [tag, closing, selfClosing] = match;
    const at = match.index ?? 0;
    if (closing) depth--;
    else if (!selfClosing) {
      if (depth === 0) start = at;
      depth++;
      continue;
    } else if (depth === 0) {
      parts.push(tag);
      continue;
    }
    if (depth === 0) parts.push(markup.slice(start, at + tag.length));
  }
  return parts;
}

const NUMBER = /-?\d*\.?\d+(?:e-?\d+)?/gi;

/**
 * The drawing-space bounds of some markup, read from its coordinates, or
 * null when it holds anything this reader cannot place exactly (transforms,
 * arcs, relative or curved path commands): such markup belongs everywhere.
 */
export function boundsOfMarkup(markup: string): Bounds | null {
  if (/\stransform="/.test(markup)) return null;
  const b: Bounds = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  const add = (x: number, y: number, rx = 0, ry = rx) => {
    b.x0 = Math.min(b.x0, x - rx);
    b.y0 = Math.min(b.y0, y - ry);
    b.x1 = Math.max(b.x1, x + rx);
    b.y1 = Math.max(b.y1, y + ry);
  };
  for (const [, d] of markup.matchAll(/\sd="([^"]*)"/g)) {
    if (/[^MLZ\d\s.,eE-]/.test(d)) return null;
    const values = (d.match(NUMBER) ?? []).map(Number);
    for (let i = 0; i + 1 < values.length; i += 2) add(values[i], values[i + 1]);
  }
  for (const [, tag, attrs] of markup.matchAll(
    /<(circle|ellipse|rect|text|polygon|polyline|line)\b([^>]*)>/g,
  )) {
    const a = (name: string) => Number(attrs.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1] ?? 0);
    if (tag === "circle") add(a("cx"), a("cy"), a("r"));
    else if (tag === "ellipse") add(a("cx"), a("cy"), a("rx"), a("ry"));
    else return null;
  }
  return Number.isFinite(b.x0) ? b : null;
}
