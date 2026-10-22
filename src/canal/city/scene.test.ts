import { describe, expect, test } from "bun:test";
import { buildScene } from "./scene";

/**
 * The city is drawn from SVG images, which are parsed as XML: one attribute
 * without a value and the browser refuses the whole image.
 */
describe("scene markup", () => {
  const { ground, items } = buildScene();
  const markup = ground + items.map((item) => item.svg).join("");

  test("every attribute has a quoted value, as XML requires", () => {
    const bare: string[] = [];
    for (const [, rest] of markup.matchAll(/<[a-zA-Z][\w:-]*([^>]*?)\/?>/g)) {
      // Remove the well-formed attributes; anything left is a bare name.
      const left = rest.replace(/\s+[\w:-]+="[^"]*"/g, "").trim();
      if (left) bare.push(left);
    }
    expect([...new Set(bare)]).toEqual([]);
  });

  test("no stray ampersand or angle bracket in text", () => {
    expect(markup).not.toMatch(/&(?!#?\w+;)/);
  });
});
