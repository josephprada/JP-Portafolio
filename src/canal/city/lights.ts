import type { Beat } from "./beat";

/**
 * The city's live lights, read out of the static markup as data.
 *
 * The tiles hold everything that never changes. What blinks, chases, slides
 * or turns is hidden there (HIDE_ANIMATED) and drawn on top every frame from
 * these records, with the same colours and timings the stylesheet used.
 */

export type HaloColor = "amber" | "red" | "white";

export type Light =
  /** Aviation beacons and on-air lamps that blink. */
  | { kind: "pulse"; cx: number; cy: number; r: number; color: HaloColor }
  /** The core and the lighthouse lamp, which breathe. */
  | { kind: "aura"; cx: number; cy: number; r: number; color: HaloColor }
  /** Strings of bulbs that chase in two or three phases. */
  | { kind: "bulb"; cx: number; cy: number; r: number; chase: "c2" | "c3"; phase: string }
  /** Conveyor belts, dashes creeping along. */
  | { kind: "belt"; d: string }
  /** Billboard posts, one shown at a time. */
  | { kind: "screen"; d: string; slide: string; fill: string }
  /** The layout drawn over every post. */
  | { kind: "ink"; d: string }
  /** The town hall's clock hands. */
  | {
      kind: "hand";
      hour: boolean;
      len: number;
      c: [number, number];
      u: [number, number];
      v: [number, number];
    };

/** What the tiles leave out, because it is drawn live. */
export const HIDE_ANIMATED =
  ".glow-halo[data-pulse], .core-aura, .lamp-aura, .bulb, .belt, .screen, .screen-ink, [data-hand]";

const SCREEN_FILL: Record<string, string> = {
  "screen-1": "#4a1d1b",
  "screen-2": "#1f3a36",
};

const TAG = /<(circle|path)\b([^>]*?)\/?>/g;
const ATTR = /([\w:-]+)(?:="([^"]*)")?/g;

function attrsOf(text: string) {
  const out: Record<string, string> = {};
  for (const [, name, value] of text.matchAll(ATTR)) out[name] = value ?? "";
  return out;
}

const pair = (text: string) => text.split(",").map(Number) as [number, number];

/** Every animated light in the items' markup, in paint order. */
export function parseLights(svgs: string[]): Light[] {
  const out: Light[] = [];
  for (const svg of svgs) {
    for (const [, tag, rest] of svg.matchAll(TAG)) {
      const a = attrsOf(rest);
      const classes = (a.class ?? "").split(/\s+/);
      const has = (name: string) => classes.includes(name);
      if (tag === "circle") {
        const circle = { cx: Number(a.cx), cy: Number(a.cy), r: Number(a.r) };
        const color = (a["data-c"] ?? "amber") as HaloColor;
        if (has("glow-halo") && "data-pulse" in a) out.push({ kind: "pulse", ...circle, color });
        else if (has("core-aura") || has("lamp-aura")) out.push({ kind: "aura", ...circle, color });
        else if (has("bulb")) {
          const c3 = "data-p3" in a;
          out.push({
            kind: "bulb",
            ...circle,
            chase: c3 ? "c3" : "c2",
            phase: c3 ? a["data-p3"] : a["data-p2"],
          });
        }
        continue;
      }
      if (has("belt")) out.push({ kind: "belt", d: a.d });
      else if (has("screen-ink")) out.push({ kind: "ink", d: a.d });
      else if (has("screen")) {
        const variant = classes.find((name) => name in SCREEN_FILL);
        out.push({
          kind: "screen",
          d: a.d,
          slide: a["data-s"],
          fill: variant ? SCREEN_FILL[variant] : "#2b3a52",
        });
      } else if ("data-hand" in a)
        out.push({
          kind: "hand",
          hour: a["data-hand"] === "h",
          len: Number(a["data-len"]),
          c: pair(a["data-c"]),
          u: pair(a["data-u"]),
          v: pair(a["data-v"]),
        });
    }
  }
  return out;
}

const BREATH = [0.72, 0.84, 0.94, 1];

/** How lit a light is at a beat; screens fade between posts on top of this. */
export function alphaOf(light: Light, beat: Beat): number {
  switch (light.kind) {
    case "pulse":
      return beat.blink === "0" ? 0.3 : 1;
    case "aura":
      return BREATH[Number(beat.breath)];
    case "bulb":
      return beat[light.chase] === light.phase ? 0.3 : 1;
    case "screen":
      return beat.slide === light.slide ? 1 : 0;
    default:
      return 1;
  }
}
