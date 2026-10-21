import { describe, expect, it } from "vitest";
import {
  ACTIVE_LABELS,
  CHANGE_LABELS,
  MARKDOWN_TOOLS,
  applyChange,
  detectActive,
  findTool,
  formatCounts,
  markupStyle,
  textStats,
} from "@/components/word/document-model";
import { TEXT_SIZE_LABELS } from "@/components/word/word-identity";

/** The cases below are written against this helper so a literal reads plainly. */
const text = (body: string) => body;

describe("tool table", () => {
  it("names every tool and gives each one a distinct id", () => {
    const ids = MARKDOWN_TOOLS.map((tool) => tool.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const tool of MARKDOWN_TOOLS) {
      expect(tool.label.length).toBeGreaterThan(0);
      expect(tool.group.length).toBeGreaterThan(0);
    }
  });

  it("finds a tool by id and reports an unknown one", () => {
    expect(findTool("bold")?.label).toBe("B");
    expect(findTool("nope")).toBeUndefined();
  });
});

describe("inline markup", () => {
  it("wraps a selection and puts the caret inside the markers", () => {
    const result = applyChange(text("bravo"), { start: 0, end: 5 }, "bold");
    expect(result.text).toBe("**bravo**");
    expect(result.selection).toEqual({ start: 2, end: 7 });
  });

  it("unwraps a selection that is already wrapped", () => {
    const source = text("say **bravo** now");
    const result = applyChange(source, { start: 6, end: 11 }, "bold");
    expect(result.text).toBe("say bravo now");
    expect(result.selection).toEqual({ start: 4, end: 9 });
  });

  it("drops the markers when the selection includes them", () => {
    const result = applyChange(text("**bravo**"), { start: 0, end: 9 }, "bold");
    expect(result.text).toBe("bravo");
  });

  it("inserts the markers and drops the caret between them when nothing is selected", () => {
    const result = applyChange(text("bravo"), { start: 5, end: 5 }, "italic");
    expect(result.text).toBe("bravo**");
    expect(result.selection).toEqual({ start: 6, end: 6 });
  });
});

describe("line prefixes", () => {
  it("adds a heading marker to the line the caret is on", () => {
    const result = applyChange(
      text("Black dog\nsecond line"),
      { start: 3, end: 3 },
      "heading1",
    );
    expect(result.text).toBe("# Black dog\nsecond line");
    expect(result.selection).toEqual({ start: 5, end: 5 });
  });

  it("replaces an existing heading rather than stacking markers", () => {
    const result = applyChange(
      text("## Black dog"),
      { start: 4, end: 4 },
      "heading1",
    );
    expect(result.text).toBe("# Black dog");
    // Dropping the extra `#` moves the caret one place left with the line.
    expect(result.selection).toEqual({ start: 3, end: 3 });
  });

  it("removes the marker when the line already has it", () => {
    const result = applyChange(
      text("# Black dog"),
      { start: 4, end: 4 },
      "heading1",
    );
    expect(result.text).toBe("Black dog");
    expect(result.selection).toEqual({ start: 2, end: 2 });
  });

  it("prefixes every line a selection touches", () => {
    const source = text("one\ntwo\nthree");
    const result = applyChange(source, { start: 0, end: 7 }, "bullets");
    expect(result.text).toBe("- one\n- two\nthree");
    expect(result.selection).toEqual({ start: 2, end: 11 });
  });

  it("numbers a list from one", () => {
    const result = applyChange(
      text("one\ntwo"),
      { start: 0, end: 7 },
      "numbers",
    );
    expect(result.text).toBe("1. one\n1. two");
  });

  it("does not number the line after a trailing newline", () => {
    const result = applyChange(text("one\n"), { start: 0, end: 4 }, "numbers");
    expect(result.text).toBe("1. one\n");
  });

  it("quotes a block and unquotes it again", () => {
    const quoted = applyChange(text("one\ntwo"), { start: 0, end: 3 }, "quote");
    expect(quoted.text).toBe("> one\ntwo");
    const unquoted = applyChange(quoted.text, quoted.selection, "quote");
    expect(unquoted.text).toBe("one\ntwo");
  });
});

