import { channel } from "../data";

import { projects, type RegionId } from "./model";

const { streams } = channel;

/**
 * The city plan in world units (about one metre each): x and y on the ground,
 * z up. The camera looks from +x +y, so +x +y is the front of the picture.
 *
 *   back   Distrito Directos (tall towers, never in front of anything lower)
 *   left   Estudios de video        right  Parque logístico Shorts · TikTok
 *   centre Fundación                front  Malecón creativo, on the sea
 *   across the channel, front left: the JP-Stack town, reached by bridge,
 *   tren aéreo and ferry.
 *
 * layout.test.ts checks that every lot sits on land, that lots never overlap
 * each other or a road, and that every stream and project has a building.
 */

export interface Rect {
  x: number;
  y: number;
  w: number;
  d: number;
}

export const GROUND = 0;
export const SEA = -5;
export const ISLAND_DEPTH = 12;

export const SEA_RECT: Rect = { x: -460, y: -420, w: 940, d: 1060 };
export const MAIN_ISLAND: Rect = { x: -300, y: -300, w: 560, d: 560 };
export const STACK_ISLAND: Rect = { x: -170, y: 320, w: 280, d: 190 };
export const ISLANDS = [MAIN_ISLAND, STACK_ISLAND];

export type RoadKind = "avenida" | "calle" | "puente";

export interface Road {
  id: string;
  kind: RoadKind;
  rect: Rect;
  /** Long axis, for lane markings. */
  along: "x" | "y";
}

export const ROADS: Road[] = [
  { id: "av-norte", kind: "avenida", along: "x", rect: { x: -300, y: -56, w: 560, d: 16 } },
  { id: "av-sur", kind: "avenida", along: "x", rect: { x: -300, y: 40, w: 560, d: 16 } },
  { id: "av-oeste-n", kind: "avenida", along: "y", rect: { x: -64, y: -240, w: 24, d: 184 } },
  { id: "av-oeste-c", kind: "avenida", along: "y", rect: { x: -64, y: -40, w: 24, d: 80 } },
  { id: "av-oeste-s", kind: "avenida", along: "y", rect: { x: -64, y: 56, w: 24, d: 150 } },
  { id: "av-este-n", kind: "avenida", along: "y", rect: { x: 40, y: -300, w: 16, d: 244 } },
  { id: "av-este-c", kind: "avenida", along: "y", rect: { x: 40, y: -40, w: 16, d: 80 } },
  { id: "av-este-s", kind: "avenida", along: "y", rect: { x: 40, y: 56, w: 16, d: 204 } },
  { id: "bulevar-directos", kind: "calle", along: "y", rect: { x: -8, y: -262, w: 16, d: 206 } },
  { id: "directos-ejex", kind: "calle", along: "x", rect: { x: -290, y: -178, w: 226, d: 12 } },
  { id: "directos-ejey-n", kind: "calle", along: "y", rect: { x: -182, y: -290, w: 12, d: 112 } },
  { id: "directos-ejey-s", kind: "calle", along: "y", rect: { x: -182, y: -166, w: 12, d: 110 } },
  { id: "shorts-eje", kind: "calle", along: "x", rect: { x: 56, y: -178, w: 194, d: 12 } },
  { id: "videos-eje", kind: "calle", along: "x", rect: { x: -290, y: 148, w: 226, d: 14 } },
  { id: "parque-eje", kind: "calle", along: "y", rect: { x: -10, y: 56, w: 20, d: 204 } },
  { id: "puente", kind: "puente", along: "y", rect: { x: -14, y: 260, w: 28, d: 60 } },
  { id: "stack-eje", kind: "calle", along: "y", rect: { x: -14, y: 320, w: 28, d: 72 } },
  { id: "stack-ejex", kind: "calle", along: "x", rect: { x: -170, y: 384, w: 280, d: 12 } },
];

/** The freight line runs in the median of the west avenue, between two yards. */
export const RAIL = {
  x: -52,
  from: -282,
  to: 244,
  gauge: 3,
  yards: {
    directos: { x: -64, y: -290, w: 24, d: 50 } satisfies Rect,
    videos: { x: -64, y: 206, w: 24, d: 44 } satisfies Rect,
  },
};

/** The tren aéreo: one guideway along x = 0, through the town hall's two stations. */
export const MONORAIL = {
  x: 0,
  z: 34,
  beam: 3.2,
  north: { from: -270, to: -44 },
  south: { from: 44, to: 418 },
  pylonEvery: 38,
};

