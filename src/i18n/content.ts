export type Lang = "es" | "en";

/**
 * Every visible string on the page lives here. Both languages are authored,
 * not machine-translated: the English is written for remote/international
 * hiring, the Spanish for the Colombian market.
 *
 * Factual constraint: nothing in this file is invented. Roles, dates, the
 * migration work, the shipped products and the credentials all come from the
 * owner's CV and from the live sites.
 */
export interface Content {
  meta: { title: string; description: string };
  nav: { method: string; frontier: string; work: string; contact: string; cv: string };
  langToggle: { label: string; to: string };
  hero: {
    role: string;
    firstName: string;
    lastName: string;
    lede: string;
    primaryCta: string;
    secondaryCta: string;
  };
  thesis: { headline: string[]; body: string };
  method: {
    label: string;
    headline: string;
    body: string;
    steps: { id: string; name: string; note: string }[];
    loop: { title: string; phases: string[]; note: string };
  };
  frontier: {
    headline: string;
    body: string;
    cards: { title: string; note: string }[];
  };
  work: {
    label: string;
    headline: string;
    visit: string;
    items: {
      id: string;
      name: string;
      kind: string;
      year: string;
      summary: string;
      stack: string[];
      href?: string;
      image?: string;
      imageAlt?: string;
      note?: string;
    }[];
  };
  product: {
    headline: string;
    /** Closing phrase of the headline, set in the script face. */
    headlineAccent: string;
    lede: string;
    blocks: { title: string; body: string }[];
  };
  track: {
    label: string;
    headline: string;
    roles: { period: string; title: string; org: string; detail: string }[];
    credentials: { title: string; org: string; year: string }[];
    credentialsHeading: string;
  };
  contact: {
    headline: string;
    lede: string;
    emailLabel: string;
    phoneLabel: string;
    locationLabel: string;
    location: string;
    instagramLabel: string;
    cta: string;
    instagramCta: string;
    skillImageLabel: string;
  };
  footer: { built: string; rights: string };
  cvViewer: { openTab: string; download: string; close: string; fallback: string };
}

