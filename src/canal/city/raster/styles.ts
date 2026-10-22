import antonUrl from "@fontsource/anton/files/anton-latin-400-normal.woff2?url";
import cityCss from "../city.css?raw";
import isoCss from "../kit/iso.css?raw";
import { HIDE_ANIMATED } from "../lights";

/**
 * The stylesheet an SVG image of the city carries. An image is a document of
 * its own: it sees none of the page's styles or web fonts, so both go inside.
 */

/** Light that a copy of a building must not bring twice. */
const HIDE_GLOW = ".glow-pool, .glow-halo, .glow-wash";

async function dataUrl(url: string) {
  const blob = await (await fetch(url)).blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Strokes in the city do not scale (non-scaling-stroke): they are drawn in
 * device pixels of whatever canvas the image lands on. The page drew them in
 * CSS pixels, so on a dense screen they are widened by the pixel ratio.
 */
function widen(css: string, dpr: number) {
  return css.replace(
    /(stroke-width:\s*|--anatomy-weight:\s*)([\d.]+)(px)?/g,
    (_, prop: string, value: string, unit = "") =>
      `${prop}${(Number(value) * dpr).toFixed(3)}${unit}`,
  );
}

export interface CityStyles {
  /** For vehicles and noria cabins: drawn as they are, lights and all. */
  sprites: string;
  /** For the tiles: the static city, with what is drawn live left out. */
  tiles: string;
  /** For copies of single buildings: no light of their own either. */
  items: string;
}

export async function cityStyles(dpr: number): Promise<CityStyles> {
  let font = "";
  try {
    font = `@font-face{font-family:"Anton";src:url(${await dataUrl(antonUrl)}) format("woff2");}`;
  } catch {
    // The signs fall back to Arial Narrow.
  }
  const sprites =
    font +
    widen(isoCss + cityCss, dpr) +
    // The root carries the page's `city` class for its variables; the section's
    // padding must not come with it, or the drawing shifts inside the image.
    `:root{--font-display:"Anton","Arial Narrow",sans-serif;padding:0!important;margin:0!important;}` +
    `*{animation:none!important;transition:none!important;}`;
  const tiles = `${sprites}${HIDE_ANIMATED}{display:none;}`;
  return { sprites, tiles, items: `${tiles}${HIDE_GLOW}{display:none;}` };
}
