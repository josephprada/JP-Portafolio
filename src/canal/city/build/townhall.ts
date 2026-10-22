import {
  axisVector,
  iso,
  lineSvg,
  type Point3,
  type Projection,
  sideRing,
} from "../kit/iso-kit.ts";
import { halo, type Item, Piece, panel, pool, wash, windows } from "../parts";
import type { Lot } from "../plan";

/**
 * The Fundación: a stepped stone plinth, a hall with a colonnade and pediment
 * on both faces the camera sees, a drum and dome, and a glass lantern on top
 * holding the core, the one light everything else in the city draws from.
 * Both pediments carry a clock whose hands the page sets to Bogotá time.
 */
export function townHall(lot: Lot, P: Projection): Item {
  const p = new Piece(P);
  const { x, y, w } = lot.rect;
  const c = x + w / 2;

  // Plinth: three steps.
  [0, 1, 2].forEach((step) => {
    const inset = step * 2;
    p.box3(x + inset, y + inset, step * 1.2, w - inset * 2, w - inset * 2, 1.2, {
      tone: "lo",
      bevel: 0.3,
      className: "m-stone",
    });
  });
  const floor = 3.6;

  // Hall.
  const hall = { x: c - 20, y: c - 20, w: 40 };
  const hallTop = floor + 16;
  p.box3(hall.x, hall.y, floor, hall.w, hall.w, 16, {
    tone: "mid",
    bevel: 0.6,
    className: "m-stone",
  });
  for (const face of ["x", "y"] as const) {
    p.raw(
      windows(P, {
        face,
        at: hall.x + hall.w,
        from: (face === "x" ? hall.y : hall.x) + 3,
        to: (face === "x" ? hall.y : hall.x) + hall.w - 3,
        z0: floor + 1.2,
        z1: hallTop - 1.4,
        pitch: 4,
        floor: 6.6,
        width: 1.8,
        height: 4.6,
        lit: 0.85,
        seed: face === "x" ? 11 : 23,
      }),
    );
    p.raw(
      wash(
        P,
        face,
        hall.x + hall.w,
        face === "x" ? hall.y : hall.x,
        (face === "x" ? hall.y : hall.x) + hall.w,
        floor,
        16,
      ),
    );
  }
  p.seam(hall.x, hall.y, hall.w, hall.w, floor + 8.6, "lo");

  // Colonnades with entablature and pediment, one per visible face.
  const front = hall.x + hall.w + 2;
  const colTop = hallTop - 2;
  const columns = (face: "x" | "y") => {
    for (let u = hall.x + 2.5; u <= hall.x + hall.w - 2.5; u += 5) {
      const [cx, cy] = face === "y" ? [u, front] : [front, u];
      p.cyl(cx, cy, 1, floor, 0.6, { tone: "lo", steps: 12 });
      p.cyl(cx, cy, 0.75, floor + 0.6, colTop - floor - 1.2, {
        tone: "hi",
        steps: 14,
        className: "m-stone",
      });
      p.cyl(cx, cy, 1, colTop - 0.6, 0.6, { tone: "lo", steps: 12 });
    }
  };
  // The x face sits further from the viewer's left, so it is drawn first.
  columns("x");
  p.box3(front - 1.6, hall.y - 1, colTop, 3.2, hall.w + 2, 2, {
    tone: "mid",
    bevel: 0.3,
    className: "m-stone",
  });
  p.prism(
    "y",
    [front, hall.y - 1, colTop + 2],
    hall.w + 2,
    [
      [-1.8, 0],
      [1.8, 0],
      [0, 4.2],
    ],
    { tone: "mid", className: "m-stone" },
  );
  columns("y");
  p.box3(hall.x - 1, front - 1.6, colTop, hall.w + 2, 3.2, 2, {
    tone: "mid",
    bevel: 0.3,
    className: "m-stone",
  });
  p.prism(
    "x",
    [hall.x - 1, front, colTop + 2],
    hall.w + 2,
    [
      [-1.8, 0],
      [1.8, 0],
      [0, 4.2],
    ],
    { tone: "mid", className: "m-stone" },
  );

  // Clocks on both pediments.
  const clock = (centre: Point3, axis: "x" | "y") => {
    p.raw(`<path class="clock-face" d="${sideRing(centre, 1.7, axis, P, 32)}"/>`);
    p.raw(lineSvg(sideRing(centre, 1.7, axis, P, 32), { tone: "hi" }));
    const [sx, sy] = iso(centre, P);
    const u = axisVector(P, axis === "x" ? [0, -1, 0] : [1, 0, 0]);
    const v = axisVector(P, [0, 0, 1]);
    const data = `data-c="${sx.toFixed(2)},${sy.toFixed(2)}" data-u="${u[0].toFixed(3)},${u[1].toFixed(3)}" data-v="${v[0].toFixed(3)},${v[1].toFixed(3)}"`;
    p.raw(`<path class="clock-hand" data-hand="h" data-len="0.95" ${data} d=""/>`);
    p.raw(`<path class="clock-hand" data-hand="m" data-len="1.45" ${data} d=""/>`);
    p.dots([centre], 0.25, "hi");
  };
  clock([front + 1.85, c, colTop + 3.2], "x");
  clock([c, front + 1.85, colTop + 3.2], "y");

  // Attic, drum, dome.
  p.box3(c - 14, c - 14, hallTop, 28, 28, 3, { tone: "lo", bevel: 0.4, className: "m-stone" });
  p.box3(hall.x + 1, hall.y + 1, hallTop, 9, 9, 0.4, { tone: "lo", r: 0.1 });
  const drumZ = hallTop + 3;
  p.cyl(c, c, 11.5, drumZ, 1, { tone: "hi", steps: 48, className: "m-stone" });
  p.cyl(c, c, 10.5, drumZ + 1, 7, { tone: "mid", steps: 48, className: "m-stone" });
  // Drum windows: lit slots round the visible half.
  for (let index = 0; index < 9; index++) {
    const angle = (-15 + index * 13.5) * (Math.PI / 180);
    const dx = Math.cos(angle) * 10.55;
    const dy = Math.sin(angle) * 10.55;
    const a: Point3 = [c + dx, c + dy, drumZ + 2.4];
    const b: Point3 = [c + dx, c + dy, drumZ + 6.4];
    p.raw(
      `<path class="cw-lit" data-l="3" d="M${iso(a, P).join(" ")}L${iso(b, P).join(" ")}" style="stroke-width:2.2;stroke:var(--city-amber);fill:none"/>`,
    );
  }
  p.cyl(c, c, 11, drumZ + 8, 0.8, { tone: "hi", steps: 48, className: "m-stone" });
  const domeZ = drumZ + 8.8;
  p.turned(
    c,
    c,
    domeZ,
    [
      [0, 10.6],
      [2.4, 10.2, 1],
      [5, 8.8, 1],
      [7.4, 6.4, 1],
      [9, 3.6, 1],
      [9.6, 2.2],
    ],
    { tone: "mid", className: "m-dome" },
  );

  // Lantern and the core.
  const lanternZ = domeZ + 9.6;
  p.cyl(c, c, 2.6, lanternZ, 0.5, { tone: "hi", steps: 24 });
  p.cyl(c, c, 2.2, lanternZ + 0.5, 4.4, { tone: "hi", steps: 24, className: "m-lantern" });
  p.raw(
    halo(P, [c, c, lanternZ + 2.7], 26, "amber", false).replace("glow-halo", "glow-halo core-aura"),
  );
  p.ball([c, c, lanternZ + 2.7], 1.5, { tone: "hi", lit: true, className: "m-core" });
  p.cyl(c, c, 2.8, lanternZ + 4.9, 0.6, { tone: "hi", steps: 24 });
  p.turned(
    c,
    c,
    lanternZ + 5.5,
    [
      [0, 2.6],
      [1.2, 1.4, 1],
      [2, 0.3],
    ],
    { tone: "mid" },
  );
  p.cyl(c, c, 0.18, lanternZ + 7.5, 4, { tone: "hi", steps: 6, crease: "none" });

  // Entrance: lit doors under each colonnade, flags, lamps and their pools.
  p.raw(panel(P, "y", hall.y + hall.w + 0.05, c - 4, c + 4, floor, floor + 6.5, "lit-door"));
  p.raw(panel(P, "x", hall.x + hall.w + 0.05, c - 4, c + 4, floor, floor + 6.5, "lit-door"));
  p.raw(pool(P, c, front + 7, 3.65, 10));
  p.raw(pool(P, front + 7, c, 3.65, 10));

  return p.item(lot.id, {
    region: "fundacion",
    hover: {
      kind: "Fundación",
      title: "Ayuntamiento · el núcleo",
      summary: "De aquí salen las ideas que alimentan a toda la ciudad.",
    },
  });
}
