import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RecordFilingBody } from "@/components/reader/record-filings";
import { useReaderSession } from "@/components/reader/reader-session";
import { RecordReader, type RecordTrail } from "@/components/reader/reader-window";
import type { ReaderSection } from "@/components/reader/reader-model";

const READER = "Record Viewer";

/**
 * The viewer is hosted by the workstation, so these tests mount it the way the
 * shell does: a window frame around it, the session hook for the reviewer, the
 * trail the shell owns, and the filing source handing the sheet its body
 * through the slot.
 */
function Harness({ codes, at = 0, slot = true, onCloseWindow = () => {} }: {
  codes: readonly string[];
  at?: number;
  slot?: boolean;
  onCloseWindow?: () => void;
}) {
  const session = useReaderSession();
  const [trail, setTrail] = useState<RecordTrail>({ codes, at });
  return (
    <div role="dialog" aria-label={READER} className="workstation-window">
      <RecordReader
        trail={trail}
        session={session}
        onOpenRecord={(code) => setTrail((current) => {
          if (current.codes[current.at] === code) return current;
          const codes = [...current.codes.slice(0, current.at + 1), code];
          return { codes, at: codes.length - 1 };
        })}
        onTravel={(delta) => setTrail((current) => {
          const next = current.at + delta;
          return next < 0 || next >= current.codes.length ? current : { ...current, at: next };
        })}
        onCloseWindow={onCloseWindow}
        renderSection={slot ? (section: ReaderSection) => <RecordFilingBody section={section} /> : undefined}
      />
    </div>
  );
}

function mount(code: string | null, slot = true) {
  render(<Harness codes={code ? [code] : []} slot={slot} />);
  const reader = screen.getByRole("dialog", { name: READER });
  return {
    reader,
    status: () => within(reader).getByRole("status").textContent ?? "",
    sheet: () => reader.querySelector(".reader-sheet") as HTMLElement,
  };
}

/** Signs the guest in at the credentials prompt the engagement controls raise. */
async function verify(user: ReturnType<typeof userEvent.setup>) {
  const prompt = await screen.findByRole("alertdialog");
  expect(prompt).toHaveTextContent(/reviewer session/i);
  await user.click(within(prompt).getByRole("button", { name: "Enter" }));
  expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
}

const notes = (reader: HTMLElement) => within(reader).getByRole("complementary", { name: "Annotations" });

describe("record reader frame", () => {
  it("frames a record without rendering it: sections are anchors and the body is the host's slot", () => {
    const { reader, sheet } = mount("INC-00042", false);
    // The record's identity belongs to the frame, because that copy is the catalogue's.
    expect(within(sheet()).getByRole("heading", { level: 1 })).toHaveTextContent("Stairwell interval, repeated landing");
    expect(within(sheet()).getByText("INC-00042")).toBeVisible();
    expect(within(sheet()).getByText(/LEVEL 4/)).toBeVisible();
    const sections = sheet().querySelectorAll("section.reader-section");
    expect(sections).toHaveLength(4);
    expect(sections[0]).toHaveAttribute("id", "reader-section-brief");
    expect(sections[0]).toHaveAccessibleName("Brief");
    // Not one word of the filing is on the sheet: the container only holds a slot.
    expect(sections[0]).toHaveTextContent("");
    expect(sheet()).not.toHaveTextContent("Three surveyors climbed");
    expect(within(reader).getByRole("region", { name: "Subsequent Records" })).toBeVisible();
  });

  it("hands the sheet's body to whatever the host mounts in the slot", () => {
    const { sheet } = mount("INC-00042");
    expect(within(sheet()).getByRole("heading", { name: "Field account" })).toBeVisible();
    expect(sheet()).toHaveTextContent("Three surveyors climbed the same stairwell");
  });

  it("opens with the reader's own status line rather than the frame's generic strip", () => {
    const { reader, status } = mount("INC-00042");
    expect(within(reader).getByRole("toolbar", { name: "Reader controls" })).toBeVisible();
    expect(within(reader).getByRole("navigation", { name: "Sections" })).toBeVisible();
    expect(within(reader).getByRole("complementary", { name: "Annotations" })).toBeVisible();
    expect(status()).toMatch(/opened INC-00042, 4 sections/i);
    expect(within(reader).getByText("Preview record")).toBeVisible();
  });

  it("opens nothing at all when the workstation has no record to show", () => {
    const { sheet } = mount(null);
    expect(within(sheet()).getByText(/no record is open/i)).toBeVisible();
    expect(sheet().querySelectorAll("section.reader-section")).toHaveLength(0);
  });

  it("reports a code the archive index does not carry instead of an empty sheet", () => {
    const { sheet, status } = mount("INC-99999");
    expect(within(sheet()).getByText(/no entry carries this code/i)).toBeVisible();
    expect(status()).toMatch(/not in the index/i);
  });

  it("closes the window from the reader's own control", async () => {
    const user = userEvent.setup();
    const onCloseWindow = vi.fn();
    render(<Harness codes={["INC-00042"]} onCloseWindow={onCloseWindow} />);
    await user.click(screen.getByRole("button", { name: "Close reader" }));
    expect(onCloseWindow).toHaveBeenCalledTimes(1);
  });
});

