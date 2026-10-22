import { iso } from "./kit/iso-kit.ts";
import type { RegionId } from "./model";
import { REGION_RECTS } from "./plan";
import { P, VIEW } from "./scene";

/** A viewBox in the drawing's coordinates. */
export interface View {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const OVERVIEW: View = { x: 0, y: 0, w: VIEW.W, h: VIEW.H };

/** How tall each region's buildings get, so its view leaves room for them. */
const HEADROOM: Record<RegionId, number> = {
  fundacion: 60,
  directos: 175,
  shorts: 24,
  videos: 30,
  malecon: 60,
  stack: 52,
};

export function regionView(id: RegionId): View {
  const { x, y, w, d } = REGION_RECTS[id];
  const points = [
    [x, y, 0],
    [x + w, y, 0],
    [x, y + d, 0],
    [x + w, y + d, 0],
    [x, y, HEADROOM[id]],
    [x + w, y, HEADROOM[id]],
    [x, y + d, HEADROOM[id]],
  ].map((point) => iso(point as [number, number, number], P));
  const xs = points.map(([px]) => px);
  const ys = points.map(([, py]) => py);
  const pad = 40;
  const view = {
    x: Math.min(...xs) - pad,
    y: Math.min(...ys) - pad,
    w: Math.max(...xs) - Math.min(...xs) + pad * 2,
    h: Math.max(...ys) - Math.min(...ys) + pad * 2,
  };
  return clampView(view, view.w / view.h);
}

/** Grow a view to a given width/height ratio, keeping its centre. */
export function fitAspect(view: View, aspect: number): View {
  const cx = view.x + view.w / 2;
  const cy = view.y + view.h / 2;
  let { w, h } = view;
  if (w / h < aspect) w = h * aspect;
  else h = w / aspect;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

const MIN_SHARE = 1 / 8;

/** Keep a view of the given aspect inside the overview and within zoom limits. */
export function clampView(view: View, aspect: number): View {
  const fitted = fitAspect(view, aspect);
  // The whole city always fits: on a tall screen the overview is letterboxed.
  const maxW = OVERVIEW.w;
  const minW = OVERVIEW.w * MIN_SHARE;
  const w = Math.min(maxW, Math.max(minW, fitted.w));
  const h = w / aspect;
  const cx = fitted.x + fitted.w / 2;
  const cy = fitted.y + fitted.h / 2;
  const x = Math.min(OVERVIEW.x + OVERVIEW.w - w, Math.max(OVERVIEW.x, cx - w / 2));
  const y =
    h >= OVERVIEW.h
      ? OVERVIEW.y + (OVERVIEW.h - h) / 2
      : Math.min(OVERVIEW.y + OVERVIEW.h - h, Math.max(OVERVIEW.y, cy - h / 2));
  return { x, y, w, h };
}

/** Scale a view by `factor` about a point, so that point stays under the pointer. */
export function zoomAt(view: View, factor: number, [fx, fy]: [number, number]): View {
  return {
    x: fx - (fx - view.x) * factor,
    y: fy - (fy - view.y) * factor,
    w: view.w * factor,
    h: view.h * factor,
  };
}

/** Where a point of the drawing lands in the frame, in CSS pixels. */
export function toFrame(view: View, [width, height]: [number, number], [x, y]: [number, number]) {
  return [((x - view.x) * width) / view.w, ((y - view.y) * height) / view.h] as [number, number];
}

/** Where a region's title floats: over its centre, above its tallest buildings. */
export function labelAnchor(id: RegionId): [number, number] {
  const { x, y, w, d } = REGION_RECTS[id];
  return iso([x + w / 2, y + d / 2, HEADROOM[id] + 12], P);
}
