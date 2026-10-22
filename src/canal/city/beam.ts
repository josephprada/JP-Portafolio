import { LIGHTHOUSE } from "./build/regions";
import { axisVector, iso } from "./kit/iso-kit.ts";
import { P } from "./scene";

/**
 * The lighthouse beam turns in the horizontal plane at the lamp's height. A
 * turn in a plane, seen through the camera, is one affine map of the screen,
 * so the wedge is drawn once and the page only sets a CSS matrix on its own
 * compositor layer: the beam sweeps without any repaint.
 */

export const BEAM = { reach: 150, spread: 0.13 };

/** A 2D affine map [a, b, c, d, e, f], as in SVG and CSS matrix(). */
export type Affine = [number, number, number, number, number, number];

export const apply = ([a, b, c, d, e, f]: Affine, [x, y]: [number, number]): [number, number] => [
  a * x + c * y + e,
  b * x + d * y + f,
];

const ex = axisVector(P, [1, 0, 0]);
const ey = axisVector(P, [0, 1, 0]);
const centre = iso([LIGHTHOUSE.x, LIGHTHOUSE.y, LIGHTHOUSE.lamp], P);

/** Plane coordinates to the screen: unit circle to the floor ellipse at the lamp. */
export const PLANE: Affine = [ex[0], ex[1], ey[0], ey[1], centre[0], centre[1]];

/** The screen map that turns the drawn beam by `angle` about the lamp. */
export function beamTurn(angle: number): Affine {
  // M R M⁻¹ about the lamp, where M = [ex ey].
  const det = ex[0] * ey[1] - ey[0] * ex[1];
  const inv = [ey[1] / det, -ex[1] / det, -ey[0] / det, ex[0] / det];
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  // R M⁻¹
  const r0 = cos * inv[0] - sin * inv[1];
  const r1 = sin * inv[0] + cos * inv[1];
  const r2 = cos * inv[2] - sin * inv[3];
  const r3 = sin * inv[2] + cos * inv[3];
  // M R M⁻¹
  const a = ex[0] * r0 + ey[0] * r1;
  const b = ex[1] * r0 + ey[1] * r1;
  const c = ex[0] * r2 + ey[0] * r3;
  const d = ex[1] * r2 + ey[1] * r3;
  const [cx, cy] = centre;
  return [a, b, c, d, cx - a * cx - c * cy, cy - b * cx - d * cy];
}

/** The wedge pointing along +x, in drawing coordinates. */
export function beamPath(): string {
  const { x, y, lamp } = LIGHTHOUSE;
  const tip = (angle: number) =>
    iso([x + Math.cos(angle) * BEAM.reach, y + Math.sin(angle) * BEAM.reach, lamp], P);
  const [ax, ay] = tip(-BEAM.spread);
  const [bx, by] = tip(BEAM.spread);
  return `M${centre[0].toFixed(2)} ${centre[1].toFixed(2)}L${ax.toFixed(2)} ${ay.toFixed(2)}L${bx.toFixed(2)} ${by.toFixed(2)}Z`;
}
