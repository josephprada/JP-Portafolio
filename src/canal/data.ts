/**
 * Everything the channel map shows. Static on purpose: the page is a public
 * snapshot of how the channel is organised, edited through commits.
 *
 * A stream owns its long video and its Shorts, so "which stream feeds what" is
 * the shape of the data rather than a set of ids that could drift apart.
 *
 * Content rules (enforced by data.test.ts): no real client names, no links or
 * private paths, no credentials, no audience figures. Business examples use a
 * fictional business or a trade description.
 */

export const SHORT_KINDS = ["truco", "error", "antes-despues"] as const;
export type ShortKind = (typeof SHORT_KINDS)[number];

export const SHORT_KIND_LABEL: Record<ShortKind, string> = {
  truco: "Truco",
  error: "Error común",
  "antes-despues": "Antes / después",
};

export type PillarId = "construccion" | "backend" | "ia" | "frontend" | "despliegue";

export interface Pillar {
  id: PillarId;
  name: string;
  summary: string;
}

export interface Short {
  id: string;
  kind: ShortKind;
  title: string;
}

export interface Stream {
  id: string;
  pillar: PillarId;
  title: string;
  summary: string;
  video: { title: string; summary: string };
  shorts: Short[];
}

export interface Channel {
  name: string;
  handle: string;
  summary: string;
  pillars: Pillar[];
  streams: Stream[];
  workshop: { name: string; summary: string };
  originals: Short[];
}

