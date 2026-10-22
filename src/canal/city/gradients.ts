import type { HaloColor } from "./lights";

/**
 * Every gradient of the city, as data: the SVG images of the city take them
 * as <defs>, and the canvas builds the same ramps for the lights it draws.
 */

/** [offset, colour, opacity] */
export type Stop = [number, string, number];

const POOLS: Record<string, Stop[]> = {
  "city-pool-amber": [
    [0, "#ffe2c6", 0.32],
    [0.45, "#f2b892", 0.1],
    [1, "#f2b892", 0],
  ],
  "city-pool-cool": [
    [0, "#dfe7ff", 0.4],
    [0.5, "#b9c6ff", 0.12],
    [1, "#b9c6ff", 0],
  ],
  "city-pool-red": [
    [0, "#ff2a1f", 0.6],
    [0.5, "#e63329", 0.2],
    [1, "#e63329", 0],
  ],
};

export const HALO_STOPS: Record<HaloColor, Stop[]> = {
  amber: [
    [0, "#fff0e0", 0.85],
    [0.25, "#f5c7a0", 0.28],
    [1, "#f5c7a0", 0],
  ],
  red: [
    [0, "#ffb0a8", 0.95],
    [0.3, "#ff2a1f", 0.5],
    [1, "#e63329", 0],
  ],
  white: [
    [0, "#ffffff", 0.9],
    [0.3, "#cfd8ff", 0.25],
    [1, "#cfd8ff", 0],
  ],
};

const WASH: Stop[] = [
  [0, "#ff2a1f", 0],
  [1, "#ff2a1f", 0.2],
];

export const BEAM_STOPS: Stop[] = [
  [0, "#fff4dc", 0.55],
  [0.5, "#ffd9b8", 0.14],
  [1, "#ffd9b8", 0],
];

const stops = (list: Stop[]) =>
  list
    .map(
      ([offset, color, opacity]) =>
        `<stop offset="${offset}" stop-color="${color}" stop-opacity="${opacity}"/>`,
    )
    .join("");

/** The gradients as SVG <defs> content. */
export function defsSvg(): string {
  const radial = (id: string, list: Stop[]) =>
    `<radialGradient id="${id}">${stops(list)}</radialGradient>`;
  return (
    Object.entries(POOLS)
      .map(([id, list]) => radial(id, list))
      .join("") +
    Object.entries(HALO_STOPS)
      .map(([color, list]) => radial(`city-halo-${color}`, list))
      .join("") +
    `<linearGradient id="city-wash" x1="0" y1="0" x2="0" y2="1">${stops(WASH)}</linearGradient>`
  );
}

/** A CSS colour for a stop, for canvas gradients. */
export function rgba([, color, opacity]: Stop): string {
  const n = Number.parseInt(color.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${opacity})`;
}
