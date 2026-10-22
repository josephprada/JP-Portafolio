import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { CityLive, type Label, type Readout } from "./live";
import { type RegionId, regions } from "./model";
import { type Prepared, prepare } from "./prepare";
import { loadCity } from "./raster/load";
import { buildScene, type Scene } from "./scene";
import "./kit/iso.css";
import "./city.css";

const SHORT_NAME: Record<RegionId, string> = {
  fundacion: "Fundación",
  directos: "Directos",
  shorts: "Shorts · TikTok",
  videos: "Videos",
  malecon: "Marketing",
  stack: "JP-Stack",
};

export function CityStage() {
  const reduced = useReducedMotion() ?? false;
  const [city, setCity] = useState<{ scene: Scene; prepared: Prepared } | null>(null);
  const [ready, setReady] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef(new Map<RegionId, HTMLButtonElement>());
  const liveRef = useRef<CityLive | null>(null);
  const [region, setRegion] = useState<RegionId | null>(null);
  const [readout, setReadout] = useState<Readout | null>(null);
  const [tourOn, setTourOn] = useState(!reduced);
  const [motionOn, setMotionOn] = useState(!reduced);
  const [titlesOn, setTitlesOn] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  // Safari on iPhone cannot take an element full screen: no button there.
  const canFullscreen = typeof document !== "undefined" && document.fullscreenEnabled;
  // Read by the mount effect without making it re-run on every toggle.
  const wanted = useRef({ tourOn, motionOn });
  wanted.current = { tourOn, motionOn };

  // The scene is generated in a worker so the page stays responsive; where
  // workers are unavailable it is built here instead.
  useEffect(() => {
    let alive = true;
    let worker: Worker | null = null;
    const fallback = () => {
      if (!alive) return;
      const scene = buildScene();
      setCity({ scene, prepared: prepare(scene) });
    };
    try {
      worker = new Worker(new URL("./scene.worker.ts", import.meta.url), { type: "module" });
      worker.onmessage = (event: MessageEvent<{ scene: Scene; prepared: Prepared }>) => {
        if (alive) setCity(event.data);
        worker?.terminate();
      };
      worker.onerror = fallback;
    } catch {
      fallback();
    }
    return () => {
      alive = false;
      worker?.terminate();
    };
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    const canvas = canvasRef.current;
    if (!city || !frame || !canvas) return;
    const { scene, prepared } = city;
    let cancelled = false;
    let teardown = () => {};
    // Sharper than the screen is wasted; capped at 2 the tiles stay affordable.
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const mount = (raster: NonNullable<Awaited<ReturnType<typeof loadCity>>>) => {
      const labels: Label[] = [...labelRefs.current].map(([id, el]) => ({ id, el }));
      const live = new CityLive(canvas, raster, scene, prepared, {
        reduced,
        dpr,
        labels,
        onRegion: setRegion,
        onReadout: setReadout,
      });
      live.setTour(wanted.current.tourOn);
      live.setMotion(wanted.current.motionOn);
      liveRef.current = live;
      setReady(true);

      const sized = new ResizeObserver(([entry]) =>
        live.resize(entry.contentRect.width, entry.contentRect.height),
      );
      sized.observe(frame);
      // The city only moves while it is on screen.
      const seen = new IntersectionObserver(([entry]) => live.visible(entry.isIntersecting));
      seen.observe(frame);

      const local = (event: PointerEvent): [number, number] => {
        const rect = frame.getBoundingClientRect();
        return [event.clientX - rect.left, event.clientY - rect.top];
      };
      // The tooltip follows the pointer; written as a style, never re-rendered.
      const tip = (clientX: number, clientY: number) => {
        const el = tipRef.current;
        if (!el) return;
        const rect = frame.getBoundingClientRect();
        let x = clientX - rect.left + 16;
        let y = clientY - rect.top + 18;
        if (x + el.offsetWidth > rect.width - 8) x = clientX - rect.left - el.offsetWidth - 16;
        if (y + el.offsetHeight > rect.height - 8) y = clientY - rect.top - el.offsetHeight - 18;
        el.style.transform = `translate(${Math.max(8, x)}px, ${Math.max(8, y)}px)`;
      };

      let drag: { id: number; x: number; y: number; travel: number } | null = null;
      const down = (event: PointerEvent) => {
        if (event.target instanceof Element && event.target.closest("button")) return;
        drag = { id: event.pointerId, x: event.clientX, y: event.clientY, travel: 0 };
        // Throws if the pointer is already gone (a very quick tap); dragging
        // without capture still works while the pointer stays on the frame.
        try {
          frame.setPointerCapture(event.pointerId);
        } catch {}
        frame.classList.add("is-dragging");
      };
      const move = (event: PointerEvent) => {
        if (drag && drag.id === event.pointerId) {
          live.panBy(event.clientX - drag.x, event.clientY - drag.y);
          drag.travel += Math.abs(event.clientX - drag.x) + Math.abs(event.clientY - drag.y);
          drag.x = event.clientX;
          drag.y = event.clientY;
          live.hoverAt(null);
          return;
        }
        // Over the buttons and titles the city is not what is pointed at.
        if (event.target !== canvas) {
          live.hoverAt(null);
          return;
        }
        live.hoverAt(local(event));
        tip(event.clientX, event.clientY);
      };
      const up = (event: PointerEvent) => {
        if (drag?.id !== event.pointerId) return;
        // A tap picks what is under the finger, since touch has no hover.
        if (event.type === "pointerup" && event.pointerType !== "mouse" && drag.travel < 6) {
          live.hoverAt(local(event));
          tip(event.clientX, event.clientY);
        }
        drag = null;
        frame.classList.remove("is-dragging");
      };
      // A finger "leaves" right after every tap; only a mouse leaving clears.
      const leave = (event: PointerEvent) => {
        if (event.pointerType === "mouse") live.hoverAt(null);
      };
      // Ctrl + wheel (and a trackpad pinch, which arrives as one) zooms; a plain
      // wheel keeps scrolling the page.
      const wheel = (event: WheelEvent) => {
        if (!event.ctrlKey) return;
        event.preventDefault();
        const rect = frame.getBoundingClientRect();
        live.zoom(
          Math.exp(event.deltaY * 0.004),
          (event.clientX - rect.left) / rect.width,
          (event.clientY - rect.top) / rect.height,
        );
      };
      frame.addEventListener("pointerdown", down);
      frame.addEventListener("pointermove", move);
      frame.addEventListener("pointerup", up);
      frame.addEventListener("pointercancel", up);
      frame.addEventListener("pointerleave", leave);
      frame.addEventListener("wheel", wheel, { passive: false });

      return () => {
        sized.disconnect();
        seen.disconnect();
        frame.removeEventListener("pointerdown", down);
        frame.removeEventListener("pointermove", move);
        frame.removeEventListener("pointerup", up);
        frame.removeEventListener("pointercancel", up);
        frame.removeEventListener("pointerleave", leave);
        frame.removeEventListener("wheel", wheel);
        live.destroy();
        liveRef.current = null;
      };
    };

    // The city is rastered by the browser's SVG renderer, a chunk at a time,
    // into the images the canvas draws from.
    let raster: Awaited<ReturnType<typeof loadCity>> = null;
    void loadCity(scene, dpr, () => !cancelled).then((loaded) => {
      if (!loaded || cancelled) return;
      raster = loaded;
      teardown = mount(loaded);
    });

    return () => {
      cancelled = true;
      teardown();
      raster?.destroy();
      setReady(false);
    };
  }, [city, reduced]);

  const zoom = (factor: number) => liveRef.current?.zoom(factor, 0.5, 0.5);
  const toggleTour = () => {
    setTourOn(!tourOn);
    liveRef.current?.setTour(!tourOn);
  };
  const toggleMotion = () => {
    setMotionOn(!motionOn);
    liveRef.current?.setMotion(!motionOn);
  };
  const toggleTitles = () => setTitlesOn(!titlesOn);
  const toggleFullscreen = () => {
    const frame = frameRef.current;
    if (!frame) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void frame.requestFullscreen?.().catch(() => {});
  };
  useEffect(() => {
    const sync = () => setFullscreen(document.fullscreenElement === frameRef.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  const active = regions.find((r) => r.id === region);

  return (
    <section className="iso city" data-theme="dark" aria-labelledby="city-title">
      <div className="city-card">
        <header className="city-head">
          <span className="city-fig">Fig. 1</span>
          <h2 id="city-title" className="city-title">
            La ciudad del canal
          </h2>
        </header>

        <div className="city-frame" ref={frameRef} data-ready={ready || undefined}>
          <canvas
            ref={canvasRef}
            className="city-canvas"
            role="img"
            aria-label="Mapa isométrico de la ciudad del canal JP Developer"
          />

          <div className="city-labels" hidden={!titlesOn}>
            {regions.map((r) => (
              <button
                key={r.id}
                type="button"
                className="city-label"
                data-active={region === r.id || undefined}
                hidden
                ref={(el) => {
                  if (el) labelRefs.current.set(r.id, el);
                  else labelRefs.current.delete(r.id);
                }}
                onClick={() => liveRef.current?.goTo(r.id)}
              >
                <span className="city-label-name">{SHORT_NAME[r.id]}</span>
                <span className="city-label-sub">{r.landmark}</span>
              </button>
            ))}
          </div>

          <div ref={tipRef} className="city-tip" role="tooltip" hidden={!readout}>
            {readout && (
              <>
                <span className="city-tip-kind">{readout.kind}</span>
                <span className="city-tip-title">{readout.title}</span>
                {readout.summary && <span className="city-tip-summary">{readout.summary}</span>}
              </>
            )}
          </div>

          {!ready && <p className="city-loading">Construyendo la ciudad…</p>}

          <div className="city-controls">
            <button type="button" aria-pressed={!tourOn} onClick={toggleTour}>
              <span aria-hidden="true">{tourOn ? "❚❚" : "▶"}</span>
              {tourOn ? "Pausar recorrido" : "Reanudar recorrido"}
            </button>
            <button type="button" aria-pressed={!motionOn} onClick={toggleMotion}>
              <span aria-hidden="true">{motionOn ? "❚❚" : "▶"}</span>
              {motionOn ? "Pausar animación" : "Reanudar animación"}
            </button>
            <button type="button" aria-pressed={!titlesOn} onClick={toggleTitles}>
              <span aria-hidden="true">{titlesOn ? "◻" : "◼"}</span>
              {titlesOn ? "Ocultar títulos" : "Mostrar títulos"}
            </button>
            {canFullscreen && (
              <button type="button" aria-pressed={fullscreen} onClick={toggleFullscreen}>
                <span aria-hidden="true">{fullscreen ? "⤡" : "⤢"}</span>
                {fullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
              </button>
            )}
          </div>

          <div className="city-zoom">
            <button type="button" onClick={() => zoom(0.7)} aria-label="Acercar">
              +
            </button>
            <button type="button" onClick={() => zoom(1 / 0.7)} aria-label="Alejar">
              −
            </button>
          </div>
        </div>

        <nav className="city-chips" aria-label="Regiones de la ciudad">
          <button
            type="button"
            aria-pressed={region === null}
            onClick={() => liveRef.current?.goTo(null)}
          >
            Vista general
          </button>
          {regions.map((r) => (
            <button
              key={r.id}
              type="button"
              aria-pressed={region === r.id}
              onClick={() => liveRef.current?.goTo(r.id)}
            >
              {SHORT_NAME[r.id]}
            </button>
          ))}
        </nav>

        <footer className="city-foot">
          <span className="city-hint">
            <span className="city-hint-mouse">
              Arrastra para moverte · Ctrl + rueda para acercar
            </span>
            <span className="city-hint-touch">
              Desliza a los lados para moverte · + y − para acercar
            </span>
          </span>
          <output className="city-readout" aria-live="polite">
            {readout ? (
              <>
                <span className="city-readout-kind">{readout.kind}</span>
                <span className="city-readout-title">{readout.title}</span>
              </>
            ) : active ? (
              <>
                <span className="city-readout-kind">{active.landmark}</span>
                <span className="city-readout-title">{active.name}</span>
              </>
            ) : (
              <span className="city-readout-kind">
                <span className="city-hint-mouse">
                  Pasa el puntero por un edificio o un vehículo
                </span>
                <span className="city-hint-touch">Toca un edificio o un vehículo</span>
              </span>
            )}
          </output>
        </footer>
      </div>
      {active && <p className="city-caption">{active.summary}</p>}
    </section>
  );
}
