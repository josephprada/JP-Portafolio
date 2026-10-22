import { BEAM, beamPath, beamTurn, PLANE } from "./beam";
import { type Beat, beatAt } from "./beat";
import { FrameBudget } from "./budget";
import { WHEEL } from "./build/regions";
import { clampView, labelAnchor, OVERVIEW, regionView, toFrame, type View, zoomAt } from "./camera";
import { drawHero, drawSignal, type HeroFigure, heroFigure, signalDisc } from "./figures";
import { BEAM_STOPS, HALO_STOPS, rgba } from "./gradients";
import { directosHero, type HeroPose, heroAt, heroCover } from "./hero";
import { hullOf, inside, type Polygon, pickItem } from "./hit";
import { depthOf, iso } from "./kit/iso-kit.ts";
import { alphaOf, type HaloColor, type Light } from "./lights";
import { flows, type RegionId, VEHICLE_LABEL } from "./model";
import { type Bounds, type Box3, boundsOf, SlotIndex } from "./order";
import { halo, Piece } from "./parts";
import type { Prepared } from "./prepare";
import type { CityRaster } from "./raster/load";
import { levelFor, type Rect } from "./raster/plan";
import { paintPatch } from "./raster/sources";
import { ROUTES, type Route } from "./routes";
import { P, type Scene } from "./scene";
import { SIGNAL, signalAt } from "./signal";
import { type Heading, offsetOf, poseAt, type Sprite, sprites } from "./vehicles";

/**
 * The living city, drawn on one canvas.
 *
 * The static city is a pyramid of bitmap tiles (raster/), so a frame only
 * composites a few dozen images whatever the zoom: no vector is rastered while
 * the camera moves. On top, in paint order: the clock hands, the hovered
 * building, the noria cabins and the vehicles (each with copies of the
 * buildings in front of it, clipped to its outline), the live lights, and the
 * lighthouse beam. The region titles stay HTML over the canvas.
 */

export interface Readout {
  kind: string;
  title: string;
  summary?: string;
}

export interface Label {
  id: RegionId;
  el: HTMLElement;
}

interface Options {
  reduced: boolean;
  dpr: number;
  /** Region titles floating over the map, placed by the camera. */
  labels: Label[];
  onRegion: (id: RegionId | null) => void;
  onReadout: (readout: Readout | null) => void;
}

/** The hovered building as a small bitmap, valid for one level. */
interface Patch {
  canvas: HTMLCanvasElement;
  rect: Rect;
  level: number;
  complete: boolean;
}

interface Car {
  route: Route;
  index: number;
  kind: string;
  sprite: Sprite;
  heading: Heading;
  dx: number;
  dy: number;
  alpha: number;
  bounds: Bounds;
  /** Screen outline, for the pointer and to clip the buildings in front. */
  hull: Polygon;
  slot: number;
  /** Items painted after the car that its picture overlaps. */
  front: number[];
  rotor: number;
}

/** Spider-Man this frame: where he is and what stands in front of him. */
interface Hero {
  pose: HeroPose;
  figure: HeroFigure;
  /** The web's anchor on screen, while he hangs from one. */
  web: [number, number] | null;
  /** His body's outline and the web's, for the pointer and the covers. */
  clip: Polygon[];
  reach: Bounds;
  front: number[];
}

type Hot =
  | { kind: "item"; index: number; patch: Patch | null }
  | { kind: "car"; car: Car }
  | { kind: "hero" };

const HERO_READOUT: Readout = {
  kind: "Vecino del barrio",
  title: "Spider-Man",
  summary: "Patrulla los Directos de torre en torre, colgado de sus telarañas.",
};

/** Tour stops: the overview, then each region in turn. */
export const TOUR: Array<RegionId | null> = [
  null,
  "directos",
  "malecon",
  "stack",
  "videos",
  "shorts",
  "fundacion",
];
const IDLE_BEFORE_TOUR = 9;
const TOUR_STOP = 7.5;
/** Seconds the first frame is ahead of zero, so every route is already busy. */
const T0 = 40;
/** Milliseconds of each frame that may go to rastering new tiles. */
const RASTER_BUDGET = 7;
/** Billboard posts cross-fade over this many seconds. */
const SLIDE_FADE = 0.8;
const SEA = "#05080d";
/** Padding round a building's box for its image: strokes and small overhangs. */
const ITEM_PAD = 3;