describe("record reader toolbar", () => {
  it("carries the document actions and the engagement controls", () => {
    const { reader } = mount("INC-00042");
    for (const name of ["View", "Scale down", "Scale up", "Fit to margin", "Rotate", "Print", "Download", "Search", "Comment", "Corroborate", "Contest"]) {
      expect(within(reader).getByRole("button", { name }), name).toBeVisible();
    }
    expect(within(reader).getByRole("radiogroup", { name: "Reviewer Assessment" })).toBeVisible();
    for (const point of ["—", "Marginal", "Adequate", "Sound", "Exemplary"]) {
      expect(within(reader).getByRole("radio", { name: point }), point).toBeVisible();
    }
  });

  it("steps the scale in tens and resets to one hundred when the readout itself is pressed", async () => {
    const user = userEvent.setup();
    const { reader } = mount("INC-00042");
    await user.click(within(reader).getByRole("button", { name: "Scale up" }));
    expect(within(reader).getByRole("button", { name: "110%" })).toBeVisible();
    await user.click(within(reader).getByRole("button", { name: "Scale down" }));
    await user.click(within(reader).getByRole("button", { name: "Scale down" }));
    expect(within(reader).getByRole("button", { name: "90%" })).toBeVisible();
    await user.click(within(reader).getByRole("button", { name: "90%" }));
    expect(within(reader).getByRole("button", { name: "100%" })).toBeVisible();
  });

  it("stops the scale at both ends and says why the button is spent", async () => {
    const user = userEvent.setup();
    const { reader } = mount("INC-00042");
    const up = within(reader).getByRole("button", { name: "Scale up" });
    for (let step = 0; step < 7; step += 1) await user.click(up);
    expect(within(reader).getByRole("button", { name: "160%" })).toBeVisible();
    expect(up).toBeDisabled();
    expect(up).toHaveAttribute("title", "The reader stops at 160 percent");
    const down = within(reader).getByRole("button", { name: "Scale down" });
    for (let step = 0; step < 9; step += 1) await user.click(down);
    expect(down).toBeDisabled();
    expect(within(reader).getByRole("button", { name: "80%" })).toBeVisible();
  });

  it("toggles the measure from the text column to the whole margin", async () => {
    const user = userEvent.setup();
    const { reader } = mount("INC-00042");
    const sheet = screen.getByTestId("reader-sheet");
    const fit = within(reader).getByRole("button", { name: "Fit to margin" });
    expect(sheet).toHaveAttribute("data-fit", "measured");
    await user.click(fit);
    expect(sheet).toHaveAttribute("data-fit", "margin");
    expect(fit).toHaveAttribute("aria-pressed", "true");
    await user.click(fit);
    expect(sheet).toHaveAttribute("data-fit", "measured");
  });

  it("works silently on the three controls it ships and never wires", async () => {
    const user = userEvent.setup();
    const { reader, status } = mount("INC-00042");
    const before = status();
    for (const name of ["Rotate", "Print", "Download"]) {
      const control = within(reader).getByRole("button", { name });
      expect(control, name).toBeEnabled();
      await user.click(control);
      // Nothing is refused out loud: no notice, no dialog, and the control stays as it was.
      expect(screen.queryByRole("alertdialog"), name).not.toBeInTheDocument();
      expect(within(reader).getByRole("button", { name }), name).toBeEnabled();
    }
    expect(status()).toBe(before);
    expect(within(reader).getByRole("button", { name: "Download" })).toHaveAttribute("title", "Unavailable at this clearance.");
  });

  it("changes the page arrangement from the View menu", async () => {
    const user = userEvent.setup();
    const { reader, sheet } = mount("INC-00042");
    expect(sheet()).toHaveAttribute("data-view", "continuous");
    expect(within(sheet()).getAllByRole("region")).toHaveLength(4);
    await user.click(within(reader).getByRole("button", { name: "View" }));
    await user.click(await screen.findByRole("menuitemradio", { name: "Single page" }));
    expect(sheet()).toHaveAttribute("data-view", "single");
    // One page at a time: the sheet holds the current section and nothing else.
    expect(within(sheet()).getAllByRole("region")).toHaveLength(1);
    await user.click(within(reader).getByRole("button", { name: "View" }));
    await user.click(await screen.findByRole("menuitemradio", { name: "Two-up" }));
    expect(sheet()).toHaveAttribute("data-view", "two-up");
    expect(within(sheet()).getAllByRole("region")).toHaveLength(4);
  });
});

