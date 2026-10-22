import { searchlightOf } from "./build/tower";
import { iso } from "./kit/iso-kit.ts";
import { LOTS, SIGNAL_TOWER } from "./plan";
import { P } from "./scene";

/**
 * The JP signal: a searchlight on a Directos roof throws the channel's logo
 * on the night sky, the way a city calls its hero. Drawn in screen space (the
 * sky has no depth): a beam that widens from the lamp to a disc of light with
 * the logo cut out of it, swaying slowly as the lamp is turned by hand.
 */

export const SIGNAL = {
  /** Centre and half-axes of the disc, in drawing units. */
  disc: { cx: 935, cy: 186, rx: 64, ry: 36 },
  /** Half the beam's width at the lamp. */
  throat: 1.8,
  sway: 7,
};

const lot = LOTS.find((l) => l.id === SIGNAL_TOWER);

/** The lens of the searchlight, on screen. */
export const LAMP: [number, number] = (() => {
  if (!lot) return [SIGNAL.disc.cx, SIGNAL.disc.cy + 200];
  const [x, y, z] = searchlightOf(lot);
  const [sx, sy] = iso([x, y, z + 5.4], P);
  return [sx, sy];
})();

export interface SignalPose {
  lamp: [number, number];
  disc: { cx: number; cy: number; rx: number; ry: number };
  /** Lamp left, lamp right, disc right, disc left. */
  beam: Array<[number, number]>;
}

export function signalAt(t: number): SignalPose {
  const cx = SIGNAL.disc.cx + Math.sin(t * 0.35) * SIGNAL.sway;
  const cy = SIGNAL.disc.cy + Math.sin(t * 0.23 + 1) * SIGNAL.sway * 0.3;
  const { rx, ry } = SIGNAL.disc;
  const w = SIGNAL.throat;
  return {
    lamp: LAMP,
    disc: { cx, cy, rx, ry },
    beam: [
      [LAMP[0] - w, LAMP[1]],
      [LAMP[0] + w, LAMP[1]],
      [cx + rx * 0.92, cy + ry * 0.25],
      [cx - rx * 0.92, cy + ry * 0.25],
    ],
  };
}
