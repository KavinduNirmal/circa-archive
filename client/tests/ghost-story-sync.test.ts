import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { escapeTemplate, renderBundle } from "../scripts/sync-corpus";

const CORPUS = readFileSync(
  resolve(process.cwd(), "public/Ghost_story.md"),
  "utf8",
);
const BUNDLE = readFileSync(
  resolve(process.cwd(), "src/components/reader/ghost-story.ts"),
  "utf8",
);

describe("corpus sync", () => {
  it("generates the committed bundle from the published corpus", () => {
    // If this fails after an edit to `public/Ghost_story.md`, run `bun run sync:corpus`.
    expect(renderBundle(CORPUS)).toBe(BUNDLE);
  });

  it("escapes only what a template literal would otherwise reinterpret", () => {
    expect(escapeTemplate("a\\b")).toBe("a\\\\b");
    expect(escapeTemplate("a`b")).toBe("a\\`b");
    expect(escapeTemplate("${x}")).toBe("\\${x}");
    // The published corpus contains a fenced code block, so the escape is exercised for real.
    expect(CORPUS).toContain("```");
  });
});