export const channel: Channel = {
  name: "JP Developer",
  handle: "@jp-developer-ai",
  summary:
    "Un canal para desarrolladores. Cada stream es una obra en construcción: de él salen un video largo editado y Shorts técnicos. Otros Shorts nacen solos, en el taller.",

  pillars: [
    {
      id: "construccion",
      name: "Construcción en vivo",
      summary:
        "Proyectos que se arman de principio a fin frente a la cámara, con cada decisión a la vista.",
    },
    {
      id: "backend",
      name: "Backend y datos",
      summary:
        "Modelado de datos, funciones de servidor y tiempo real sin montar infraestructura propia.",
    },
    {
      id: "ia",
      name: "IA aplicada",
      summary:
        "IA generativa dentro de producto real: streaming, herramientas y agentes, con sus límites.",
    },
    {
      id: "frontend",
      name: "Frontend y movimiento",
      summary: "Interfaces con intención: animación, scroll y detalles que se notan sin estorbar.",
    },
    {
      id: "despliegue",
      name: "Despliegue e infraestructura",
      summary: "Llevar lo construido a producción en un servidor propio, entendiendo cada pieza.",
    },
  ],

  streams: [
    {
      id: "idea-al-deploy",
      pillar: "construccion",
      title: "De la idea al deploy",
      summary:
        "Stream de presentación: qué es el canal, cómo trabajo y una demo corta que va de una idea a una URL pública.",
      video: {
        title: "De la idea al deploy, versión editada",
        summary: "La demo completa sin pausas, con capítulos por etapa.",
      },
      shorts: [
        { id: "idea-boceto", kind: "truco", title: "Prototipar la pantalla antes que el backend" },
        { id: "idea-env", kind: "error", title: "Desplegar sin separar las variables de entorno" },
        {
          id: "idea-boceto-final",
          kind: "antes-despues",
          title: "La idea en boceto vs. desplegada",
        },
      ],
    },
    {
      id: "setup-bun",
      pillar: "construccion",
      title: "Setup desde cero con Bun, TypeScript y React",
      summary:
        "Un proyecto nuevo sin plantillas mágicas: runtime, tipos, lint y estructura de carpetas, uno por uno.",
      video: {
        title: "Setup moderno con Bun, paso a paso",
        summary: "El setup completo, listo para usar como punto de partida.",
      },
      shorts: [
        { id: "setup-ts-directo", kind: "truco", title: "Ejecutar TypeScript directo con Bun" },
        { id: "setup-any", kind: "error", title: "Un tsconfig que deja pasar any sin avisar" },
        {
          id: "setup-carpetas",
          kind: "antes-despues",
          title: "Carpetas por tipo vs. carpetas por funcionalidad",
        },
      ],
    },
    {
      id: "qa-revision",
      pillar: "construccion",
      title: "Q&A técnico y revisión de código",
      summary:
        "Preguntas de la comunidad y revisión de código enviado por quienes ven el canal, con refactors en vivo.",
      video: {
        title: "Revisión de código: los hallazgos más útiles",
        summary: "Los momentos de la revisión que más enseñan, sin el resto del directo.",
      },
      shorts: [
        { id: "qa-effect", kind: "error", title: "useEffect para datos que se pueden derivar" },
        {
          id: "qa-contenedor",
          kind: "antes-despues",
          title: "Un componente gigante, separado en contenedor y presentación",
        },
      ],
    },
    {
      id: "convex-60",
      pillar: "backend",
      title: "Convex en 60 minutos: backend en tiempo real",
      summary:
        "Esquema, queries, mutaciones y suscripciones, construyendo el tablero de pedidos de una panadería de barrio ficticia.",
      video: {
        title: "Convex de cero a tiempo real",
        summary: "El backend completo del tablero, explicado por capas.",
      },
      shorts: [
        {
          id: "convex-query",
          kind: "truco",
          title: "Una query reactiva sin escribir un WebSocket",
        },
        { id: "convex-args", kind: "error", title: "Una mutación que no valida sus argumentos" },
        {
          id: "convex-polling",
          kind: "antes-despues",
          title: "Polling constante vs. suscripción",
        },
      ],
    },
    {
      id: "ia-streaming",
      pillar: "ia",
      title: "IA generativa con respuestas en streaming",
      summary:
        "Del endpoint a la interfaz: respuestas que se pintan mientras llegan, cancelación y manejo de errores.",
      video: {
        title: "Respuestas en streaming de punta a punta",
        summary: "Servidor, transporte e interfaz, cada pieza con su porqué.",
      },
      shorts: [
        { id: "ia-abort", kind: "truco", title: "Cancelar una respuesta con AbortController" },
        {
          id: "ia-espera",
          kind: "error",
          title: "Esperar la respuesta completa para mostrar algo",
        },
        {
          id: "ia-spinner",
          kind: "antes-despues",
          title: "Spinner eterno vs. texto que aparece en vivo",
        },
      ],
    },
    {
      id: "agente-tools",
      pillar: "ia",
      title: "Agente de IA con tool use, construido en vivo",
      summary:
        "Un agente que decide cuándo llamar herramientas, con el ciclo de ejecución escrito a mano para entenderlo.",
      video: {
        title: "Cómo funciona un agente con herramientas",
        summary: "El ciclo del agente paso a paso, sin frameworks que lo escondan.",
      },
      shorts: [
        {
          id: "agente-descripcion",
          kind: "truco",
          title: "Describir una herramienta para que el modelo la use bien",
        },
        { id: "agente-limite", kind: "error", title: "Dejar que el agente itere sin límite" },
        {
          id: "agente-prompt",
          kind: "antes-despues",
          title: "Prompt gigante vs. herramientas bien definidas",
        },
      ],
    },
    {
      id: "gsap-motion",
      pillar: "frontend",
      title: "Animaciones con GSAP y Motion en una landing",
      summary:
        "La landing de un estudio de diseño ficticio: entradas, scroll y respeto por quien prefiere menos movimiento.",
      video: {
        title: "GSAP y Motion: cuándo usar cada uno",
        summary: "Las dos librerías en el mismo proyecto, comparadas por caso de uso.",
      },
      shorts: [
        { id: "anim-reduced", kind: "truco", title: "Respetar prefers-reduced-motion" },
        { id: "anim-width", kind: "error", title: "Animar width en lugar de transform" },
        {
          id: "anim-scroll",
          kind: "antes-despues",
          title: "Scroll con saltos vs. scroll suavizado",
        },
      ],
    },
    {
      id: "vps-produccion",
      pillar: "despliegue",
      title: "Despliegue en VPS propio: de localhost a producción",
      summary:
        "Servidor, dominio, proxy inverso, certificados y despliegue automático desde el repositorio.",
      video: {
        title: "De localhost a producción en un VPS",
        summary: "Todo el camino a producción, con los comandos explicados.",
      },
      shorts: [
        { id: "vps-rsync", kind: "truco", title: "Desplegar con rsync desde un pipeline" },
        {
          id: "vps-puerto",
          kind: "error",
          title: "Abrir el puerto de la base de datos a internet",
        },
        {
          id: "vps-manual",
          kind: "antes-despues",
          title: "Subir archivos a mano vs. despliegue automático",
        },
      ],
    },
  ],

  workshop: {
    name: "Taller de Shorts",
    summary:
      "Shorts que nacen solos, sin stream detrás: un truco, un error común o un refactor en menos de un minuto.",
  },

  originals: [
    {
      id: "orig-satisfies",
      kind: "truco",
      title: "Tipar un objeto de configuración con satisfies",
    },
    { id: "orig-keyof", kind: "truco", title: "Tipos derivados con keyof y typeof" },
    { id: "orig-mutar", kind: "error", title: "Mutar el estado de React directamente" },
    { id: "orig-foreach", kind: "error", title: "Usar await dentro de un forEach" },
    { id: "orig-async", kind: "antes-despues", title: "Callbacks anidados vs. async/await" },
    {
      id: "orig-mapeo",
      kind: "antes-despues",
      title: "Condicionales en cascada vs. objeto de mapeo",
    },
  ],
};
