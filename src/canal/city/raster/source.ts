import type { Rect } from "./plan";

/**
 * A decoded SVG image over a rect of the drawing, one image pixel per unit.
 * Drawing it into a canvas at any scale is a vector raster, so it is sharp
 * at every level; once decoded, each draw only costs the pixels it fills.
 */
export interface Source {
  rect: Rect;
  img: HTMLImageElement;
  url: string;
}

export async function loadSource(markup: string, rect: Rect): Promise<Source> {
  const url = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml" }));
  const img = new Image();
  img.src = url;
  await img.decode();
  return { rect, img, url };
}

export const releaseSource = (source: Source) => URL.revokeObjectURL(source.url);

/** Draw the part of a source inside `area` (units) at `s` pixels per unit. */
export function drawSource(
  ctx: CanvasRenderingContext2D,
  source: Source,
  area: Rect,
  origin: { x: number; y: number },
  s: number,
) {
  const { rect } = source;
  const x0 = Math.max(area.x, rect.x);
  const y0 = Math.max(area.y, rect.y);
  const x1 = Math.min(area.x + area.w, rect.x + rect.w);
  const y1 = Math.min(area.y + area.h, rect.y + rect.h);
  if (x1 <= x0 || y1 <= y0) return;
  ctx.drawImage(
    source.img,
    x0 - rect.x,
    y0 - rect.y,
    x1 - x0,
    y1 - y0,
    (x0 - origin.x) * s,
    (y0 - origin.y) * s,
    (x1 - x0) * s,
    (y1 - y0) * s,
  );
}
