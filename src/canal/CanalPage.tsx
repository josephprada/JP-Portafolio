import { useReducedMotion } from "motion/react";
import { useSmoothScroll } from "../lib/scroll";
import { ContentIndex } from "./ContentIndex";
import { CityStage } from "./city/CityStage";
import { channel } from "./data";

/**
 * /canal/: how the JP Developer channel is organised, drawn as a living city
 * at night. Spanish only and static by design; the content lives in data.ts
 * and city/model.ts.
 */
export function CanalPage() {
  const reduce = useReducedMotion() ?? false;

  useSmoothScroll(!reduce);

  return (
    <>
      <div className="grain" aria-hidden="true" />
      <Header />
      <main>
        <section className="pt-32 pb-14 md:pt-40 md:pb-16">
          <div className="shell">
            <p className="label">
              {channel.name} · {channel.handle}
            </p>
            <h1 className="display mt-6 max-w-[14ch] text-[13vw] sm:text-[10vw] md:text-[7rem] lg:text-[8.5rem]">
              Una ciudad que se construye en vivo
            </h1>
            <p className="body-copy mt-8 text-base md:text-lg">{channel.summary}</p>
          </div>
        </section>

        <CityStage />

        <ContentIndex />
      </main>
      <footer className="border-t py-10">
        <div className="shell flex flex-col gap-4 font-mono text-xs tracking-[0.12em] text-paper/45 uppercase sm:flex-row sm:items-center sm:justify-between">
          <span>
            {channel.name} · {channel.handle}
          </span>
          <a href="/" className="transition-colors hover:text-paper">
            Volver al portafolio
          </a>
        </div>
      </footer>
    </>
  );
}

function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 border-b bg-ink/85 backdrop-blur-md">
      <nav className="shell flex h-full items-center justify-between gap-6">
        <a href="/" className="flex items-center gap-3" aria-label="Volver al portafolio">
          <img src="/jp-logo.png" alt="" width={41} height={28} className="h-7 w-auto" />
          <span className="hidden font-mono text-xs tracking-[0.12em] text-paper/55 uppercase sm:inline">
            Portafolio
          </span>
        </a>
        <span className="font-mono text-xs tracking-[0.12em] text-paper uppercase">
          Mapa del canal
        </span>
      </nav>
    </header>
  );
}