export type BuildingKind =
  | "ayuntamiento"
  | "torre"
  | "torre-directo"
  | "despacho"
  | "bodega"
  | "muelle-carga"
  | "taller"
  | "nave"
  | "noria"
  | "faro"
  | "kiosco"
  | "pantalla"
  | "cafe"
  | "muelle"
  | "boveda"
  | "mercado"
  | "galeria"
  | "residencial"
  | "academia"
  | "casa"
  | "estacion";

export interface Lot {
  id: string;
  region: RegionId;
  kind: BuildingKind;
  rect: Rect;
  /** Roof height for buildings whose height is a design choice. */
  height?: number;
  /** Stream, project or Short platform this building stands for. */
  ref?: string;
  /** Built over a road or water rather than on a free lot (stations, piers). */
  spans?: boolean;
}

/**
 * Tower lots for the streams district: four blocks of four, plus two rows on
 * the boulevard. The tallest are reserved for the streams in data order.
 */
function directosLots(): Lot[] {
  const blocks: Rect[] = [
    { x: -290, y: -290, w: 108, d: 112 },
    { x: -170, y: -290, w: 106, d: 112 },
    { x: -290, y: -166, w: 108, d: 110 },
    { x: -170, y: -166, w: 106, d: 110 },
  ];
  const towers: Rect[] = [];
  for (const block of blocks) {
    const w = (block.w - 18) / 2;
    const d = (block.d - 18) / 2;
    for (const [i, j] of [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ]) {
      towers.push({ x: block.x + 6 + i * (w + 6), y: block.y + 6 + j * (d + 6), w, d });
    }
  }
  for (const x of [-36, 14]) {
    for (const y of [-282, -222, -162]) towers.push({ x, y, w: 22, d: 46 });
  }

  // Heights fall from the back of the district to the front, so a tall tower
  // never stands in front of a shorter one.
  const depthOf = (rect: Rect) => rect.x + rect.w / 2 + rect.y + rect.d / 2;
  const ranked = [...towers].sort((a, b) => depthOf(a) - depthOf(b));
  return ranked.map((rect, index) => {
    const stream = index < streams.length ? streams[index] : undefined;
    const height = Math.round(150 - index * (82 / ranked.length) + ((index * 37) % 11));
    return {
      id: stream ? `torre-${stream.id}` : `torre-${index}`,
      region: "directos",
      kind: stream ? "torre-directo" : "torre",
      rect,
      height,
      ref: stream?.id,
    } satisfies Lot;
  });
}

/** The Directos tower whose roof carries the searchlight of the JP signal. */
export const SIGNAL_TOWER = "torre-9";

export const LOTS: Lot[] = [
  // Fundación
  {
    id: "ayuntamiento",
    region: "fundacion",
    kind: "ayuntamiento",
    rect: { x: -28, y: -28, w: 56, d: 56 },
  },
  {
    id: "estacion-norte",
    region: "fundacion",
    kind: "estacion",
    rect: { x: -12, y: -60, w: 24, d: 22 },
    spans: true,
  },
  {
    id: "estacion-sur",
    region: "fundacion",
    kind: "estacion",
    rect: { x: -12, y: 38, w: 24, d: 22 },
    spans: true,
  },

  // Distrito Directos
  ...directosLots(),
  {
    id: "estacion-directos",
    region: "directos",
    kind: "estacion",
    rect: { x: -12, y: -290, w: 24, d: 26 },
    spans: true,
  },
  {
    id: "despacho-directos",
    region: "directos",
    kind: "despacho",
    rect: { x: 14, y: -100, w: 22, d: 38 },
  },

  // Parque logístico Shorts · TikTok
  {
    id: "bodega-norte-1",
    region: "shorts",
    kind: "bodega",
    rect: { x: 64, y: -284, w: 84, d: 96 },
  },
  {
    id: "bodega-norte-2",
    region: "shorts",
    kind: "bodega",
    rect: { x: 160, y: -284, w: 84, d: 96 },
  },
  {
    id: "muelle-shorts",
    region: "shorts",
    kind: "muelle-carga",
    rect: { x: 64, y: -158, w: 84, d: 50 },
    ref: "shorts",
  },
  {
    id: "muelle-tiktok",
    region: "shorts",
    kind: "muelle-carga",
    rect: { x: 160, y: -158, w: 84, d: 50 },
    ref: "tiktok",
  },
  {
    id: "taller-originales",
    region: "shorts",
    kind: "taller",
    rect: { x: 196, y: -96, w: 48, d: 34 },
  },

  // Estudios de video
  { id: "nave-1", region: "videos", kind: "nave", rect: { x: -278, y: 68, w: 92, d: 78 } },
  { id: "nave-2", region: "videos", kind: "nave", rect: { x: -170, y: 68, w: 92, d: 78 } },
  { id: "nave-3", region: "videos", kind: "nave", rect: { x: -278, y: 164, w: 128, d: 76 } },

  // Malecón creativo
  { id: "noria", region: "malecon", kind: "noria", rect: { x: 150, y: 168, w: 56, d: 22 } },
  {
    id: "faro",
    region: "malecon",
    kind: "faro",
    rect: { x: 278, y: 232, w: 22, d: 22 },
    spans: true,
  },
  { id: "kiosco", region: "malecon", kind: "kiosco", rect: { x: 92, y: 150, w: 18, d: 18 } },
  { id: "pantalla-1", region: "malecon", kind: "pantalla", rect: { x: 70, y: 66, w: 30, d: 6 } },
  { id: "pantalla-2", region: "malecon", kind: "pantalla", rect: { x: 116, y: 66, w: 30, d: 6 } },
  { id: "pantalla-3", region: "malecon", kind: "pantalla", rect: { x: 162, y: 66, w: 30, d: 6 } },
  { id: "cafe-1", region: "malecon", kind: "cafe", rect: { x: 214, y: 70, w: 30, d: 26 } },
  { id: "cafe-2", region: "malecon", kind: "cafe", rect: { x: 214, y: 110, w: 30, d: 26 } },
  {
    id: "muelle",
    region: "malecon",
    kind: "muelle",
    rect: { x: 180, y: 260, w: 18, d: 54 },
    spans: true,
  },

  // Población JP-Stack
  ...stackLots(),
];