describe("block insertions", () => {
  it("fences the selection as a code block on its own lines", () => {
    const result = applyChange(
      text("const a = 1;"),
      { start: 0, end: 12 },
      "codeblock",
    );
    expect(result.text).toBe("```\nconst a = 1;\n```");
  });

  it("puts a rule on its own line", () => {
    const result = applyChange(text("one\ntwo"), { start: 3, end: 3 }, "rule");
    expect(result.text).toBe("one\n\n---\n\ntwo");
  });

  it("maps every tool id to a change this module can apply", () => {
    for (const tool of MARKDOWN_TOOLS) {
      const result = applyChange("**one**\ntwo", { start: 0, end: 7 }, tool.id);
      expect(result.text, `${tool.id} did nothing`).not.toBe("**one**\ntwo");
      expect(result.selection.start).toBeLessThanOrEqual(result.selection.end);
      expect(result.selection.end).toBeLessThanOrEqual(result.text.length);
    }
  });
});

describe("link and image insertions", () => {
  it("wraps the selection as link text and leaves the caret in the address", () => {
    const result = applyChange(
      text("see the brief"),
      { start: 4, end: 15 },
      "link",
      "https://archive.local/x",
    );
    expect(result.text).toBe("see [the brief](https://archive.local/x)");
    // With an address supplied the caret lands after it, ready for the next word.
    expect(result.selection).toEqual({ start: 40, end: 40 });
  });

  it("leaves the caret in the address when none was given", () => {
    const result = applyChange(text("see brief"), { start: 4, end: 9 }, "link");
    expect(result.text).toBe("see [brief]()");
    expect(result.selection).toEqual({ start: 12, end: 12 });
  });

  it("inserts an image with alt text from the selection", () => {
    const result = applyChange(
      text("map"),
      { start: 0, end: 3 },
      "image",
      "/icons/map.png",
    );
    expect(result.text).toBe("![map](/icons/map.png)");
  });

  it("inserts an unregistered table from the careted line", () => {
    const result = applyChange(text("one"), { start: 3, end: 3 }, "table");
    expect(result.text).toContain("| Column | Column |");
    expect(result.text).toContain("| --- | --- |");
    expect(result.text).toContain("| Cell | Cell |");
  });
});

describe("what the caret is sitting in", () => {
  const active = (text: string, position = text.length) =>
    detectActive(text, { start: position, end: position });

  it("reports the inline markers that enclose the caret", () => {
    expect(active("say **bravo** now", 7)).toContain("bold");
    expect(active("say *bravo* now", 6)).toContain("italic");
    expect(active("say ~~bravo~~ now", 7)).toContain("strike");
    expect(active("say `bravo` now", 7)).toContain("code");
    expect(active("plain bravo here", 8)).toEqual([]);
  });

  it("reports the block the caret is on", () => {
    expect(active("# Black dog", 5)).toContain("heading1");
    expect(active("## Black dog", 5)).toContain("heading2");
    expect(active("### Black dog", 6)).toContain("heading3");
    expect(active("- one", 3)).toContain("bullets");
    expect(active("1. one", 3)).toContain("numbers");
    expect(active("> one", 3)).toContain("quote");
    expect(active("```\ncode\n```", 6)).toContain("codeblock");
  });

  it("reports nothing for a plain paragraph", () => {
    expect(active("just prose", 5)).toEqual([]);
  });
});

describe("statistics", () => {
  it("counts words, lines, characters, and paragraphs", () => {
    const stats = textStats("Black dog\n\nsecond line here");
    expect(stats.words).toBe(5);
    expect(stats.lines).toBe(3);
    expect(stats.paragraphs).toBe(2);
    expect(stats.characters).toBe(27);
  });

  it("counts an empty document as no lines rather than one", () => {
    expect(textStats("")).toEqual({
      words: 0,
      lines: 0,
      characters: 0,
      paragraphs: 0,
    });
  });

  it("ignores whitespace-only text when counting words", () => {
    expect(textStats("   \n  ").words).toBe(0);
  });

  it("formats the status bar's count cell", () => {
    expect(formatCounts(textStats("one two three"))).toBe(
      "3 words, 1 line, 13 characters",
    );
    expect(formatCounts(textStats("one"))).toBe("1 word, 1 line, 3 characters");
  });
});

describe("copy the chrome needs", () => {
  it("labels every change for the status bar", () => {
    for (const tool of MARKDOWN_TOOLS) {
      expect(CHANGE_LABELS[tool.id].length).toBeGreaterThan(0);
    }
  });

  it("names the active state of every tool that can be detected", () => {
    for (const label of ACTIVE_LABELS) {
      expect(findTool(label)).toBeDefined();
    }
  });

  it("offers three text sizes and a body-versus-heading style choice", () => {
    expect(Object.keys(TEXT_SIZE_LABELS)).toEqual(["small", "normal", "large"]);
    expect(markupStyle("# one")).toBe("heading");
    expect(markupStyle("one")).toBe("body");
  });
});
