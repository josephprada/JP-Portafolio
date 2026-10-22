import type { Vehicle } from "./model";

/**
 * Where each flow's vehicles drive, fly or sail. Paths are world points on
 * road centre lines (vehicles keep to the right of them), on the rail, on the
 * guideway, through the air or over water. routes.test.ts checks that each
 * route starts and ends in the regions its flow joins and stays on roads.
 */

export type Mode = "road" | "rail" | "monorail" | "air" | "water";

export interface Route {
  id: string;
  flow: string;
  vehicle: Vehicle;
  mode: Mode;
  path: Array<[number, number]>;
  /** How many vehicles run this route at once. */
  count: number;
  /** World units per second. */
  speed: number;
  /** Seconds spent at each end, loading or unloading. */
  dwell: number;
  /** Shuttle back and forth, or run out and start again (boats leaving for the networks). */
  loop: "shuttle" | "outbound";
  /** Offset to the right of the centre line, for two-way roads. */
  lane?: number;
  /** Heights for air routes: [take-off pad, cruise, landing pad]. */
  heights?: [number, number, number];
}

const STACK_TO_PARK: Array<[number, number]> = [
  [0, 388],
  [0, 48],
];

export const ROUTES: Route[] = [
  {
    id: "monorriel-norte",
    flow: "fundacion-directos",
    vehicle: "monorriel",
    mode: "monorail",
    path: [
      [0, -49],
      [0, -277],
    ],
    count: 1,
    speed: 26,
    dwell: 4,
    loop: "shuttle",
  },
  {
    id: "monorriel-sur",
    flow: "fundacion-stack",
    vehicle: "monorriel",
    mode: "monorail",
    path: [
      [0, 49],
      [0, 416],
    ],
    count: 1,
    speed: 30,
    dwell: 4,
    loop: "shuttle",
  },
  {
    id: "furgonetas-directos-1",
    flow: "directos-shorts",
    vehicle: "furgoneta",
    mode: "road",
    path: [
      [48, -80],
      [48, -172],
      [106, -172],
    ],
    count: 3,
    speed: 22,
    dwell: 2.5,
    loop: "shuttle",
    lane: 3.6,
  },
  {
    id: "furgonetas-directos-2",
    flow: "directos-shorts",
    vehicle: "furgoneta",
    mode: "road",
    path: [
      [48, -80],
      [48, -172],
      [202, -172],
    ],
    count: 3,
    speed: 22,
    dwell: 2.5,
    loop: "shuttle",
    lane: 3.6,
  },
  {
    id: "furgonetas-fundacion",
    flow: "fundacion-shorts",
    vehicle: "furgoneta",
    mode: "road",
    path: [
      [48, 10],
      [48, -172],
      [230, -172],
    ],
    count: 1,
    speed: 22,
    dwell: 2.5,
    loop: "shuttle",
    lane: 3.6,
  },
  {
    id: "furgonetas-stack",
    flow: "stack-shorts",
    vehicle: "furgoneta",
    mode: "road",
    path: [...STACK_TO_PARK, [48, 48], [48, -172], [150, -172]],
    count: 1,
    speed: 22,
    dwell: 2.5,
    loop: "shuttle",
    lane: 3.6,
  },
  {
    id: "camiones-directos",
    flow: "stack-directos",
    vehicle: "camion",
    mode: "road",
    path: [...STACK_TO_PARK, [48, 48], [48, -48], [0, -48], [0, -200]],
    count: 2,
    speed: 16,
    dwell: 4,
    loop: "shuttle",
    lane: 3.6,
  },
  {
    id: "camiones-videos",
    flow: "stack-videos",
    vehicle: "camion",
    mode: "road",
    path: [...STACK_TO_PARK, [-44, 48], [-44, 155], [-140, 155]],
    count: 1,
    speed: 16,
    dwell: 4,
    loop: "shuttle",
    lane: 2.4,
  },
  {
    id: "tren-carga",
    flow: "directos-videos",
    vehicle: "tren",
    mode: "rail",
    path: [
      [-52, -275],
      [-52, 236],
    ],
    count: 1,
    speed: 18,
    dwell: 5,
    loop: "shuttle",
  },
  {
    id: "helicoptero-videos",
    flow: "fundacion-videos",
    vehicle: "helicoptero",
    mode: "air",
    path: [
      [-14, -14],
      [-232, 105],
    ],
    count: 1,
    speed: 34,
    dwell: 3,
    loop: "shuttle",
    heights: [20.4, 82, 16.4],
  },
  {
    id: "helicoptero-malecon",
    flow: "fundacion-malecon",
    vehicle: "helicoptero",
    mode: "air",
    path: [
      [-14, -14],
      [229, 123],
    ],
    count: 1,
    speed: 34,
    dwell: 3,
    loop: "shuttle",
    heights: [20.4, 70, 8.8],
  },
  {
    id: "ferry",
    flow: "stack-malecon",
    vehicle: "ferry",
    mode: "water",
    path: [
      [118, 428],
      [189, 428],
      [189, 322],
    ],
    count: 1,
    speed: 12,
    dwell: 5,
    loop: "shuttle",
  },
  {
    id: "barcos-redes",
    flow: "malecon-redes",
    vehicle: "barco",
    mode: "water",
    path: [
      [204, 292],
      [204, 336],
      [436, 336],
    ],
    count: 3,
    speed: 10,
    dwell: 3,
    loop: "outbound",
  },
];
