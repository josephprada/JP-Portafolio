/**
 * The city's metronome: every blinking, chasing or breathing light as a few
 * stepped values of time. The page writes them as attributes on the lights
 * layer and CSS decides what is lit, so no element animates on every frame.
 */

export interface Beat {
  /** Aviation beacons on the masts: off for a short part of each cycle. */
  blink: "0" | "1";
  /** The core and the lamp breathing, in four steps. */
  breath: "0" | "1" | "2" | "3";
  /** Chase phase of the noria's three strings of bulbs. */
  c3: "0" | "1" | "2";
  /** Alternation of the kiosk's two strings. */
  c2: "0" | "1";
  /** Which post the billboards show. */
  slide: "0" | "1" | "2";
}

const BLINK = 2.4;
const BREATH = 3.2;
const SLIDE = 3;

export function beatAt(t: number): Beat {
  const phase = (t % BLINK) / BLINK;
  const breath = Math.min(3, Math.floor(((Math.sin((t / BREATH) * Math.PI * 2) + 1) / 2) * 4));
  return {
    blink: phase < 0.22 ? "0" : "1",
    breath: String(breath) as Beat["breath"],
    c3: String(Math.floor(t / 0.32) % 3) as Beat["c3"],
    c2: String(Math.floor(t / 0.48) % 2) as Beat["c2"],
    slide: String(Math.floor(t / SLIDE) % 3) as Beat["slide"],
  };
}
