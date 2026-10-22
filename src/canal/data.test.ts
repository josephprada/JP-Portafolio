import { describe, expect, test } from "bun:test";
import { channel, SHORT_KINDS } from "./data";

const allIds = [
  ...channel.pillars.map((pillar) => pillar.id),
  ...channel.streams.flatMap((stream) => [stream.id, ...stream.shorts.map((short) => short.id)]),
  ...channel.originals.map((short) => short.id),
];

/** Every visible string, so the content rules can be checked in one sweep. */
function allText(): string[] {
  return [
    channel.name,
    channel.handle,
    channel.summary,
    channel.workshop.name,
    channel.workshop.summary,
    ...channel.pillars.flatMap((pillar) => [pillar.name, pillar.summary]),
    ...channel.streams.flatMap((stream) => [
      stream.title,
      stream.summary,
      stream.video.title,
      stream.video.summary,
      ...stream.shorts.map((short) => short.title),
    ]),
    ...channel.originals.map((short) => short.title),
  ];
}

describe("channel structure", () => {
  test("ids are unique", () => {
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  test("every stream belongs to an existing pillar", () => {
    const pillarIds = new Set(channel.pillars.map((pillar) => pillar.id));
    for (const stream of channel.streams) expect(pillarIds.has(stream.pillar)).toBe(true);
  });

  test("every pillar has at least one stream", () => {
    for (const pillar of channel.pillars) {
      expect(channel.streams.some((stream) => stream.pillar === pillar.id)).toBe(true);
    }
  });

  test("every stream feeds one long video and two to three Shorts", () => {
    for (const stream of channel.streams) {
      expect(stream.video.title.length).toBeGreaterThan(0);
      expect(stream.shorts.length).toBeGreaterThanOrEqual(2);
      expect(stream.shorts.length).toBeLessThanOrEqual(3);
    }
  });

  test("the workshop has original Shorts of every kind", () => {
    for (const kind of SHORT_KINDS) {
      expect(channel.originals.some((short) => short.kind === kind)).toBe(true);
    }
  });
});

describe("content rules", () => {
  const text = allText();

  test("no links or private paths", () => {
    for (const line of text) {
      expect(line).not.toMatch(/https?:|www\.|\/(var|home|etc|root|srv)\//i);
    }
  });

  test("no credentials", () => {
    for (const line of text) {
      expect(line).not.toMatch(/api[\s_-]?key|password|contraseña|secret/i);
    }
  });

  test("no audience figures", () => {
    for (const line of text) {
      expect(line).not.toMatch(/suscriptor|seguidor|visualizaci|\bvistas\b|\d+\s*%|\d+\s*k\b/i);
    }
  });
});