describe("record reader sections rail", () => {
  it("previews every section with its printed number and its heading", () => {
    const { reader } = mount("INC-00042");
    const rail = within(reader).getByRole("navigation", { name: "Sections" });
    const previews = [...rail.querySelectorAll(".reader-preview")];
    expect(previews.map((item) => item.getAttribute("aria-label"))).toEqual([
      "01 Brief",
      "02 Field account",
      "03 Measurement",
      "04 Disposition",
    ]);
  });

  it("marks the current section, moves the sheet to the one chosen, and calls the sheet by its anchor", async () => {
    const user = userEvent.setup();
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const { reader, sheet } = mount("INC-00042");
    const rail = within(reader).getByRole("navigation", { name: "Sections" });
    expect(within(rail).getByRole("button", { name: "01 Brief" })).toHaveAttribute("aria-current", "true");
    await user.click(within(rail).getByRole("button", { name: "03 Measurement" }));
    expect(within(rail).getByRole("button", { name: "03 Measurement" })).toHaveAttribute("aria-current", "true");
    expect(scrollIntoView).toHaveBeenCalled();
    expect(sheet().querySelector("#reader-section-measurement")).not.toBeNull();
  });

  it("marks a section whose body the archive withheld, in the rail and on the sheet", () => {
    const { reader, sheet } = mount("INC-00042");
    const rail = within(reader).getByRole("navigation", { name: "Sections" });
    expect(within(rail).getByRole("button", { name: "04 Disposition" })).toHaveAttribute("data-withheld", "true");
    expect(sheet().querySelector("#reader-section-disposition")).toHaveAttribute("data-withheld", "true");
    expect(sheet()).toHaveTextContent(/sealed at Level 5/i);
  });

  it("collapses the rail to a strip and expands it again", async () => {
    const user = userEvent.setup();
    const { reader } = mount("INC-00042");
    const rail = within(reader).getByRole("navigation", { name: "Sections" });
    const hide = within(rail).getByRole("button", { name: "Hide sections" });
    expect(hide).toHaveAttribute("aria-expanded", "true");
    await user.click(hide);
    expect(rail).toHaveAttribute("data-collapsed", "true");
    expect(within(rail).getByRole("button", { name: "Show sections" })).toHaveAttribute("aria-expanded", "false");
    await user.click(within(rail).getByRole("button", { name: "Show sections" }));
    expect(rail).not.toHaveAttribute("data-collapsed");
  });

  it("collapses both rails by default on a window too narrow to hold them", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("matchMedia", vi.fn(() => ({
      matches: true, media: "(max-width: 1023px)", onchange: null,
      addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    })));
    try {
      const { reader } = mount("INC-00042");
      const left = within(reader).getByRole("navigation", { name: "Sections" });
      const right = within(reader).getByRole("complementary", { name: "Annotations" });
      expect(left).toHaveAttribute("data-collapsed", "true");
      expect(right).toHaveAttribute("data-collapsed", "true");
      // A default is still a default: the reader can open one.
      await user.click(within(left).getByRole("button", { name: "Show sections" }));
      expect(left).not.toHaveAttribute("data-collapsed");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("finds matches on the sheet and says how many it found", async () => {
    const user = userEvent.setup();
    const { reader } = mount("INC-00042");
    await user.click(within(reader).getByRole("button", { name: "Search" }));
    const field = within(reader).getByLabelText("Search this record");
    await user.type(field, "door plate");
    expect(within(reader).getByTestId("reader-match-count")).toHaveTextContent("1 match for door plate.");
    await user.clear(field);
    await user.type(field, "quay");
    expect(within(reader).getByTestId("reader-match-count")).toHaveTextContent("No matches for quay.");
  });
});

describe("record reader annotations rail", () => {
  it("files a marginal note as a reviewer, against the section on the screen", async () => {
    const user = userEvent.setup();
    const { reader } = mount("INC-00014");
    const rail = notes(reader);
    // Nobody has written in this record's margin.
    expect(within(rail).getByText("No annotations filed.")).toBeVisible();
    expect(within(rail).getByText("Correspondents may add notes below.")).toBeVisible();
    await user.type(within(rail).getByLabelText("File a note."), "The wagon list is short by one.");
    await user.click(within(rail).getByRole("button", { name: "File note" }));
    // A guest is asked to verify first, and the note is filed once they do.
    await verify(user);
    expect(within(rail).getByText("The wagon list is short by one.")).toBeVisible();
    expect(within(rail).queryByText("No annotations filed.")).not.toBeInTheDocument();
    expect(within(rail).getByText("Brief")).toBeVisible();
    expect(within(rail).getByText("H. Kim")).toBeVisible();
  });

  it("shows the correspondence already filed against a record, replies and all", () => {
    const { reader } = mount("INC-00042");
    const rail = notes(reader);
    expect(within(rail).getByText("R. Adeyemi")).toBeVisible();
    expect(within(rail).getByText(/the second one this year/i)).toBeVisible();
    // The reply sits under its note, and only a note can be replied to.
    expect(within(rail).getByText("H. Kim")).toBeVisible();
    expect(within(rail).getByText(/reported the difference/i)).toBeVisible();
    expect(within(rail).getAllByRole("button", { name: "Reply" })).toHaveLength(2);
  });

  it("endorses a note under the reviewer's own session", async () => {
    const user = userEvent.setup();
    const { reader } = mount("INC-00042");
    const rail = notes(reader);
    await user.click(within(rail).getByRole("button", { name: "Noted 4" }));
    await verify(user);
    expect(within(rail).getByRole("button", { name: "Noted 5" })).toBeVisible();
  });

  it("counts the annotations on the tab when the rail is collapsed", async () => {
    const user = userEvent.setup();
    const { reader } = mount("INC-00042");
    const rail = notes(reader);
    await user.click(within(rail).getByRole("button", { name: "Hide annotations" }));
    expect(rail).toHaveAttribute("data-collapsed", "true");
    expect(within(rail).getByTestId("reader-annotation-count")).toHaveTextContent("2");
  });

  it("opens the rail and puts the caret in the composer when Comment is pressed", async () => {
    const user = userEvent.setup();
    const { reader } = mount("INC-00042");
    const rail = notes(reader);
    await user.click(within(rail).getByRole("button", { name: "Hide annotations" }));
    await user.click(within(reader).getByRole("button", { name: "Comment" }));
    expect(rail).not.toHaveAttribute("data-collapsed");
    expect(within(rail).getByLabelText("File a note.")).toHaveFocus();
  });
});

describe("record reader engagement", () => {
  it("keeps the assessment and the vote as two separate signals", async () => {
    const user = userEvent.setup();
    const { reader } = mount("INC-00042");
    await user.click(within(reader).getByRole("radio", { name: "Sound" }));
    await verify(user);
    expect(within(reader).getByRole("radio", { name: "Sound" })).toBeChecked();
    await user.click(within(reader).getByRole("button", { name: "Corroborate" }));
    // A sound record can still be contested: quality and agreement are not one scale.
    expect(within(reader).getByRole("button", { name: "Corroborate" })).toHaveAttribute("aria-pressed", "true");
    expect(within(reader).getByRole("radio", { name: "Sound" })).toBeChecked();
    await user.click(within(reader).getByRole("button", { name: "Contest" }));
    expect(within(reader).getByRole("button", { name: "Contest" })).toHaveAttribute("aria-pressed", "true");
    expect(within(reader).getByRole("button", { name: "Corroborate" })).toHaveAttribute("aria-pressed", "false");
    expect(within(reader).getByRole("radio", { name: "Sound" })).toBeChecked();
  });

  it("asks a guest to verify once and then remembers the session", async () => {
    const user = userEvent.setup();
    const { reader } = mount("INC-00042");
    await user.click(within(reader).getByRole("radio", { name: "Adequate" }));
    await verify(user);
    expect(within(reader).getByRole("radio", { name: "Adequate" })).toBeChecked();
    // The second act of engagement is not gated again.
    await user.click(within(reader).getByRole("button", { name: "Corroborate" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(within(reader).getByRole("button", { name: "Corroborate" })).toHaveAttribute("aria-pressed", "true");
  });
});

describe("record reader follow-ups", () => {
  it("separates the records filed against this one from the records it cites", () => {
    const { reader } = mount("INC-00042");
    const strip = within(reader).getByRole("region", { name: "Subsequent Records" });
    const inbound = within(strip).getByRole("list", { name: "Filed against this record" });
    const outbound = within(strip).getByRole("list", { name: "Cited in this record" });
    expect(within(inbound).getByRole("button", { name: /INC-00204/ })).toBeVisible();
    expect(within(outbound).getByRole("button", { name: /INC-00014/ })).toBeVisible();
    // A card describes the record it opens, from the archive's own entry.
    expect(within(inbound).getByRole("button", { name: /INC-00204/ })).toHaveTextContent("Rumor");
    expect(within(inbound).getByRole("button", { name: /INC-00204/ })).toHaveTextContent(/no originating document/i);
    expect(within(inbound).getByRole("button", { name: /INC-00204/ })).toHaveAccessibleName(/ORG-A-020748/);
  });

  it("opens a follow-up in the same viewer and walks back to where it started", async () => {
    const user = userEvent.setup();
    const { reader, sheet } = mount("INC-00042");
    const strip = within(reader).getByRole("region", { name: "Subsequent Records" });
    expect(within(reader).getByRole("button", { name: "Previous record" })).toBeDisabled();
    await user.click(within(strip).getByRole("button", { name: /INC-00014/ }));
    expect(within(sheet()).getByRole("heading", { level: 1 })).toHaveTextContent("Unlogged freight car, northbound");
    const back = within(reader).getByRole("button", { name: "Previous record" });
    expect(back).toBeEnabled();
    await user.click(back);
    expect(within(sheet()).getByRole("heading", { level: 1 })).toHaveTextContent("Stairwell interval, repeated landing");
    expect(within(reader).getByRole("button", { name: "Previous record" })).toBeDisabled();
    await user.click(within(reader).getByRole("button", { name: "Next record" }));
    expect(within(sheet()).getByRole("heading", { level: 1 })).toHaveTextContent("Unlogged freight car, northbound");
  });

  it("puts the whole filing tray away when the reader would rather have the sheet", async () => {
    const user = userEvent.setup();
    const { reader, sheet } = mount("INC-00042");
    const strip = within(reader).getByRole("region", { name: "Subsequent Records" });
    expect(within(strip).getAllByRole("list")).toHaveLength(2);
    await user.click(within(strip).getByRole("button", { name: "Hide subsequent records" }));
    expect(strip).toHaveAttribute("data-collapsed", "true");
    expect(within(strip).queryByRole("list")).not.toBeInTheDocument();
    // The sheet is untouched, and the tray is one press away.
    expect(sheet()).toBeVisible();
    expect(within(strip).getByText("3 on file")).toBeVisible();
    await user.click(within(strip).getByRole("button", { name: "Show subsequent records" }));
    expect(within(strip).getAllByRole("list")).toHaveLength(2);
  });

  it("says so plainly when nothing has been filed against a record", () => {
    const { reader } = mount("CIRCA-M-0077");
    const strip = within(reader).getByRole("region", { name: "Subsequent Records" });
    expect(within(strip).getByText("No follow-up records filed.")).toBeVisible();
  });

  it("stands where the shell says it stands in a trail that is already open", async () => {
    const user = userEvent.setup();
    // The workstation opened a second record over the first, and the viewer
    // took the second; both steps are the shell's, not the viewer's.
    render(<Harness codes={["INC-00042", "INC-00907"]} at={1} />);
    const reader = screen.getByRole("dialog", { name: READER });
    expect(within(reader).getByRole("heading", { level: 1 })).toHaveTextContent("Tide gauge disagreement");
    await user.click(within(reader).getByRole("button", { name: "Previous record" }));
    expect(within(reader).getByRole("heading", { level: 1 })).toHaveTextContent("Stairwell interval");
    expect(within(reader).getByRole("button", { name: "Previous record" })).toBeDisabled();
    expect(within(reader).getByRole("button", { name: "Next record" })).toBeEnabled();
  });
});

describe("record reader renders the filed Markdown", () => {
  it("draws the corpus's repaired table, three figures, and six redactions on the sheet", () => {
    const { sheet } = mount("CIRCA-S-03007");
    expect(within(sheet()).getByRole("heading", { level: 2, name: "Brief" })).toBeVisible();
    const table = within(sheet()).getByRole("table");
    expect(within(table).getAllByRole("row")).toHaveLength(7);
    expect([...sheet().querySelectorAll("figure[data-align]")].map((figure) => figure.getAttribute("data-align")))
      .toEqual(["right", "full", "left"]);
    expect(sheet().querySelectorAll("mark.reader-redaction-inline")).toHaveLength(6);
    // The record's header is metadata; it is never body copy on the sheet.
    expect(sheet()).not.toHaveTextContent("circa_code");
    expect(sheet()).not.toHaveTextContent("SYNTAX LEGEND");
  });

  it("navigates the corpus as four sections, the way the source wrote them", () => {
    const { reader, sheet } = mount("CIRCA-S-03007");
    const rail = within(reader).getByRole("navigation", { name: "Sections" });
    expect([...rail.querySelectorAll(".reader-preview")].map((item) => item.getAttribute("aria-label"))).toEqual([
      "01 Brief",
      "02 Field Account",
      "03 Cross-Reference",
      "04 Addendum",
    ]);
    expect(sheet().querySelectorAll("section.reader-section")).toHaveLength(4);
    expect(sheet().querySelector("#reader-section-brief")).not.toBeNull();
  });

  it("opens a redaction on the sheet, and holds it closed until then", async () => {
    const user = userEvent.setup();
    const { sheet } = mount("CIRCA-S-03007");
    const mark = [...sheet().querySelectorAll<HTMLElement>("mark.reader-redaction-inline")]
      .find((candidate) => candidate.textContent === "not to be approached");
    expect(mark).toBeDefined();
    expect(mark).toHaveAttribute("data-revealed", "false");
    await user.click(mark as HTMLElement);
    expect(mark).toHaveAttribute("data-revealed", "true");
  });

  it("still counts its matches by walking the renderer's own output", async () => {
    const user = userEvent.setup();
    const { reader } = mount("CIRCA-S-03007");
    await user.click(within(reader).getByRole("button", { name: "Search" }));
    await user.type(within(reader).getByLabelText("Search this record"), "containment breach");
    // The match is inside a redaction, which is exactly what the DOM walk is for.
    expect(within(reader).getByTestId("reader-match-count")).toHaveTextContent("1 match for containment breach.");
  });

  it("puts the status on the stamp as data, so the sheet can fill a contested one", () => {
    const stamp = mount("INC-00907").sheet().querySelector(".reader-stamp");
    expect(stamp).toHaveAttribute("data-status", "contested");
    expect(stamp).toHaveTextContent("Contested");
  });

  it("does not stamp an ordinary filing, so there is nothing to fill", () => {
    expect(mount("INC-00014").sheet().querySelector(".reader-stamp")).toBeNull();
  });
});