const es: Content = {
  meta: {
    title: "Joseph Prada - Ingeniero de Sistemas",
    description:
      "Ingeniero de Sistemas full-stack especializado en desarrollo dirigido por IA: spec-driven development, TDD y orquestacion multiagente.",
  },
  nav: {
    method: "Método",
    frontier: "Stack",
    work: "Trabajo",
    contact: "Contacto",
    cv: "Hoja de vida",
  },
  langToggle: { label: "Cambiar a inglés", to: "EN" },
  hero: {
    role: "Ingeniero de Sistemas",
    firstName: "Joseph",
    lastName: "Prada",
    lede: "Dirijo agentes de IA con método para construir producto que la gente usa. Full-stack, UX y orquestación multiagente.",
    primaryCta: "Ver el método",
    secondaryCta: "Descargar CV",
  },
  thesis: {
    headline: ["La IA", "no escribe", "mi código.", "Ejecuta", "mis decisiones."],
    body: "El autocompletado ya no es una ventaja: lo tiene todo el mundo. La diferencia está en el método. Especificar antes de construir, escribir la prueba antes que la implementación, y coordinar varios agentes en paralelo sin perder de vista lo que el producto necesita resolver. El agente ejecuta rápido. Decidir qué se ejecuta sigue siendo trabajo de ingeniería.",
  },
  method: {
    label: "Método",
    headline: "Spec-driven, test-first, agentes en paralelo",
    body: "Trabajo cada cambio como un ciclo cerrado. Nada llega a código sin una especificación que lo justifique, y nada se da por terminado sin verificarse contra esa especificación.",
    steps: [
      {
        id: "explore",
        name: "Explorar",
        note: "Leer el código y el problema antes de proponer nada. Comparar enfoques.",
      },
      {
        id: "spec",
        name: "Especificar",
        note: "Requisitos y escenarios concretos. Si no se puede escribir, no se entendió.",
      },
      {
        id: "design",
        name: "Diseñar",
        note: "Decisiones de arquitectura explícitas, con sus compensaciones anotadas.",
      },
      {
        id: "tasks",
        name: "Descomponer",
        note: "Cortes de trabajo ordenados, cada uno revisable por separado.",
      },
      {
        id: "apply",
        name: "Implementar",
        note: "Aquí vive el ciclo TDD. El agente escribe, la prueba manda.",
      },
      {
        id: "verify",
        name: "Verificar",
        note: "Contraste contra la especificación, no contra la intención del autor.",
      },
    ],
    loop: {
      title: "Ciclo TDD",
      phases: ["Rojo", "Verde", "Refactor"],
      note: "La prueba se escribe primero y falla. Solo entonces el agente implementa.",
    },
  },
  frontier: {
    headline: "Lo que ya está en mi stack",
    body: "No es una lista de deseos. Es lo que uso a diario para trabajar más rápido sin bajar el estándar.",
    cards: [
      {
        title: "MCP",
        note: "Conecto los agentes a las herramientas reales del proyecto: repositorio, memoria persistente, navegador, sistemas internos. El modelo deja de adivinar contexto y pasa a consultarlo.",
      },
      {
        title: "Skills",
        note: "Empaqueto criterio propio en instrucciones reutilizables: estándares de revisión, convenciones de arquitectura, flujos de despliegue. El agente hereda mi forma de trabajar en lugar de improvisarla.",
      },
      {
        title: "Agentes CLI",
        note: "El agente vive en la terminal, junto al código, con permisos acotados y verificación en cada paso. Sin copiar y pegar entre un chat y el editor.",
      },
      {
        title: "Multiagente",
        note: "Un coordinador reparte el trabajo entre subagentes con contexto propio: uno explora, otro implementa, otro revisa en frío. El revisor no hereda los sesgos del que escribió.",
      },
      {
        title: "Harness propio",
        note: "Cuando la herramienta genérica no alcanza, construyo la mía: comandos, fases y validaciones a medida del proyecto. Ahí es donde el método deja de ser teoría.",
      },
      {
        title: "Ingeniería de contexto",
        note: "El cuello de botella real no es el modelo, es qué entra en su ventana. Delego lecturas amplias, comprimo hallazgos y mantengo el hilo principal liviano.",
      },
    ],
  },
  work: {
    label: "Trabajo",
    headline: "En producción",
    visit: "Visitar sitio",
    items: [
      {
        id: "lavalex",
        name: "LAVALEX",
        kind: "Negocio real, Bucaramanga",
        year: "2026",
        summary:
          "Un taller de reparación de lavadoras sin presencia digital. Diseñé y construí la landing completa: propuesta de valor, catálogo, preguntas frecuentes y conversión directa a WhatsApp, que es donde el cliente de este negocio realmente escribe.",
        stack: ["React", "UX y copy", "SEO local"],
        href: "https://lavalex.co/",
        image: "/work/lavalex.webp",
        imageAlt: "Portada del sitio LAVALEX con su propuesta de servicio de reparación",
      },
      {
        id: "wallet",
        name: "JP-WALLET",
        kind: "Producto propio",
        year: "2026",
        summary:
          "Aplicación web progresiva de finanzas personales. Instalable, con sesión por Google y pensada para usarse en el teléfono en el momento del gasto, no al final del mes frente a una hoja de cálculo.",
        stack: ["React", "Vite", "PWA", "Auth Google"],
        href: "https://wallet.lavalex.co/",
        image: "/work/wallet.webp",
        imageAlt: "Pantalla de acceso de JP-WALLET",
      },
      {
        id: "migracion",
        name: "Migración del núcleo de desarrollo",
        kind: "Sistemas y Computadores S.A",
        year: "2025",
        summary:
          "Ejecuté la migración de la plantilla de desarrollo central de .NET a Node.js y React, mejorando rendimiento y escalabilidad. En paralelo llevé el flujo de diseño de Adobe XD a Figma con un sistema de diseño propio, y automaticé el paso de Figma a componentes React sobre infraestructura OpenShift.",
        stack: [".NET", "Node.js", "React", "Figma", "OpenShift"],
        note: "Trabajo corporativo, sin enlace público.",
      },
    ],
  },
  product: {
    headline: "El cliente no compra funcionalidades.",
    headlineAccent: "Compra que su problema desaparezca.",
    lede: "Vengo de diseñar antes de programar, y eso cambia el orden de las preguntas.",
    blocks: [
      {
        title: "Primero el usuario final",
        body: "En LAVALEX el usuario no quiere un formulario elegante: quiere saber si su lavadora tiene arreglo y cuánto cuesta. Por eso el botón principal abre WhatsApp y no un flujo de registro de tres pasos. La decisión de producto vino antes que la de stack.",
      },
      {
        title: "Sin olvidar al cliente",
        body: "Quien paga necesita entender qué recibe y por qué. Trabajo con entregas cortas y verificables para que la conversación sea sobre resultados concretos y no sobre promesas de cronograma.",
      },
      {
        title: "Diseño y código, una sola persona",
        body: "Manejo el ciclo completo: investigación, UX/UI en Figma, sistema de diseño, implementación e infraestructura. Sin traducciones perdidas entre el diseño y lo que finalmente se despliega.",
      },
    ],
  },
  track: {
    label: "Trayectoria",
    headline: "Recorrido",
    roles: [
      {
        period: "2025 - 2026",
        title: "Desarrollador de software",
        org: "Sistemas y Computadores S.A",
        detail:
          "Migración crítica de la plantilla de desarrollo central de .NET a Node.js y React. Automatización de diseños de Figma a proyectos React e infraestructura en OpenShift.",
      },
      {
        period: "2024 - 2025",
        title: "Diseñador de software",
        org: "Sistemas y Computadores S.A",
        detail:
          "UX/UI de software y aplicaciones para clientes con necesidades particulares, sobre administración de archivos y gestión documental. Migración de Adobe XD a Figma con sistema de diseño e integración de LLMs para generación de briefs.",
      },
      {
        period: "2020 - 2022",
        title: "Desarrollo freelance",
        org: "Proyectos independientes",
        detail: "Primeros proyectos web para clientes pequeños durante la pandemia.",
      },
    ],
    credentialsHeading: "Formación",
    credentials: [
      {
        title: "Ingeniero de Sistemas",
        org: "Universidad de Investigación y Desarrollo (UDI)",
        year: "2018 - 2023",
      },
      { title: "Técnico en venta de productos y servicios", org: "SENA", year: "2018" },
      { title: "Manejo de Adobe Photoshop", org: "SENA", year: "2021" },
    ],
  },
  contact: {
    headline: "Hablemos",
    lede: "Disponible para roles full-stack, de producto o de ingeniería con IA. Presencial en Bucaramanga o remoto.",
    emailLabel: "Correo",
    phoneLabel: "Teléfono",
    locationLabel: "Ubicación",
    location: "Bucaramanga, Santander, Colombia",
    instagramLabel: "Instagram",
    cta: "Escribir un correo",
    instagramCta: "Instagram",
    skillImageLabel: "Skill",
  },
  footer: {
    built: "Sitio construido con React, Bun y Biome.",
    rights: "Joseph Alexander Prada Barajas",
  },
  cvViewer: {
    openTab: "Abrir en una pestaña nueva",
    download: "Descargar",
    close: "Cerrar",
    fallback: "Tu navegador no puede mostrar el PDF aquí. Descargalo para verlo.",
  },
};

