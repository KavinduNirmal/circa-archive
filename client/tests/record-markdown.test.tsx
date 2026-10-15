import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RecordMarkdown } from "@/components/reader/record-markdown";

const CORPUS = readFileSync(resolve(process.cwd(), "public/Ghost_story.md"), "utf8");

const mount = (source: string) => render(<RecordMarkdown source={source} />);
const sheet = () => document.body;

/** The mark holding one particular withheld phrase, found by its own text. */
function markFor(text: string): HTMLElement {
  const found = [...sheet().querySelectorAll<HTMLElement>("mark.reader-redaction-inline")].find(
    (mark) => mark.textContent === text,
  );
  if (!found) throw new Error(`No redaction mark holds "${text}".`);
  return found;
}

describe("record markdown viewer", () => {
  it("renders the record's headings without printing its YAML header", () => {
    mount(CORPUS);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("The Unwalled Door");
    expect(screen.getByRole("heading", { level: 2, name: "Brief" })).toBeVisible();
    expect(screen.getByRole("heading", { level: 3, name: "Filing Metadata" })).toBeVisible();
    expect(sheet()).not.toHaveTextContent("circa_code");
    expect(sheet()).not.toHaveTextContent("CIRCA-S-03007\n---");
  });

  it("renders the repaired table whole, at the width the parser intended", () => {
    mount(CORPUS);
    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("row")).toHaveLength(7);
    // Four columns: one header cell and six body cells in each.
    expect(table.querySelectorAll("th")).toHaveLength(4);
    expect(within(table).getAllByRole("cell")).toHaveLength(24);
    expect(within(table).getByText("S-05")).toBeVisible();
  });

  it("floats a figure the way its directive asked, with a caption and no prefix", () => {
    mount(CORPUS);
    const figures = sheet().querySelectorAll("figure[data-align]");
    expect([...figures].map((figure) => figure.getAttribute("data-align"))).toEqual(["right", "full", "left"]);
    const caption = figures[0].querySelector("figcaption");
    expect(caption?.textContent).toMatch(/^Figure 1\./);
    expect(sheet()).not.toHaveTextContent("right|Figure");
    expect(figures[0].querySelector("img")).toHaveAccessibleName(/^Figure 1\./);
  });

  it("draws a redaction as a labelled mark rather than as its own text", () => {
    mount(CORPUS);
    const marks = sheet().querySelectorAll("mark.reader-redaction-inline");
    expect(marks).toHaveLength(6);
    for (const mark of marks) expect(mark).toHaveAccessibleName(/redacted/i);
    // The word is present in the DOM so it can be revealed, but not as plain reading.
    const note = markFor("not to be approached");
    expect(note).toHaveTextContent("not to be approached");
    expect(note).toHaveAttribute("data-revealed", "false");
  });

  it("reveals a redaction only when the reader asks for it", async () => {
    const user = userEvent.setup();
    mount(CORPUS);
    const mark = markFor("not to be approached");
    await user.click(mark);
    expect(mark).toHaveAttribute("data-revealed", "true");
    expect(within(mark).getByText("not to be approached")).not.toHaveAttribute("aria-hidden");
    await user.click(mark);
    expect(mark).toHaveAttribute("data-revealed", "false");
  });

  it("drops the renderer's own legend comment rather than rendering it", () => {
    mount(CORPUS);
    expect(sheet().querySelector("script")).toBeNull();
    expect(sheet().innerHTML).not.toContain("SYNTAX LEGEND");
    expect(sheet().innerHTML).not.toContain("<!--");
  });

  it("emits a real list for a bulleted source, so the sheet's markers have something to style", () => {
    mount("## Both readings\n\n- Station A, upper estuary: high water 04:07\n- Station B, lower estuary: high water 04:18\n");
    const list = screen.getByRole("list");
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    expect(within(list).getAllByRole("listitem")[0]).toHaveTextContent("high water 04:07");
  });

  it("treats a record's markup as text: script and javascript: links are inert", () => {
    mount("# A record\n\n<script>window.__pwned = true;</script>\n\n[click](javascript:alert(1))\n");
    expect(sheet().querySelector("script")).toBeNull();
    const link = screen.getByText("click").closest("a");
    expect(link?.getAttribute("href") ?? "").not.toMatch(/^javascript:/i);
  });
});
