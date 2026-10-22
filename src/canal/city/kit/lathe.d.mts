/**
 * Types for the subset of the anatomy skill's lathe.mjs that the city uses.
 * The module itself is vendored unchanged apart from its kit import path.
 */
import type { Point3, Projection, SolidPaths } from "./iso-kit.ts";

export interface Frame {
  o: Point3;
  a: Point3;
  u: Point3;
  v: Point3;
}

/** A meridian point: [s along the axis, radius, smooth flag]. */
export type Knot = [number, number] | [number, number, 0 | 1];

export function frameAlong(o: Point3, a: Point3): Frame;
export function frameOf(o: Point3, a: Point3, u: Point3, v: Point3): Frame;
export function pointOf(F: Frame, s: number, r: number, angle: number): Point3;
export function lathe(meridian: Knot[], F: Frame, P: Projection, options?: Record<string, unknown>): SolidPaths;
export function solidOf(profile: Knot[], F: Frame, P: Projection, options?: Record<string, unknown>): SolidPaths;
export function disc(s0: number, s1: number, r: number, F: Frame, P: Projection, options?: Record<string, unknown>): SolidPaths;
export function sphereOf(centre: Point3, r: number, P: Projection, options?: { steps?: number }): SolidPaths;
export function prismOf(F: Frame, polygon: Array<[number, number]>, s0: number, s1: number, P: Projection): SolidPaths;
export function circleOf(F: Frame, s: number, r: number, P: Projection, steps?: number): string;
export function spokesOf(
  F: Frame,
  s: number,
  r0: number,
  r1: number,
  count: number,
  P: Projection,
  options?: { phase?: number; sweep?: number; from?: number; to?: number },
): string;
