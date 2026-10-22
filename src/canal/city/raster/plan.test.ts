import { describe, expect, test } from "bun:test";
import {
  boundsOfMarkup,
  chunksOf,
  LEVELS,
  levelFor,
  splitTopLevel,
  svgDoc,
  TILE,
  tilesIn,
} from "./plan";

describe("splitTopLevel", () => {
  test("cuts markup into its top-level elements, groups kept whole", () => {
    const parts = splitTopLevel(
      '<path d="M0 0L1 1"/><g class="a"><path d="M2 2L3 3"/><g><circle cx="1" cy="1" r="1"/></g></g><ellipse cx="5" cy="5" rx="1" ry="2"/>',
    );
    expect(parts).toEqual([
      '<path d="M0 0L1 1"/>',
      '<g class="a"><path d="M2 2L3 3"/><g><circle cx="1" cy="1" r="1"/></g></g>',
      '<ellipse cx="5" cy="5" rx="1" ry="2"/>',
    ]);
  });
});

describe("boundsOfMarkup", () => {
  test("reads absolute paths, circles and ellipses", () => {
    expect(
      boundsOfMarkup('<g><path d="M10 20L30 5Z"/><circle cx="50" cy="50" r="4"/></g>'),
    ).toEqual({
      x0: 10,
      y0: 5,
      x1: 54,
      y1: 54,
    });
    expect(boundsOfMarkup('<ellipse cx="5" cy="5" rx="1" ry="2"/>')).toEqual({
      x0: 4,
      y0: 3,
      x1: 6,
      y1: 7,
    });
  });

  test("anything it cannot read safely counts as everywhere", () => {
    expect(boundsOfMarkup('<path d="M0 0a5 5 0 0 1 10 0"/>')).toBeNull();
    expect(
      boundsOfMarkup('<g transform="matrix(1 0 0 1 5 5)"><path d="M0 0L1 1"/></g>'),
    ).toBeNull();
  });
});

const item = (x0: number, y0: number, x1: number, y1: number) => ({ bounds: { x0, y0, x1, y1 } });

describe("svgDoc", () => {
  const doc = svgDoc({
    css: ".a{fill:red}",
    defs: "<radialGradient id='g'/>",
    body: "<path d='M0 0'/>",
    rect: { x: 100, y: 50, w: 400, h: 300 },
  });

  test("is a standalone SVG whose pixels are drawing units over the given rect", () => {
    expect(doc).toStartWith('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(doc).toContain('viewBox="100 50 400 300"');
    expect(doc).toContain('width="400"');
    expect(doc).toContain('height="300"');
  });

  test("carries the page's classes and its styles, safely quoted", () => {
    expect(doc).toContain('class="iso city iso-svg"');
    expect(doc).toContain("<style><![CDATA[.a{fill:red}");
    expect(doc.indexOf("<defs>")).toBeLessThan(doc.indexOf("<path"));
  });
});

describe("chunksOf", () => {
  const items = [item(0, 0, 10, 10), item(590, 0, 610, 10), item(1190, 590, 1199, 599)];
  const chunks = chunksOf(items, { w: 1200, h: 600 }, 2, 1, 0);

  test("splits the drawing in a grid that covers it exactly", () => {
    expect(chunks.map((c) => c.rect)).toEqual([
      { x: 0, y: 0, w: 600, h: 600 },
      { x: 600, y: 0, w: 600, h: 600 },
    ]);
  });

  test("an item goes in every chunk its picture touches, in paint order", () => {
    expect(chunks[0].indices).toEqual([0, 1]);
    expect(chunks[1].indices).toEqual([1, 2]);
  });

  test("edges fall on whole pixels at every level, so no seam shows between chunks", () => {
    const rects = chunksOf([], { w: 2400, h: 1500 }, 3, 2, 0).map((c) => c.rect);
    for (const { x, y, w, h } of rects)
      for (const edge of [x, y, x + w, y + h])
        for (const s of LEVELS) expect(Number.isInteger(edge * s) || edge === 1500).toBe(true);
    const area = rects.reduce((sum, r) => sum + r.w * r.h, 0);
    expect(area).toBe(2400 * 1500);
  });

  test("padding catches light that spills past an item's box", () => {
    const padded = chunksOf([item(560, 0, 580, 10)], { w: 1200, h: 600 }, 2, 1, 30);
    expect(padded[1].indices).toEqual([0]);
  });
});

describe("levelFor", () => {
  test("picks the coarsest level that is still sharp enough", () => {
    expect(levelFor(0.6)).toBe(LEVELS.indexOf(1));
    expect(levelFor(1)).toBe(LEVELS.indexOf(1));
    expect(levelFor(2.3)).toBe(LEVELS.indexOf(4));
    expect(levelFor(0.1)).toBe(0);
  });

  test("stops at the finest level", () => {
    expect(levelFor(50)).toBe(LEVELS.length - 1);
  });
});

describe("tilesIn", () => {
  test("lists the tiles that cover a rect at a level, nearest the centre first", () => {
    const s = 1;
    const tiles = tilesIn({ x: 0, y: 0, w: TILE * 2, h: TILE }, LEVELS.indexOf(s), {
      w: 2400,
      h: 1500,
    });
    expect(tiles).toHaveLength(2);
    expect(tiles.map((t) => [t.tx, t.ty]).sort()).toEqual([
      [0, 0],
      [1, 0],
    ]);
    expect(tiles[0].rect).toEqual({
      x: tiles[0].tx * TILE,
      y: 0,
      w: TILE,
      h: TILE,
    });
  });

  test("never lists tiles outside the drawing", () => {
    const tiles = tilesIn({ x: -500, y: -500, w: 600, h: 600 }, LEVELS.indexOf(1), {
      w: 2400,
      h: 1500,
    });
    expect(tiles.every((t) => t.tx >= 0 && t.ty >= 0)).toBe(true);
  });
});
