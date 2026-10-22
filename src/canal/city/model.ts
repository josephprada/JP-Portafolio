/**
 * The city's truth model: which regions exist, what each one produces and how
 * content travels between them. Every vehicle on the map runs one of these
 * flows, so the picture can never claim a relation the model does not hold.
 *
 * Same content rules as ../data.ts: no client names, no links, no figures.
 */

export const REGION_IDS = [
  "fundacion",
  "directos",
  "shorts",
  "videos",
  "malecon",
  "stack",
] as const;
export type RegionId = (typeof REGION_IDS)[number];

export interface Region {
  id: RegionId;
  name: string;
  /** What the region is on the map, in one line. */
  landmark: string;
  summary: string;
}

export const regions: Region[] = [
  {
    id: "fundacion",
    name: "Fundación",
    landmark: "Ayuntamiento con el núcleo bajo la cúpula",
    summary:
      "La base de operaciones. De aquí salen las ideas y las decisiones que alimentan a toda la ciudad, sobre todo a los proyectos y a los directos.",
  },
  {
    id: "directos",
    name: "Distrito Directos",
    landmark: "Rascacielos con señal al aire",
    summary:
      "El centro del canal. Cada torre es un stream: construcción en vivo los martes y conceptos, Q&A o revisión de código los jueves.",
  },
  {
    id: "shorts",
    name: "Parque logístico Shorts · TikTok",
    landmark: "Bodegas de entrega rápida",
    summary:
      "Procesa sobre todo los directos y los convierte en clips cortos. Cada clip sale por dos muelles: Shorts y TikTok.",
  },
  {
    id: "videos",
    name: "Estudios de video",
    landmark: "Naves de edición",
    summary:
      "Pocos videos, pero sólidos y con su edición completa. La grabación de cada directo llega en tren de carga.",
  },
  {
    id: "malecon",
    name: "Marketing creativo",
    landmark: "Noria, pantallas, kiosco y faro",
    summary:
      "La zona tranquila junto al mar, donde se genera el contenido para Instagram y otras redes.",
  },
  {
    id: "stack",
    name: "Población JP-Stack",
    landmark: "Un edificio por aplicación",
    summary:
      "Donde conviven las aplicaciones propias y los proyectos personales. Alimenta a los directos y se comunica con el malecón, los estudios y las bodegas.",
  },
];

export type Vehicle =
  | "monorriel"
  | "helicoptero"
  | "camion"
  | "furgoneta"
  | "tren"
  | "ferry"
  | "barco";

export const VEHICLE_LABEL: Record<Vehicle, string> = {
  monorriel: "Tren aéreo",
  helicoptero: "Helicóptero",
  camion: "Camión",
  furgoneta: "Furgoneta",
  tren: "Tren de carga",
  ferry: "Ferry",
  barco: "Barco",
};

export interface Flow {
  id: string;
  from: RegionId;
  to: RegionId | "redes";
  vehicle: Vehicle;
  weight: "principal" | "secundario";
  /** What the vehicles carry, in plain words. */
  carries: string;
}

export const flows: Flow[] = [
  {
    id: "fundacion-stack",
    from: "fundacion",
    to: "stack",
    vehicle: "monorriel",
    weight: "principal",
    carries: "Ideas y decisiones para los proyectos",
  },
  {
    id: "fundacion-directos",
    from: "fundacion",
    to: "directos",
    vehicle: "monorriel",
    weight: "principal",
    carries: "Ideas y guiones para los directos",
  },
  {
    id: "fundacion-shorts",
    from: "fundacion",
    to: "shorts",
    vehicle: "furgoneta",
    weight: "secundario",
    carries: "Ideas sueltas que caben en un minuto",
  },
  {
    id: "fundacion-videos",
    from: "fundacion",
    to: "videos",
    vehicle: "helicoptero",
    weight: "secundario",
    carries: "Línea editorial de los videos largos",
  },
  {
    id: "fundacion-malecon",
    from: "fundacion",
    to: "malecon",
    vehicle: "helicoptero",
    weight: "secundario",
    carries: "Mensajes y tono para redes",
  },
  {
    id: "stack-directos",
    from: "stack",
    to: "directos",
    vehicle: "camion",
    weight: "principal",
    carries: "Proyectos que se construyen en vivo",
  },
  {
    id: "directos-shorts",
    from: "directos",
    to: "shorts",
    vehicle: "furgoneta",
    weight: "principal",
    carries: "Momentos del directo para recortar",
  },
  {
    id: "stack-shorts",
    from: "stack",
    to: "shorts",
    vehicle: "furgoneta",
    weight: "secundario",
    carries: "Avances de los proyectos",
  },
  {
    id: "directos-videos",
    from: "directos",
    to: "videos",
    vehicle: "tren",
    weight: "principal",
    carries: "La grabación completa de cada directo",
  },
  {
    id: "stack-videos",
    from: "stack",
    to: "videos",
    vehicle: "camion",
    weight: "secundario",
    carries: "Demos de los proyectos",
  },
  {
    id: "stack-malecon",
    from: "stack",
    to: "malecon",
    vehicle: "ferry",
    weight: "secundario",
    carries: "Lanzamientos y novedades de las aplicaciones",
  },
  {
    id: "malecon-redes",
    from: "malecon",
    to: "redes",
    vehicle: "barco",
    weight: "principal",
    carries: "Contenido hacia Instagram y otras redes",
  },
];

export interface Project {
  id: string;
  name: string;
  /** The building that stands for it in the town. */
  building: string;
  /** Only where the portfolio already describes the project; the rest wait for the owner. */
  summary?: string;
}

export const projects: Project[] = [
  {
    id: "jp-wallet",
    name: "JP-Wallet",
    building: "Bóveda",
    summary:
      "Aplicación web progresiva de finanzas personales, pensada para registrar el gasto en el momento.",
  },
  { id: "jp-venta", name: "JP-Venta", building: "Mercado cubierto" },
  { id: "jp-portafolio", name: "JP-Portafolio", building: "Galería", summary: "Este portafolio." },
  { id: "jp-apartment", name: "JP-Apartment", building: "Edificio residencial" },
  { id: "jp-metodologia", name: "JP-Metodología", building: "Academia" },
];

export interface MarketingFormat {
  id: string;
  name: string;
  landmark: string;
}

export const marketing: MarketingFormat[] = [
  { id: "carruseles", name: "Carruseles", landmark: "La noria: cada cabina es una lámina" },
  { id: "publicaciones", name: "Publicaciones", landmark: "Las pantallas del paseo" },
  { id: "stories", name: "Stories", landmark: "El kiosco: contenido que dura un día" },
  { id: "anuncios", name: "Anuncio del próximo directo", landmark: "El faro" },
  { id: "otras-redes", name: "Otras redes", landmark: "El muelle, de donde zarpan los barcos" },
];