const VIEW_W = OVERVIEW.w;
const VIEW_H = OVERVIEW.h;

export class CityLive {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly raster: CityRaster;
  private readonly scene: Scene;
  private readonly options: Options;
  private readonly slots: SlotIndex;
  private readonly cars: Car[] = [];
  /** The cars in paint order. */
  private order: Car[] = [];
  private readonly lights: Light[];
  private readonly occluders: number[];
  private readonly paths = new Map<Light, Path2D>();
  private readonly screenAlpha = new Map<Light, number>();
  private readonly halos = {} as Record<HaloColor, HTMLCanvasElement>;
  private readonly beam = new Path2D(beamPath());
  private cabins: Array<[number, number]> = [];
  private size: [number, number] = [VIEW_W, VIEW_H];
  private view: View = OVERVIEW;
  private target: View = OVERVIEW;
  private raf = 0;
  private drawRaf = 0;
  private running = false;
  private last = 0;
  private clock = T0;
  private idleSince = 0;
  private tourAt = 0;
  private tourStop = 0;
  private region: RegionId | null = null;
  private hot: Hot | null = null;
  private hands: Array<[number, number, number, number]> = [];
  private lastMinute = -1;
  private tourOn: boolean;
  private motionOn: boolean;
  private inView = false;
  private beat: Beat = beatAt(T0);
  /** Canvas pixels per CSS pixel; lowered if the GPU cannot keep up. */
  private dpr: number;
  private readonly budget = new FrameBudget();
  private readonly heroPath = directosHero();
  private hero!: Hero;
  /** The JP signal's disc with the logo cut out, once the logo has loaded. */
  private signalDisc: HTMLCanvasElement | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    raster: CityRaster,
    scene: Scene,
    prepared: Prepared,
    options: Options,
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false }) as CanvasRenderingContext2D;
    this.raster = raster;
    this.scene = scene;
    this.options = options;
    this.dpr = options.dpr;
    this.tourOn = !options.reduced;
    this.motionOn = !options.reduced;
    this.slots = new SlotIndex(scene.items);

    this.lights = prepared.lights;
    this.occluders = prepared.occluders;
    for (const light of this.lights) {
      if ("d" in light) this.paths.set(light, new Path2D(light.d));
      if (light.kind === "screen") this.screenAlpha.set(light, alphaOf(light, this.beat));
    }
    for (const color of Object.keys(HALO_STOPS) as HaloColor[])
      this.halos[color] = haloSprite(color);

    // Vehicle sprites and the cabin, decoded in the background.
    const kinds = sprites(P);
    for (const route of ROUTES) {
      for (let index = 0; index < route.count; index++) {
        this.cars.push({
          route,
          index,
          kind: route.vehicle,
          sprite: kinds[route.vehicle],
          heading: "+x",
          dx: 0,
          dy: 0,
          alpha: 1,
          bounds: { x0: 0, y0: 0, x1: 0, y1: 0 },
          hull: [],
          slot: 0,
          front: [],
          rotor: 0,
        });
      }
    }
    // Whatever finishes decoding or rastering shows on the next frame.
    raster.sprites.onReady = () => this.invalidate();
    raster.items.onReady = () => this.invalidate();
    for (const [kind, sprite] of Object.entries(kinds)) {
      for (const heading of ["+x", "-x", "+y", "-y"] as Heading[])
        void raster.sprites.load(
          `${kind}${heading}`,
          sprite.svg[heading],
          spriteRect(sprite, heading),
        );
    }
    const cabinRect = rectOf(
      boundsOf({ x0: -1.7, y0: -1.5, z0: -3.6, x1: 1.7, y1: 1.5, z1: 0 }, P),
      4,
    );
    void raster.sprites.load("cabin", cabinSvg(), cabinRect);

    this.order = [...this.cars];
    this.moveCars(this.clock);
    this.moveHero(this.clock);
    this.turnWheel(this.clock);
    this.setClocks();
    void this.preloadCovers();
    void this.loadSignal();
  }

  private async loadSignal() {
    const logo = new Image();
    logo.src = "/jp-logo.png";
    try {
      await logo.decode();
    } catch {
      return; // No logo, no signal: the beam alone would read as a mistake.
    }
    const { rx, ry } = SIGNAL.disc;
    this.signalDisc = signalDisc(logo, logo.naturalWidth, logo.naturalHeight, ry / rx);
    this.invalidate();
  }

  /* ---------- loop ---------- */

  /** Called by the page's IntersectionObserver: the city only moves on screen. */
  visible(on: boolean) {
    this.inView = on;
    if (on) {
      this.start();
      this.invalidate();
    } else this.stop();
  }

  /** The pause button for everything that moves. */
  setMotion(on: boolean) {
    this.motionOn = on;
    if (on) this.start();
    else this.stop();
  }

  /** The pause button for the idle tour. */
  setTour(on: boolean) {
    this.tourOn = on;
    this.touch();
  }

  private start() {
    if (this.running || !this.motionOn || !this.inView) return;
    this.running = true;
    this.last = performance.now();
    const tick = (now: number) => {
      if (!this.running) return;
      const dt = Math.min(0.1, (now - this.last) / 1000);
      this.last = now;
      this.frame(dt);
      this.draw(now);
      // A screen this GPU cannot fill in time is drawn with fewer pixels.
      if (this.budget.push(dt, this.raster.pyramid.pending) && this.dpr > 1) {
        this.dpr = Math.max(1, this.dpr - 0.25);
        this.resize(...this.size);
      }
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  private stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  /** Draw once on the next frame, for a still city that changed. */
  private invalidate() {
    if (this.running || this.drawRaf || !this.inView) return;
    this.drawRaf = requestAnimationFrame((now) => {
      this.drawRaf = 0;
      this.draw(now);
    });
  }

  destroy() {
    this.stop();
    cancelAnimationFrame(this.drawRaf);
    this.inView = false;
  }

  private frame(dt: number) {
    this.clock += dt;
    const t = this.clock;
    this.moveCars(t);
    this.moveHero(t);
    this.turnWheel(t);
    this.setClocks();
    this.beat = beatAt(t);
    for (const [light, alpha] of this.screenAlpha) {
      const goal = alphaOf(light, this.beat);
      const step = dt / SLIDE_FADE;
      this.screenAlpha.set(
        light,
        alpha < goal ? Math.min(goal, alpha + step) : Math.max(goal, alpha - step),
      );
    }
    this.tour(dt);
    this.follow(dt);
  }

  /* ---------- vehicles ---------- */

  private moveCars(t: number) {
    for (const car of this.cars) {
      const pose = poseAt(car.route, car.index, t);
      const [along, across, height] = car.sprite.size;
      const [hx, hy] =
        pose.heading === "+x" || pose.heading === "-x" ? [along, across] : [across, along];
      car.heading = pose.heading;
      [car.dx, car.dy] = offsetOf(P, pose.x, pose.y, pose.z);
      car.alpha = pose.alpha;
      const box: Box3 = {
        x0: pose.x - hx,
        x1: pose.x + hx,
        y0: pose.y - hy,
        y1: pose.y + hy,
        z0: pose.z,
        z1: pose.z + height,
      };
      car.bounds = boundsOf(box, P);
      car.hull = hullOf(box, P, 0.6);
      if (car.route.mode === "air") {
        // Helicopters fly over the centre and the low districts, never behind
        // the towers, and they land on roofs a box would wrongly bury them in.
        car.slot = Number.MAX_SAFE_INTEGER;
        car.front = [];
        car.rotor = t * 19 + car.index;
      } else {
        car.slot = this.slots.slotFor(box, car.bounds);
        car.front = this.slots.frontOf(car.bounds, car.slot);
      }
    }
    this.sortCars();
  }

  private moveHero(t: number) {
    const pose = heroAt(this.heroPath, t);
    const cover = heroCover(pose, this.slots, P);
    const figure = heroFigure(pose, P);
    const body = hullOf(cover.box, P, 0.6);
    const clip = [body];
    // The web he hangs from, or the one he has just shot, still on its way.
    let web: [number, number] | null = null;
    const anchor = pose.web ?? pose.shoot?.anchor;
    if (anchor) {
      const [wx, wy] = iso(anchor, P);
      const grow = pose.web ? 1 : (pose.shoot?.grow ?? 0);
      const [hx, hy] = figure.hand;
      web = [hx + (wx - hx) * grow, hy + (wy - hy) * grow];
      clip.push(windAs(body, strip(figure.hand, web, 1.2)));
    }
    this.hero = { pose, figure, web, clip, reach: cover.reach, front: cover.front };
  }

  /** Vehicles whose pictures overlap are painted in slot order. */
  private sortCars() {
    const touch = (a: Bounds, b: Bounds) =>
      a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
    for (let i = 0; i < this.order.length; i++) {
      for (let j = i + 1; j < this.order.length; j++) {
        const a = this.order[i];
        const b = this.order[j];
        if (a.slot > b.slot && touch(a.bounds, b.bounds)) {
          this.order = [...this.cars].sort((p, q) => p.slot - q.slot);
          return;
        }
      }
    }
  }

  /**
   * Every building that can ever stand in front of a vehicle, decoded ahead
   * of time, so a vehicle never shows through a building while its copy loads.
   */
  private async preloadCovers() {
    for (const index of this.occluders) await this.itemSource(index);
  }

  private itemSource(index: number) {
    const item = this.scene.items[index];
    return this.raster.items.load(`i${index}`, item.svg, rectOf(item.bounds, ITEM_PAD));
  }

  /** A building as a bitmap at a level, or null while its image decodes. */
  private item(index: number, level: number) {
    const key = `i${index}`;
    if (!this.raster.items.has(key)) {
      void this.itemSource(index);
      return null;
    }
    return this.raster.items.bitmap(key, level);
  }

  /** The hovered building, lit, with whatever stands in front of it on top. */
  private hotPatch(hot: Extract<Hot, { kind: "item" }>, level: number): Patch {
    if (hot.patch?.complete && hot.patch.level === level) return hot.patch;
    const item = this.scene.items[hot.index];
    const rect = rectOf(item.bounds, ITEM_PAD);
    const front = this.slots.frontOf(item.bounds, hot.index + 1);
    const patch: Patch = hot.patch ?? {
      canvas: document.createElement("canvas"),
      rect,
      level,
      complete: false,
    };
    patch.level = level;
    // Front copies are kept to the lit building's own pixels (source-atop):
    // elsewhere the tiles already show them, with their light.
    patch.complete = paintPatch(patch.canvas, rect, level, [
      { bitmap: this.item(hot.index, level), filter: "brightness(1.45)" },
      ...front.map((index) => ({ bitmap: this.item(index, level), atop: true })),
    ]);
    hot.patch = patch;
    return patch;
  }

  /* ---------- malecón and town hall ---------- */

  private turnWheel(t: number) {
    const { cx, cy, hub, r, cabins } = WHEEL;
    // One turn every two minutes: a noria, not a centrifuge.
    const turn = (t / 120) * Math.PI * 2;
    this.cabins = Array.from({ length: cabins }, (_, index) => {
      const a = turn + (index / cabins) * Math.PI * 2;
      return [cx + Math.cos(a) * r, cy, hub + Math.sin(a) * r] as [number, number, number];
    })
      .sort((a, b) => depthOf(a, P) - depthOf(b, P))
      .map((point) => offsetOf(P, ...point));
  }

  /** The town hall's clocks, on Bogotá time. */
  private setClocks() {
    const now = new Date();
    const minute = now.getUTCMinutes();
    if (minute === this.lastMinute) return;
    this.lastMinute = minute;
    const hour = (now.getUTCHours() + 19) % 24; // UTC−5, no daylight saving.
    const angles = {
      h: (((hour % 12) + minute / 60) / 12) * Math.PI * 2,
      m: (minute / 60) * Math.PI * 2,
    };
    this.hands = [];
    for (const light of this.lights) {
      if (light.kind !== "hand") continue;
      let { u } = light;
      // Clock hands turn clockwise as seen on the face, whichever face it is.
      if (u[0] < 0) u = [-u[0], -u[1]];
      const a = light.hour ? angles.h : angles.m;
      const [cx, cy] = light.c;
      this.hands.push([
        cx,
        cy,
        cx + light.len * (Math.sin(a) * u[0] + Math.cos(a) * light.v[0]),
        cy + light.len * (Math.sin(a) * u[1] + Math.cos(a) * light.v[1]),
      ]);
    }
    this.invalidate();
  }

  /* ---------- drawing ---------- */

  private draw(now: number) {
    const ctx = this.ctx;
    const [cw] = this.size;
    const { dpr } = this;
    const k = (cw / this.view.w) * dpr;
    const level = levelFor(k);
    // Sprites, covers and new tiles are made for where the camera is going:
    // mid-flight levels are only passed through, never worth rastering.
    const goal = levelFor((cw / this.target.w) * dpr);
    const px = 1 / k;
    const view = this.view;
    const seen = (b: Bounds) =>
      b.x1 > view.x && b.x0 < view.x + view.w && b.y1 > view.y && b.y0 < view.y + view.h;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = SEA;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(k, 0, 0, k, -view.x * k, -view.y * k);
    // Bilinear on purpose. "medium" and "high" sample mipmaps, and Chrome builds
    // them by copying the texture again on every downscaled draw: measured with
    // a GPU trace, that alone held the overview at 15 fps. Levels are close
    // enough to the screen's scale that bilinear stays sharp.
    ctx.imageSmoothingQuality = "low";

    const { pyramid, sprites: spriteSet } = this.raster;
    pyramid.want(this.target, goal);
    pyramid.draw(ctx, view, Math.max(level, goal));

    // Clock hands.
    ctx.strokeStyle = "#0b0e14";
    ctx.lineWidth = 0.7 * dpr * px;
    ctx.lineCap = "round";
    ctx.beginPath();
    for (const [x0, y0, x1, y1] of this.hands) {
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
    }
    ctx.stroke();

    // The hovered building.
    let pending = false;
    if (this.hot?.kind === "item") {
      const patch = this.hotPatch(this.hot, goal);
      ctx.drawImage(patch.canvas, patch.rect.x, patch.rect.y, patch.rect.w, patch.rect.h);
      pending ||= !patch.complete;
    }

    // Noria cabins, back to front.
    const cabin = spriteSet.bitmap("cabin", goal);
    if (cabin) {
      const { x, y, w, h } = cabin.rect;
      for (const [dx, dy] of this.cabins) ctx.drawImage(cabin.image, x + dx, y + dy, w, h);
    }

    // Vehicles, each followed by the buildings in front of it, clipped to its
    // outline: they hide it exactly where the painter's order says.
    for (const car of this.order) {
      if (car.alpha < 0.01 || !seen(car.bounds)) continue;
      const sprite = spriteSet.bitmap(`${car.kind}${car.heading}`, goal);
      if (!sprite) {
        pending = true;
        continue;
      }
      const { x, y, w, h } = sprite.rect;
      ctx.globalAlpha = car.alpha;
      const lit = this.hot?.kind === "car" && this.hot.car === car;
      if (lit) ctx.filter = "brightness(1.45)";
      ctx.drawImage(sprite.image, x + car.dx, y + car.dy, w, h);
      if (lit) ctx.filter = "none";
      if (car.route.vehicle === "helicoptero") this.drawRotor(car, px);
      ctx.globalAlpha = 1;
      pending = this.drawCovers(car.front, [car.hull], car.bounds, goal) || pending;
    }

    // Spider-Man, with the buildings in front of him and his web on top.
    const hero = this.hero;
    if (seen(hero.reach)) {
      drawHero(ctx, hero.figure, hero.web, px, this.hot?.kind === "hero");
      pending = this.drawCovers(hero.front, hero.clip, hero.reach, goal) || pending;
    }

    this.drawLights(px, view);
    drawSignal(ctx, signalAt(this.clock), this.signalDisc, this.halos.red, this.clock);
    this.drawBeam();
    this.placeLabels();

    // Spend what is left of the frame on sharper tiles.
    pyramid.work(now + RASTER_BUDGET);
    if (pyramid.pending || pending) this.invalidate();
  }

  /**
   * Copies of the buildings in front of something live, clipped to its
   * outlines, so they hide it exactly where the painter's order says. Only
   * the part of each building over `b` is read. True while a copy is missing.
   */
  private drawCovers(front: number[], clip: Polygon[], b: Bounds, level: number) {
    if (!front.length) return false;
    const ctx = this.ctx;
    let pending = false;
    ctx.save();
    ctx.beginPath();
    for (const polygon of clip) {
      for (const [x, y] of polygon) ctx.lineTo(x, y);
      ctx.closePath();
    }
    ctx.clip();
    for (const index of front) {
      const cover = this.item(index, level);
      if (!cover) {
        pending = true;
        continue;
      }
      const r = cover.rect;
      const x0 = Math.max(b.x0, r.x);
      const y0 = Math.max(b.y0, r.y);
      const x1 = Math.min(b.x1, r.x + r.w);
      const y1 = Math.min(b.y1, r.y + r.h);
      if (x1 <= x0 || y1 <= y0) continue;
      const s = cover.image.width / r.w;
      ctx.drawImage(
        cover.image,
        (x0 - r.x) * s,
        (y0 - r.y) * s,
        (x1 - x0) * s,
        (y1 - y0) * s,
        x0,
        y0,
        x1 - x0,
        y1 - y0,
      );
    }
    ctx.restore();
    return pending;
  }

  private drawRotor(car: Car, px: number) {
    const ctx = this.ctx;
    const r = 4.2;
    const point = (angle: number) => {
      const [x, y] = iso([Math.cos(angle) * r, Math.sin(angle) * r, 3.1], P);
      return [x + car.dx, y + car.dy];
    };
    const a = car.rotor;
    ctx.strokeStyle = "#a9b1c2";
    ctx.lineWidth = 0.8 * this.dpr * px;
    ctx.lineCap = "round";
    ctx.beginPath();
    for (const angle of [a, a + Math.PI / 2]) {
      const [x0, y0] = point(angle);
      const [x1, y1] = point(angle + Math.PI);
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
    }
    ctx.stroke();
  }

  /** The live lights, added to the city like light: screen blending. */
  private drawLights(px: number, view: View) {
    const ctx = this.ctx;
    const margin = 40;
    const near = (x: number, y: number) =>
      x > view.x - margin &&
      x < view.x + view.w + margin &&
      y > view.y - margin &&
      y < view.y + view.h + margin;
    ctx.globalCompositeOperation = "lighter";
    const dashOffset = -((this.clock * 20) % 32);
    for (const light of this.lights) {
      switch (light.kind) {
        case "pulse":
        case "aura": {
          if (!near(light.cx, light.cy)) break;
          ctx.globalAlpha = alphaOf(light, this.beat);
          const { r } = light;
          ctx.drawImage(this.halos[light.color], light.cx - r, light.cy - r, r * 2, r * 2);
          break;
        }
        case "bulb":
          if (!near(light.cx, light.cy)) break;
          ctx.globalAlpha = alphaOf(light, this.beat);
          ctx.fillStyle = "#ffd2cc";
          ctx.beginPath();
          ctx.arc(light.cx, light.cy, light.r, 0, Math.PI * 2);
          ctx.fill();
          break;
        case "belt":
          ctx.globalAlpha = 1;
          ctx.strokeStyle = "#ff2a1f";
          ctx.lineWidth = 0.6 * this.dpr * px;
          ctx.setLineDash([2, 6]);
          ctx.lineDashOffset = dashOffset;
          ctx.stroke(this.paths.get(light) as Path2D);
          ctx.setLineDash([]);
          break;
        case "screen": {
          const alpha = this.screenAlpha.get(light) ?? 0;
          if (alpha < 0.01) break;
          ctx.globalAlpha = alpha;
          ctx.fillStyle = light.fill;
          ctx.fill(this.paths.get(light) as Path2D);
          break;
        }
        case "ink":
          ctx.globalAlpha = 0.55;
          ctx.fillStyle = "#f2efe9";
          ctx.fill(this.paths.get(light) as Path2D);
          break;
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  private drawBeam() {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.transform(...beamTurn(this.clock * 0.9));
    ctx.clip(this.beam);
    ctx.transform(...PLANE);
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, BEAM.reach);
    for (const stop of BEAM_STOPS) gradient.addColorStop(stop[0], rgba(stop));
    ctx.fillStyle = gradient;
    ctx.fillRect(-BEAM.reach, -BEAM.reach, BEAM.reach * 2, BEAM.reach * 2);
    ctx.restore();
  }

  /* ---------- camera ---------- */

  private get aspect() {
    return this.size[0] / this.size[1];
  }

  resize(width: number, height: number) {
    if (!width || !height) return;
    this.size = [width, height];
    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);
    this.target = clampView(this.target, this.aspect);
    this.view = clampView(this.view, this.aspect);
    // Drawn now, not on the next frame: a resized canvas is blank until then.
    this.draw(performance.now());
  }

  goTo(id: RegionId | null) {
    this.touch();
    this.select(id);
  }

  private select(id: RegionId | null) {
    this.region = id;
    this.target = clampView(id ? regionView(id) : OVERVIEW, this.aspect);
    this.options.onRegion(id);
    if (!this.running) {
      this.view = this.target;
      this.invalidate();
    }
  }

  /** Pan by a drag measured in CSS pixels. */
  panBy(dx: number, dy: number) {
    this.touch();
    const k = this.view.w / this.size[0];
    this.target = clampView(
      { ...this.target, x: this.target.x - dx * k, y: this.target.y - dy * k },
      this.aspect,
    );
    this.view = clampView(
      { ...this.view, x: this.view.x - dx * k, y: this.view.y - dy * k },
      this.aspect,
    );
    this.invalidate();
    if (this.region) {
      this.region = null;
      this.options.onRegion(null);
    }
  }

  /** Zoom about a point given as a fraction of the frame's width and height. */
  zoom(factor: number, fx: number, fy: number) {
    this.touch();
    const focus: [number, number] = [
      this.target.x + fx * this.target.w,
      this.target.y + fy * this.target.h,
    ];
    this.target = clampView(zoomAt(this.target, factor, focus), this.aspect);
    if (!this.running) {
      this.view = this.target;
      this.invalidate();
    }
  }

  /** Any user input pauses the idle tour. */
  touch() {
    this.idleSince = 0;
    this.tourAt = 0;
  }

  private tour(dt: number) {
    if (!this.tourOn) return;
    this.idleSince += dt;
    if (this.idleSince < IDLE_BEFORE_TOUR) return;
    this.tourAt -= dt;
    if (this.tourAt > 0) return;
    this.tourAt = TOUR_STOP;
    this.tourStop = (this.tourStop + 1) % TOUR.length;
    this.select(TOUR[this.tourStop]);
  }

  private follow(dt: number) {
    const k = 1 - Math.exp(-dt * 2.4);
    const v = this.view;
    const t = this.target;
    if (Math.abs(t.x - v.x) + Math.abs(t.y - v.y) + Math.abs(t.w - v.w) < 0.05) return;
    this.view = {
      x: v.x + (t.x - v.x) * k,
      y: v.y + (t.y - v.y) * k,
      w: v.w + (t.w - v.w) * k,
      h: v.h + (t.h - v.h) * k,
    };
  }

  /** Region titles are HTML over the map: crisp at any zoom. */
  private placeLabels() {
    const [cw, ch] = this.size;
    for (const { id, el } of this.options.labels) {
      const [lx, ly] = toFrame(this.view, this.size, labelAnchor(id));
      const off = lx < -40 || ly < -20 || lx > cw + 40 || ly > ch + 20;
      el.style.transform = `translate(${lx.toFixed(1)}px, ${ly.toFixed(1)}px)`;
      if (el.hidden !== off) el.hidden = off;
    }
  }

  /* ---------- pointer ---------- */

  /** What is under a point of the frame, in CSS pixels; null clears it. */
  hoverAt(point: [number, number] | null) {
    const next = point ? this.pick(point) : null;
    const same =
      next === this.hot ||
      (next?.kind === "item" && this.hot?.kind === "item" && next.index === this.hot.index) ||
      (next?.kind === "car" && this.hot?.kind === "car" && next.car === this.hot.car) ||
      (next?.kind === "hero" && this.hot?.kind === "hero");
    if (same) return;
    this.hot = next;
    this.options.onReadout(next ? readoutOf(next, this.scene) : null);
    this.invalidate();
  }

  private pick([fx, fy]: [number, number]): Hot | null {
    const [cw, ch] = this.size;
    const point: [number, number] = [
      this.view.x + (fx / cw) * this.view.w,
      this.view.y + (fy / ch) * this.view.h,
    ];
    if (inside(this.hero.clip[0], point)) return { kind: "hero" };
    for (let i = this.order.length - 1; i >= 0; i--) {
      const car = this.order[i];
      if (car.alpha > 0.2 && inside(car.hull, point)) return { kind: "car", car };
    }
    const index = pickItem(this.scene.items, point, P);
    return index < 0 ? null : { kind: "item", index, patch: null };
  }
}

/** A rect round some bounds, padded and widened to whole units. */
function rectOf(b: Bounds, pad: number): Rect {
  const x = Math.floor(b.x0 - pad);
  const y = Math.floor(b.y0 - pad);
  return { x, y, w: Math.ceil(b.x1 + pad) - x, h: Math.ceil(b.y1 + pad) - y };
}

/** A thin quad along a segment, `half` units either side of it. */
function strip(a: [number, number], b: [number, number], half: number): Polygon {
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const nx = (-(b[1] - a[1]) / l) * half;
  const ny = ((b[0] - a[0]) / l) * half;
  return [
    [a[0] + nx, a[1] + ny],
    [b[0] + nx, b[1] + ny],
    [b[0] - nx, b[1] - ny],
    [a[0] - nx, a[1] - ny],
  ];
}

/** `polygon`, turned to wind the same way as `like`, so a nonzero clip joins them. */
function windAs(like: Polygon, polygon: Polygon): Polygon {
  const area = (p: Polygon) =>
    p.reduce((sum, [x, y], i) => {
      const [nx, ny] = p[(i + 1) % p.length];
      return sum + x * ny - nx * y;
    }, 0);
  return Math.sign(area(like)) === Math.sign(area(polygon)) ? polygon : [...polygon].reverse();
}

/** The rect a vehicle sprite's picture fills at the origin, lights included. */
function spriteRect(sprite: Sprite, heading: Heading): Rect {
  const [along, across, height] = sprite.size;
  const [hx, hy] = heading === "+x" || heading === "-x" ? [along, across] : [across, along];
  // Headlight pools reach five units ahead plus their radius.
  return rectOf(boundsOf({ x0: -hx, y0: -hy, z0: 0, x1: hx, y1: hy, z1: height + 4 }, P), 12);
}

/** A radial ramp of one halo colour, drawn once and scaled for every halo. */
function haloSprite(color: HaloColor): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (const stop of HALO_STOPS[color]) gradient.addColorStop(stop[0], rgba(stop));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  return canvas;
}

function readoutOf(hot: Hot, scene: Scene): Readout | null {
  if (hot.kind === "hero") return HERO_READOUT;
  if (hot.kind === "car") {
    const flow = flows.find((f) => f.id === hot.car.route.flow);
    if (!flow) return null;
    return { kind: VEHICLE_LABEL[hot.car.route.vehicle], title: flow.carries };
  }
  return scene.items[hot.index]?.hover ?? null;
}

/** One noria cabin, hanging below its pivot at the world origin. */
function cabinSvg() {
  const p = new Piece(P);
  p.line(
    [
      [0, 0, 0],
      [0, 0, -0.9],
    ],
    "mid",
  );
  p.box3(-1.5, -1.3, -3.6, 3, 2.6, 2.7, { tone: "hi", r: 0.3, bevel: 0.2, className: "m-cabin" });
  p.box3(-1.7, -1.5, -1.05, 3.4, 3, 0.25, { tone: "mid", bevel: 0.1 });
  p.raw(halo(P, [0, 0, -2.2], 2.6, "amber"));
  return p.svg();
}
