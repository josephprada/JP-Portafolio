import type { ReactNode } from "react";
import { flows, marketing, projects, type RegionId, regions, VEHICLE_LABEL } from "./city/model";
import { channel, SHORT_KIND_LABEL, SHORT_KINDS } from "./data";

/**
 * The city in plain text, region by region, then every route between them.
 * It is the accessible reading of the map and the quickest way to see the
 * whole plan at once, so whatever the picture claims must be readable here.
 */

const PLACE_NAME: Record<RegionId | "redes", string> = {
  ...(Object.fromEntries(regions.map((r) => [r.id, r.name])) as Record<RegionId, string>),
  redes: "Instagram y otras redes",
};

const pillarName = (id: string) => channel.pillars.find((p) => p.id === id)?.name ?? "";

const Label = ({ children }: { children: ReactNode }) => (
  <p className="font-mono text-[0.6875rem] tracking-[0.14em] text-paper/40 uppercase">{children}</p>
);

function RegionContent({ id }: { id: RegionId }) {
  switch (id) {
    case "fundacion":
      return (
        <ul className="mt-6">
          {flows
            .filter((flow) => flow.from === "fundacion")
            .map((flow) => (
              <li key={flow.id} className="border-t border-paper/12 py-4">
                <Label>Hacia {PLACE_NAME[flow.to]}</Label>
                <p className="mt-1 text-paper/85">{flow.carries}</p>
              </li>
            ))}
        </ul>
      );
    case "directos":
      return (
        <ul className="mt-6">
          {channel.streams.map((stream) => (
            <li key={stream.id} className="border-t border-paper/12 py-5">
              <Label>Torre · {pillarName(stream.pillar)}</Label>
              <p className="mt-1 text-lg font-medium">{stream.title}</p>
              <p className="body-copy mt-1 text-sm">{stream.summary}</p>
            </li>
          ))}
        </ul>
      );
    case "videos":
      return (
        <ul className="mt-6">
          {channel.streams.map((stream) => (
            <li key={stream.id} className="border-t border-paper/12 py-4">
              <Label>Del directo «{stream.title}»</Label>
              <p className="mt-1 text-paper/85">{stream.video.title}</p>
            </li>
          ))}
        </ul>
      );
    case "shorts":
      return (
        <>
          <ul className="mt-6">
            {channel.streams.map((stream) => (
              <li key={stream.id} className="border-t border-paper/12 py-4">
                <Label>Recortes de «{stream.title}»</Label>
                {stream.shorts.map((short) => (
                  <p key={short.id} className="mt-1 text-paper/85">
                    <span className="text-paper/45">{SHORT_KIND_LABEL[short.kind]}:</span>{" "}
                    {short.title}
                  </p>
                ))}
              </li>
            ))}
          </ul>
          <h4 className="display mt-10 text-2xl">{channel.workshop.name}</h4>
          <p className="body-copy mt-2 text-sm">{channel.workshop.summary}</p>
          <dl className="mt-4">
            {SHORT_KINDS.map((kind) => (
              <div key={kind} className="border-t border-paper/12 py-4">
                <dt>
                  <Label>{SHORT_KIND_LABEL[kind]}</Label>
                </dt>
                {channel.originals
                  .filter((short) => short.kind === kind)
                  .map((short) => (
                    <dd key={short.id} className="mt-1 text-paper/85">
                      {short.title}
                    </dd>
                  ))}
              </div>
            ))}
          </dl>
        </>
      );
    case "malecon":
      return (
        <ul className="mt-6">
          {marketing.map((format) => (
            <li key={format.id} className="border-t border-paper/12 py-4">
              <Label>{format.landmark}</Label>
              <p className="mt-1 text-paper/85">{format.name}</p>
            </li>
          ))}
        </ul>
      );
    case "stack":
      return (
        <ul className="mt-6">
          {projects.map((project) => (
            <li key={project.id} className="border-t border-paper/12 py-4">
              <Label>{project.building}</Label>
              <p className="mt-1 text-lg font-medium">{project.name}</p>
              {project.summary && <p className="body-copy mt-1 text-sm">{project.summary}</p>}
            </li>
          ))}
          <li className="border-t border-paper/12 py-4">
            <Label>Casas</Label>
            <p className="mt-1 text-paper/85">Proyectos personales</p>
          </li>
        </ul>
      );
  }
}

export function ContentIndex() {
  return (
    <section aria-labelledby="indice" className="border-t py-24 md:py-32">
      <div className="shell">
        <p className="label">Índice</p>
        <h2 id="indice" className="display mt-5 text-[11vw] sm:text-[8vw] md:text-[5rem]">
          Todo lo que hay en la ciudad
        </h2>

        <div className="mt-16 grid grid-cols-1 gap-x-12 gap-y-16 lg:grid-cols-2">
          {regions.map((region, index) => (
            <article key={region.id}>
              <span className="font-mono text-xs text-accent">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="display mt-2 text-3xl md:text-4xl">{region.name}</h3>
              <p className="mt-2 font-mono text-[0.6875rem] tracking-[0.14em] text-paper/55 uppercase">
                {region.landmark}
              </p>
              <p className="body-copy mt-3 text-sm">{region.summary}</p>
              <RegionContent id={region.id} />
            </article>
          ))}
        </div>

        <div className="mt-24">
          <p className="label">Rutas</p>
          <h3 className="display mt-4 text-3xl md:text-5xl">Cómo se mueve el contenido</h3>
          <ul className="mt-10 grid grid-cols-1 gap-x-12 md:grid-cols-2">
            {flows.map((flow) => (
              <li key={flow.id} className="border-t border-paper/12 py-4">
                <Label>
                  {VEHICLE_LABEL[flow.vehicle]} ·{" "}
                  {flow.weight === "principal" ? "Ruta principal" : "Ruta secundaria"}
                </Label>
                <p className="mt-1 text-paper/85">
                  {PLACE_NAME[flow.from]} → {PLACE_NAME[flow.to]}
                </p>
                <p className="body-copy mt-1 text-sm">{flow.carries}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
