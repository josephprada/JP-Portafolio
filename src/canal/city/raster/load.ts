import { defsSvg } from "../gradients";
import { type Scene, VIEW } from "../scene";
import { boundsOfMarkup, chunksOf, splitTopLevel, svgDoc } from "./plan";
import { Pyramid } from "./pyramid";
import { loadSource, releaseSource, type Source } from "./source";
import { SourceSet } from "./sources";
import { cityStyles } from "./styles";

/**
 * Turn the scene into the images the canvas draws from: the static city in a
 * grid of chunk images (the tiles' source), plus sets for vehicle sprites and
 * for single buildings, decoded on request.
 */

export interface CityRaster {
  pyramid: Pyramid;
  /** Vehicles and noria cabins, lights included. */
  sprites: SourceSet;
  /** Single buildings without their light, for covers and the hovered one. */
  items: SourceSet;
  destroy(): void;
}

/** Light spills past a building's box by up to a pool's radius. */
const SPILL = 40;
/** A grid of about 240 units square: a fine tile replays one or two chunks. */
const COLS = 10;
const ROWS = 6;

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

export async function loadCity(
  scene: Scene,
  dpr: number,
  alive: () => boolean,
): Promise<CityRaster | null> {
  const styles = await cityStyles(dpr);
  const defs = defsSvg();
  const size = { w: VIEW.W, h: VIEW.H };
  const sources: Source[] = [];
  const drop = () => {
    for (const source of sources) releaseSource(source);
  };
  // The ground is split too, piece by piece, so a chunk only carries the sea,
  // streets and lamp pools it shows.
  const ground = splitTopLevel(scene.ground).map((svg) => ({
    svg,
    bounds: boundsOfMarkup(svg) ?? { x0: 0, y0: 0, x1: size.w, y1: size.h },
  }));
  const groundChunks = chunksOf(ground, size, COLS, ROWS, 1);
  const itemChunks = chunksOf(scene.items, size, COLS, ROWS, SPILL);
  // One chunk at a time, a frame apart, so no parse is one long task.
  for (const [n, chunk] of itemChunks.entries()) {
    const body =
      groundChunks[n].indices.map((index) => ground[index].svg).join("") +
      chunk.indices.map((index) => scene.items[index].svg).join("");
    const source = await loadSource(
      svgDoc({ css: styles.tiles, defs, body, rect: chunk.rect }),
      chunk.rect,
    );
    sources.push(source);
    if (!alive()) {
      drop();
      return null;
    }
    await nextFrame();
  }
  const pyramid = new Pyramid(sources, size);
  await pyramid.primeBase();
  const sprites = new SourceSet(styles.sprites, defs);
  const items = new SourceSet(styles.items, defs);
  return {
    pyramid,
    sprites,
    items,
    destroy() {
      pyramid.destroy();
      sprites.destroy();
      items.destroy();
      drop();
    },
  };
}
