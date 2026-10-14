import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Landing from "@/app/page";
import { TERMINAL } from "@/components/site/terminal-copy";
import {
  BRIEF,
  BUILDER_STEPS,
  DOCUMENTS,
  FILINGS,
  HINGE,
  LAYOUT,
  ORGANIZATIONS,
  PROJECT,
  SPECIMEN,
  STACK,
  TRACKS,
  WRITER_FILINGS,
  WRITER_RULES,
  WRITER_STEPS,
} from "@/components/site/site-meta";

/** Reads the movements in document order, which is the page's composition. */
function movements(container: HTMLElement) {
  const terminal = container.querySelector("#terminal");
  const hinge = container.querySelector(".hinge");
  const brief = container.querySelector("#brief");
  if (!terminal || !hinge || !brief) throw new Error("the page is missing a movement");
  const follows = (first: Element, second: Element) =>
    Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);
  return { terminal, hinge, brief, follows };
}

describe("the archive half", () => {
  it("opens on the Commission, in its own voice, with one way in", () => {
    render(<Landing />);
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(TERMINAL.wordmark);
    expect(screen.getByText(PROJECT.commission)).toBeVisible();
    expect(screen.getByText(TERMINAL.address)).toBeVisible();
    // The doctrine is quoted, not paraphrased: it is the archive's own rule.
    expect(screen.getByText(PROJECT.doctrine)).toBeVisible();
    const enter = screen.getByRole("link", { name: new RegExp(TERMINAL.entry.cta, "i") });
    expect(enter).toHaveAttribute("href", "/desktop");
    expect(enter).toHaveClass("terminal-enter");
  });

  it("keeps the fiction and the project on opposite sides of one hinge", () => {
    const { container } = render(<Landing />);
    const { terminal, hinge, brief, follows } = movements(container);
    expect(follows(terminal, hinge)).toBe(true);
    expect(follows(hinge, brief)).toBe(true);
    expect(screen.getByText(HINGE.label)).toBeVisible();
    expect(screen.getByText(HINGE.line)).toBeVisible();
    // Inside the fiction there is nowhere to go but into the machine or down the page.
    for (const link of within(terminal as HTMLElement).getAllByRole("link")) {
      expect(link.getAttribute("href")).toMatch(/^(\/desktop|#)/);
    }
    // The brief is the project's: no repository link is invented inside it either.
    for (const link of within(brief as HTMLElement).queryAllByRole("link")) {
      expect(link.getAttribute("href")).toMatch(/^#/);
    }
  });

  it("files the ledger from the archive's own index", () => {
    render(<Landing />);
    const ledger = screen.getByRole("table", { name: TERMINAL.ledger.label });
    for (const filing of FILINGS) {
      expect(within(ledger).getByText(filing.code)).toBeVisible();
    }
    // A withheld designation stays on the index and says so.
    const withheld = FILINGS.find((filing) => filing.designation === null);
    expect(withheld).toBeDefined();
    expect(within(ledger).getAllByText(TERMINAL.ledger.withheld).length).toBeGreaterThan(0);
  });

  it("sets the specimen on paper beside the fields an entry carries", () => {
    const { container } = render(<Landing />);
    const filing = container.querySelector(".terminal-filing");
    if (!filing) throw new Error("the filing specimen is missing");
    const sheet = within(filing as HTMLElement);
    expect(sheet.getByText(SPECIMEN.code)).toBeVisible();
    expect(sheet.getByText(SPECIMEN.designation ?? "")).toBeVisible();
    expect(filing).toHaveTextContent(SPECIMEN.abstract);
    for (const field of TERMINAL.filing.fields) {
      expect(sheet.getByText(field.key)).toBeVisible();
    }
  });

  it("names the organizations the index resolves, and what they call the phenomenon", () => {
    const { container } = render(<Landing />);
    const table = screen.getByRole("table", { name: TERMINAL.organizations.label });
    expect(within(table).getAllByRole("row").length).toBe(ORGANIZATIONS.length + 1);
    for (const organization of ORGANIZATIONS) {
      expect(within(table).getByText(organization.code)).toBeVisible();
      expect(
        within(table).getByText(TERMINAL.organizations.vocabulary[organization.code]),
      ).toBeVisible();
    }
    expect(container.querySelector("#terminal")).toHaveTextContent(PROJECT.doctrine);
  });
});

describe("the project half", () => {
  it("divides the brief into two tracks and points at both", () => {
    const { container } = render(<Landing />);
    expect(screen.getByRole("heading", { name: BRIEF.title })).toBeVisible();
    const contents = screen.getByRole("navigation", { name: BRIEF.contentsLabel });
    for (const track of TRACKS) {
      const link = within(contents).getByRole("link", { name: new RegExp(track.title, "i") });
      expect(link).toHaveAttribute("href", `#${track.id}`);
      const section = container.querySelector(`#${track.id}`);
      expect(section).not.toBeNull();
      expect(section?.getAttribute("aria-labelledby")).toBe(`${track.id}-title`);
      expect(within(section as HTMLElement).getByRole("heading", { name: track.title })).toBeVisible();
      expect(within(section as HTMLElement).getByText(track.lead)).toBeVisible();
    }
  });

  it("tells a writer what to file, what the canon holds, and how to start", () => {
    const { container } = render(<Landing />);
    const writers = container.querySelector("#writers") as HTMLElement;
    for (const filing of WRITER_FILINGS) {
      expect(within(writers).getByText(filing.title)).toBeVisible();
      expect(within(writers).getByText(filing.code)).toBeVisible();
    }
    for (const rule of WRITER_RULES) {
      expect(within(writers).getByText(rule.title)).toBeVisible();
    }
    for (const step of WRITER_STEPS) {
      expect(within(writers).getByText(step.title)).toBeVisible();
    }
    // The lore's home is named, so a writer knows where the work lands.
    expect(within(writers).getByText("docs/lore/")).toBeVisible();
  });

  it("tells a developer what runs, what is planned, and how to verify", () => {
    const { container } = render(<Landing />);
    const developers = container.querySelector("#developers") as HTMLElement;
    const stack = within(developers).getByRole("table", { name: BRIEF.stackLabel });
    expect(within(stack).getByText(PROJECT.status)).toBeVisible();
    for (const row of STACK) {
      const line = within(stack).getByText(row.key).closest("tr");
      if (!line) throw new Error(`${row.key} is not in a row`);
      expect(line).toHaveTextContent(row.value);
      expect(line).toHaveAttribute("data-state", row.state);
    }
    for (const step of BUILDER_STEPS) {
      expect(within(developers).getByText(step.title)).toBeVisible();
    }
    for (const row of LAYOUT) {
      expect(within(developers).getByText(row.path)).toBeVisible();
    }
    // The documents close the brief for both tracks, so they sit outside either one.
    const brief = container.querySelector("#brief") as HTMLElement;
    for (const document of DOCUMENTS) {
      expect(within(brief).getByText(document.path)).toBeVisible();
    }
  });

  it("copies a command and says so, and reports a blocked clipboard instead of failing quietly", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<Landing />);
    const precommit = screen.getByRole("button", { name: "Copy bun run precommit" });
    fireEvent.click(precommit);
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("bun run precommit"));
    expect(await screen.findByText("Copied")).toBeVisible();

    writeText.mockRejectedValueOnce(new Error("denied"));
    fireEvent.click(precommit);
    expect(await screen.findByText("Copy blocked")).toBeVisible();
    Reflect.deleteProperty(navigator, "clipboard");
  });
});