const en: Content = {
  meta: {
    title: "Joseph Prada - Systems Engineer",
    description:
      "Full-stack systems engineer specialised in AI-directed development: spec-driven development, TDD and multi-agent orchestration.",
  },
  nav: { method: "Method", frontier: "Stack", work: "Work", contact: "Contact", cv: "Resume" },
  langToggle: { label: "Switch to Spanish", to: "ES" },
  hero: {
    role: "Systems Engineer",
    firstName: "Joseph",
    lastName: "Prada",
    lede: "I direct AI agents with method to build product people actually use. Full-stack, UX and multi-agent orchestration.",
    primaryCta: "See the method",
    secondaryCta: "Download resume",
  },
  thesis: {
    headline: ["AI does not", "write", "my code.", "It runs", "my decisions."],
    body: "Autocomplete stopped being an advantage the moment everyone got it. The difference is method. Specify before building, write the test before the implementation, and run several agents in parallel without losing sight of the problem the product has to solve. The agent executes fast. Deciding what gets executed is still engineering work.",
  },
  method: {
    label: "Method",
    headline: "Spec-driven, test-first, agents in parallel",
    body: "I treat every change as a closed loop. Nothing reaches code without a spec that justifies it, and nothing is called done until it has been checked back against that spec.",
    steps: [
      {
        id: "explore",
        name: "Explore",
        note: "Read the code and the problem before proposing anything. Compare approaches.",
      },
      {
        id: "spec",
        name: "Specify",
        note: "Concrete requirements and scenarios. If it cannot be written down, it was not understood.",
      },
      {
        id: "design",
        name: "Design",
        note: "Explicit architecture decisions, with their trade-offs written next to them.",
      },
      {
        id: "tasks",
        name: "Break down",
        note: "Ordered slices of work, each one reviewable on its own.",
      },
      {
        id: "apply",
        name: "Implement",
        note: "This is where the TDD loop lives. The agent writes, the test decides.",
      },
      {
        id: "verify",
        name: "Verify",
        note: "Checked against the specification, not against the author's intention.",
      },
    ],
    loop: {
      title: "TDD loop",
      phases: ["Red", "Green", "Refactor"],
      note: "The test is written first and it fails. Only then does the agent implement.",
    },
  },
  frontier: {
    headline: "Already in my stack",
    body: "Not a wish list. This is what I use daily to move faster without dropping the standard.",
    cards: [
      {
        title: "MCP",
        note: "I wire agents into the project's real tools: repository, persistent memory, browser, internal systems. The model stops guessing context and starts querying it.",
      },
      {
        title: "Skills",
        note: "I package my own judgement into reusable instructions: review standards, architecture conventions, deploy flows. The agent inherits how I work instead of improvising it.",
      },
      {
        title: "CLI agents",
        note: "The agent lives in the terminal next to the code, with scoped permissions and verification at every step. No copy-pasting between a chat window and the editor.",
      },
      {
        title: "Multi-agent",
        note: "A coordinator splits work across subagents with their own context: one explores, one implements, one reviews cold. The reviewer does not inherit the writer's blind spots.",
      },
      {
        title: "Custom harness",
        note: "When the generic tool is not enough I build my own: commands, phases and validations shaped to the project. That is where method stops being theory.",
      },
      {
        title: "Context engineering",
        note: "The real bottleneck is not the model, it is what enters its window. I delegate broad reads, compress the findings and keep the main thread light.",
      },
    ],
  },
  work: {
    label: "Work",
    headline: "Shipped and running",
    visit: "Visit site",
    items: [
      {
        id: "lavalex",
        name: "LAVALEX",
        kind: "Real business, Bucaramanga",
        year: "2026",
        summary:
          "A washing machine repair shop with no digital presence. I designed and built the whole landing page: value proposition, catalogue, FAQ and direct conversion into WhatsApp, which is where this business's customers actually write from.",
        stack: ["React", "UX and copy", "Local SEO"],
        href: "https://lavalex.co/",
        image: "/work/lavalex.webp",
        imageAlt: "LAVALEX homepage showing its repair service offer",
      },
      {
        id: "wallet",
        name: "JP-WALLET",
        kind: "Own product",
        year: "2026",
        summary:
          "A progressive web app for personal finance. Installable, Google sign-in, built to be used on the phone while you spend rather than at the end of the month in front of a spreadsheet.",
        stack: ["React", "Vite", "PWA", "Google auth"],
        href: "https://wallet.lavalex.co/",
        image: "/work/wallet.webp",
        imageAlt: "JP-WALLET sign-in screen",
      },
      {
        id: "migracion",
        name: "Core development stack migration",
        kind: "Sistemas y Computadores S.A",
        year: "2025",
        summary:
          "I ran the migration of the company's core development template from .NET to Node.js and React, improving performance and scalability. In parallel I moved the design workflow from Adobe XD to Figma behind a design system, and automated the Figma to React component path on OpenShift infrastructure.",
        stack: [".NET", "Node.js", "React", "Figma", "OpenShift"],
        note: "Corporate work, no public link.",
      },
    ],
  },
  product: {
    headline: "Clients do not buy features.",
    headlineAccent: "They buy their problem going away.",
    lede: "I came to code through design, and that changes the order of the questions.",
    blocks: [
      {
        title: "The end user first",
        body: "On LAVALEX the user does not want an elegant form: they want to know whether their washing machine can be fixed and what it costs. That is why the primary button opens WhatsApp instead of a three-step signup. The product decision came before the stack decision.",
      },
      {
        title: "Without forgetting the client",
        body: "Whoever pays needs to understand what they are getting and why. I work in short, verifiable increments so the conversation stays on concrete results instead of schedule promises.",
      },
      {
        title: "Design and code, one person",
        body: "I own the full cycle: research, UX/UI in Figma, design system, implementation and infrastructure. Nothing gets lost in translation between the design file and what actually ships.",
      },
    ],
  },
  track: {
    label: "Track record",
    headline: "Background",
    roles: [
      {
        period: "2025 - 2026",
        title: "Software developer",
        org: "Sistemas y Computadores S.A",
        detail:
          "Critical migration of the core development template from .NET to Node.js and React. Automation of Figma designs into React projects, with infrastructure on OpenShift.",
      },
      {
        period: "2024 - 2025",
        title: "Software designer",
        org: "Sistemas y Computadores S.A",
        detail:
          "UX/UI for software and applications serving clients with specific needs around file administration and document management. Migration from Adobe XD to Figma with a design system, and LLM integration to generate briefs.",
      },
      {
        period: "2020 - 2022",
        title: "Freelance development",
        org: "Independent projects",
        detail: "First web projects for small clients during the pandemic.",
      },
    ],
    credentialsHeading: "Education",
    credentials: [
      {
        title: "Systems Engineering degree",
        org: "Universidad de Investigación y Desarrollo (UDI)",
        year: "2018 - 2023",
      },
      { title: "Technician, product and service sales", org: "SENA", year: "2018" },
      { title: "Adobe Photoshop", org: "SENA", year: "2021" },
    ],
  },
  contact: {
    headline: "Let's talk",
    lede: "Open to full-stack, product or AI engineering roles. On site in Bucaramanga or remote.",
    emailLabel: "Email",
    phoneLabel: "Phone",
    locationLabel: "Location",
    location: "Bucaramanga, Santander, Colombia",
    instagramLabel: "Instagram",
    cta: "Send an email",
    instagramCta: "Instagram",
    skillImageLabel: "Skill",
  },
  footer: {
    built: "Built with React, Bun and Biome.",
    rights: "Joseph Alexander Prada Barajas",
  },
  cvViewer: {
    openTab: "Open in a new tab",
    download: "Download",
    close: "Close",
    fallback: "Your browser can't preview the PDF here. Download it to view it.",
  },
};

export const content: Record<Lang, Content> = { es, en };

/** Language-neutral brand mark, rendered in the script face. */
export const BRAND = {
  signature: "J. Prada",
} as const;

export const CONTACT = {
  email: "developerjp0714@gmail.com",
  phone: "+57 317 524 9226",
  phoneHref: "tel:+573175249226",
  instagram: "https://www.instagram.com/jpdesarrolladorweb/",
  instagramHandle: "@jpdesarrolladorweb",
  cv: "/joseph-prada-cv.pdf",
  skillImage: "/jp-skill-image.zip",
} as const;