function stackLots(): Lot[] {
  const named: Record<string, Rect> = {
    "jp-wallet": { x: -158, y: 330, w: 50, d: 46 },
    "jp-venta": { x: -96, y: 402, w: 62, d: 50 },
    "jp-portafolio": { x: 38, y: 328, w: 56, d: 48 },
    "jp-apartment": { x: 44, y: 404, w: 44, d: 48 },
    "jp-metodologia": { x: -164, y: 404, w: 56, d: 58 },
  };
  const kinds: Record<string, BuildingKind> = {
    "jp-wallet": "boveda",
    "jp-venta": "mercado",
    "jp-portafolio": "galeria",
    "jp-apartment": "residencial",
    "jp-metodologia": "academia",
  };
  const houses: Rect[] = [
    { x: -150, y: 474, w: 22, d: 24 },
    { x: -120, y: 474, w: 22, d: 24 },
    { x: -86, y: 466, w: 22, d: 24 },
    { x: -56, y: 466, w: 22, d: 24 },
    { x: 24, y: 470, w: 22, d: 24 },
    { x: 56, y: 470, w: 22, d: 24 },
    { x: -96, y: 334, w: 24, d: 22 },
    { x: -66, y: 334, w: 24, d: 22 },
  ];
  return [
    ...projects.map(
      (project) =>
        ({
          id: project.id,
          region: "stack",
          kind: kinds[project.id],
          rect: named[project.id],
          ref: project.id,
        }) satisfies Lot,
    ),
    ...houses.map(
      (rect, index) =>
        ({ id: `casa-${index + 1}`, region: "stack", kind: "casa", rect }) satisfies Lot,
    ),
    {
      id: "estacion-stack",
      region: "stack",
      kind: "estacion",
      rect: { x: -12, y: 404, w: 24, d: 24 },
      spans: true,
    },
  ];
}

/** Region outlines, used for the camera and for region labels in the UI. */
export const REGION_RECTS: Record<RegionId, Rect> = {
  fundacion: { x: -64, y: -64, w: 128, d: 128 },
  directos: { x: -290, y: -290, w: 330, d: 234 },
  shorts: { x: 56, y: -290, w: 194, d: 234 },
  videos: { x: -290, y: 56, w: 226, d: 194 },
  malecon: { x: 56, y: 56, w: 250, d: 260 },
  stack: STACK_ISLAND,
};

export const centreOf = (rect: Rect): [number, number] => [
  rect.x + rect.w / 2,
  rect.y + rect.d / 2,
];

export function overlaps(a: Rect, b: Rect, gap = 0): boolean {
  return (
    a.x < b.x + b.w + gap && b.x < a.x + a.w + gap && a.y < b.y + b.d + gap && b.y < a.y + a.d + gap
  );
}

export function inside(inner: Rect, outer: Rect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.w <= outer.x + outer.w &&
    inner.y + inner.d <= outer.y + outer.d
  );
}
