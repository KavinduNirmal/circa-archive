import { describe, expect, it } from "vitest";
import {
  DOC_GROUPS,
  DOC_TOPICS,
  docHref,
  loadPublicDocuments,
  resolveDocLink,
  sourcePath,
} from "../src/lib/documents";
import { renderDocument } from "../src/lib/markdown";
import { archiveHref, projectHref } from "../src/lib/site";

describe("public documentation", () => {
  it("exposes exactly the four chapters and retains existing article slugs", () => {
    expect(DOC_GROUPS.map((group) => group.id)).toEqual([
      "overview",
      "lore",
      "contribution",
      "building",
    ]);
    expect(DOC_TOPICS).toHaveLength(41);
    expect(docHref("ko", "overview")).toBe("/ko/documentation/");
    expect(docHref("en", "lore-anatomy")).toBe(
      "/en/documentation/lore-anatomy/",
    );
  });
  it("loads every allowlisted locale article without importing private files", async () => {
    const documents = await loadPublicDocuments();
    expect(documents).toHaveLength(82);
    expect(
      documents.every(
        (doc) => !doc.sourcePath.includes("private") && doc.markdown.length > 0,
      ),
    ).toBe(true);
    expect(documents.find((doc) => doc.id === "ko/records")?.sourcePath).toBe(
      "docs/documentation/ko/records.md",
    );
    expect(
      documents.find((doc) => doc.id === "ko/lore-anatomy")?.contentLocale,
    ).toBe("en");
    expect(() => sourcePath("../../private/secret", "en")).toThrow();
  });
  it("resolves local links in the reader's language, preserving fragments and queries", () => {
    expect(
      resolveDocLink(
        "rendering.md?view=1#plugins",
        "docs/documentation/ko/records.md",
        "ko",
      ),
    ).toBe("/ko/documentation/rendering/?view=1#plugins");
    expect(resolveDocLink("Anchors.md", "docs/lore/Anatomy.md", "ko")).toBe(
      "/ko/documentation/lore-anchors/",
    );
    expect(
      resolveDocLink("private/Current%20rules.md", "docs/lore/README.md", "en"),
    ).toBeNull();
    expect(
      resolveDocLink("javascript:alert(1)", "docs/lore/README.md", "en"),
    ).toBeNull();
    expect(
      resolveDocLink(
        "Pasted%20image%2020261018211443.png",
        "docs/lore/Anatomy.md",
        "en",
        true,
      ),
    ).toBe("/assets/lore-anatomy.png");
  });
});

describe("safe reading and stable anchors", () => {
  it("retains heading IDs before removing the source title", async () => {
    const doc = await renderDocument(
      "---\ntitle: Metadata\n---\n# Repeated\n\n## Repeated\n\n## Repeated",
      "docs/documentation/en/records.md",
      "en",
    );
    expect(doc.title).toBe("Repeated");
    expect(doc.headings.map((h) => h.id)).toEqual(["repeated-1", "repeated-2"]);
    expect(doc.html).not.toContain("<h1");
    expect(doc.html).toContain('id="repeated-1"');
  });
  it("renders GFM, literal code, alerts, highlights and brand blocks without executing HTML", async () => {
    const doc = await renderDocument(
      '# Example\n\n<script>alert(1)</script>\n\n[bad](javascript:alert(1))\n\n## Visible\n\n| A | B |\n| - | - |\n| one | two |\n\n> [!WARNING]\n> Read this.\n\n==Marked==\n\n```brand-callout\nUseful **message**\n```\n\n```brand list\n- [Rendering](rendering.md) — Guide\n```\n\n```ts\nconst a = "==literal==";\n```',
      "docs/documentation/en/records.md",
      "en",
    );
    expect(doc.html).toContain("<table>");
    expect(doc.html).toContain('data-alert="warning"');
    expect(doc.html).toContain("<mark");
    expect(doc.html).toContain('data-brand="callout"');
    expect(doc.html).toContain('data-brand="list"');
    expect(doc.html).toContain("==literal==");
    expect(doc.html).not.toContain("<script");
    expect(doc.html).not.toContain("javascript:");
  });
});

describe("separate site origins", () => {
  it("keeps the language and archive route when leaving the project", () => {
    expect(archiveHref("ko", "/desktop")).toMatch(/\/ko\/desktop$/);
    expect(projectHref("ko", "about/team")).toBe("/ko/about/team/");
  });
});

it("identifies a repeated opening paragraph without removing Markdown content", async () => {
  const doc = await renderDocument(
    "# Title\n\nA concise introduction.\n\n## Body\n\nFull text.",
    "docs/documentation/en/overview.md",
    "en",
  );
  expect(doc.lead).toBe("A concise introduction.");
  expect(doc.html).toContain("A concise introduction.");
  expect(doc.html).toContain("Full text.");
});
