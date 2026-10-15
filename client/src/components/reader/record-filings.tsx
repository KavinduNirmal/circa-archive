import { ARCHIVE_INDEX, CLASS_LABELS, STATUS_LABELS, type ArchiveEntry } from "../browser/archive-index";
import { sectionIndex, type ReaderBlock, type ReaderSection, type RecordDocument } from "./reader-model";

/**
 * The record service, stood in for.
 *
 * The archive index carries an entry for every record; it does not carry the
 * filing itself. This module is the seam where the filing arrives: it builds a
 * whole sectioned document out of an index entry, filling the body from
 * authored copy where the preview has one and holding it where it does not.
 *
 * It is a stand-in for the Markdown renderer described in
 * `MARKDOWN_RENDERER_PLAN.md`, and it is deliberately not one: nothing here
 * parses Markdown or decides how a document looks. When the renderer lands it
 * replaces the `blocks` of a filed section with its own output, and
 * `reader-window` is unchanged, because the frame renders whatever the host
 * hands it.
 *
 * Two rules keep the fiction honest. A record's metadata is never restated: the
 * class, dates, holder, and clearance are read from the index entry, so the
 * sheet cannot disagree with the catalogue. And a body is only ever authored
 * for a record the archive has released; everything else renders the withheld
 * shape, which is a real state of this screen rather than an error.
 */

/** What the withheld block says in the rail and on the sheet. */
export const READER_HELD_LABEL = "Held at the desk";

const HELD_NOTE = "The filing itself is not released. Only the index entry is on the screen.";

/**
 * Section names by class, used for every record whose body is held. A memo is
 * not shaped like an incident, and the archive does not pretend otherwise.
 */
const SECTION_NAMES: Record<ArchiveEntry["klass"], readonly string[]> = {
  incident: ["Brief", "Field account", "Measurement", "Disposition"],
  organization: ["Charter", "Continuities", "Holdings", "Standing"],
  continuity: ["Scope", "Subscribers", "Closure"],
  memo: ["Subject", "Body", "Retention"],
};

function slug(heading: string): string {
  return heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** The entry's own facts, laid out as the labelled block the opening section carries. */
function fieldsBlock(entry: ArchiveEntry): ReaderBlock {
  return {
    kind: "fields",
    rows: [
      { label: "Class", value: CLASS_LABELS[entry.klass] },
      { label: "Filed", value: entry.filed, mono: true },
      { label: "Status", value: STATUS_LABELS[entry.status] },
      { label: "Filed by", value: entry.organization, mono: true },
      { label: "Clearance", value: entry.clearance },
    ],
  };
}

type DraftSection = { heading: string; blocks: readonly ReaderBlock[]; withheld?: boolean };

/** How many records are filed under one lens, counted rather than asserted. */
function heldUnder(code: string): { total: number; continuities: number } {
  const held = ARCHIVE_INDEX.filter((entry) => entry.organization === code);
  return { total: held.length, continuities: held.filter((entry) => entry.klass === "continuity").length };
}

const organisationHoldings = heldUnder("ORG-C-005102");

/**
 * The bodies the preview files. Four records, chosen so every state of the
 * sheet is reachable in two clicks: an on-file incident, a sealed one whose
 * body is released but for its disposition, a contested one, and the
 * organization whose designation is withheld.
 */
const FILED_BODIES: Record<string, readonly DraftSection[]> = {
  "INC-00014": [
    {
      heading: "Brief",
      blocks: [
        { kind: "lede", text: "Eleven wagons left the yard on the night of 2 June 1998 and twelve arrived. Every copy of the waybill lists eleven, and the crew count closes without a twelfth hand." },
        fieldsBlock(ARCHIVE_INDEX.find((entry) => entry.code === "INC-00014") as ArchiveEntry),
      ],
    },
    {
      heading: "The waybill",
      blocks: [
        { kind: "paragraph", text: "Copy 3 of 4 is held in the yard office and is the copy the audit worked from. The wagon numbers run in order without a gap, and the tare weights sum to the train's weighed total." },
        { kind: "paragraph", text: "The discrepancy is in the number of vehicles and not in their numbers, which is why the audit could not close it. No copy has been produced that lists twelve." },
      ],
    },
    {
      heading: "Crew count",
      blocks: [
        { kind: "paragraph", text: "Seven staff signed the outward return. Seven signed the inward return, in the same order, on a form that had room for eight." },
        { kind: "quote", text: "The train was complete at both ends. I counted it twice because of the fog.", attribution: "Guard's return, 1998-06-03" },
      ],
    },
    {
      heading: "Disposition",
      blocks: [
        { kind: "paragraph", text: "Filed as an accounting discrepancy at the yard's request. The wagon is not listed as missing, because no register ever carried it." },
      ],
    },
  ],
  "INC-00042": [
    {
      heading: "Brief",
      blocks: [
        { kind: "lede", text: "Three surveyors climbed the same stairwell on three mornings in February 2001. Each reached landing 9 from landing 6 in the same number of steps, and the building has eight landings." },
        fieldsBlock(ARCHIVE_INDEX.find((entry) => entry.code === "INC-00042") as ArchiveEntry),
      ],
    },
    {
      heading: "Field account",
      blocks: [
        { kind: "paragraph", text: "The first climb was paced and counted twice from the lobby. The second and third were counted by different officers with hand counters, and no briefing passed between them." },
        { kind: "paragraph", text: "The stairwell is a straight dog-leg with a window at every second landing. Nothing in it can be walked past twice, which is what made the reading worth repeating." },
      ],
    },
    {
      heading: "Measurement",
      blocks: [
        { kind: "paragraph", text: "Landing 9 carries the door plate of landing 7 on its east jamb. The plate is original to the frame: its screws have not been turned and the paint breaks unbroken across its head." },
        { kind: "quote", text: "The counter reads nine. The plate reads seven. Both readings are correct.", attribution: "Survey note, 2001-02-19" },
      ],
    },
    {
      heading: "Disposition",
      withheld: true,
      blocks: [{ kind: "withheld", label: "Sealed", note: "Sealed at Level 5 on 2001-03-04, on the surveyor's own recommendation. The measurement is held at the desk." }],
    },
  ],
  "INC-00907": [
    {
      heading: "Brief",
      blocks: [
        { kind: "lede", text: "Two gauges on the same estuary, eleven kilometres apart, recorded the same high water eleven minutes apart on 16 May 2007. Both were read from the paper trace, and both traces survive." },
        fieldsBlock(ARCHIVE_INDEX.find((entry) => entry.code === "INC-00907") as ArchiveEntry),
      ],
    },
    {
      heading: "Both readings",
      blocks: [
        { kind: "paragraph", text: "Station A reads 04:07 and station B reads 04:18. Over the whole of the flood the two traces agree in shape to within a millimetre, which is the part neither station can account for." },
        { kind: "list", items: ["Station A, upper estuary: high water 04:07", "Station B, lower estuary: high water 04:18"] },
      ],
    },
    {
      heading: "Calibration",
      blocks: [
        { kind: "paragraph", text: "Both instruments were checked against the same staff gauge in the same week. The check sheets are countersigned, and neither instrument was adjusted afterwards." },
      ],
    },
    {
      heading: "Disposition",
      blocks: [
        { kind: "paragraph", text: "Filed as contested. Neither reading has been withdrawn, and the estuary's tide table reproduces the earlier of the two." },
      ],
    },
  ],
  "ORG-C-005102": [
    {
      heading: "Charter",
      blocks: [
        { kind: "lede", text: "The body was filed in 1988 under a code issued before its designation was settled. The designation has been withheld at the holder's request since the same year." },
        fieldsBlock(ARCHIVE_INDEX.find((entry) => entry.code === "ORG-C-005102") as ArchiveEntry),
      ],
    },
    {
      heading: "Continuities",
      blocks: [
        { kind: "paragraph", text: "Two continuities are filed under this code. Both claim the filings made before 1992, and neither holds a cession record for the other." },
        { kind: "paragraph", text: `The archive files ${organisationHoldings.continuities} of its ${organisationHoldings.total} records as continuities, which is a higher proportion than any other lens in the index.` },
      ],
    },
    {
      heading: "Holdings",
      blocks: [
        { kind: "paragraph", text: "Records filed under this lens carry a Level 3 clearance rather than the Level 4 of the index entry. The holder has asked for that difference to be read as a filing preference and not as a correction." },
      ],
    },
    {
      heading: "Standing",
      blocks: [
        { kind: "paragraph", text: "Read-only since 1992, and open to new filings only through a continuity. The code stays resolvable inside the archive, which is the holder's stated reason for keeping it: a body that cannot be named can still be cited." },
      ],
    },
  ],
};

function toSection(draft: DraftSection, position: number): ReaderSection {
  return {
    id: slug(draft.heading),
    index: sectionIndex(position),
    heading: draft.heading,
    blocks: draft.blocks,
    ...(draft.withheld ? { withheld: true } : {}),
  };
}

/** Every section except the opening one is withheld: the entry is released, the filing is not. */
function heldSections(entry: ArchiveEntry): ReaderSection[] {
  return SECTION_NAMES[entry.klass].map((heading, position) => {
    if (position === 0) {
      return {
        id: slug(heading),
        index: sectionIndex(position),
        heading,
        blocks: [
          { kind: "paragraph", text: entry.abstract },
          fieldsBlock(entry),
        ] satisfies readonly ReaderBlock[],
      };
    }
    return {
      id: slug(heading),
      index: sectionIndex(position),
      heading,
      withheld: true,
      blocks: [{ kind: "withheld", label: READER_HELD_LABEL, note: HELD_NOTE }] satisfies readonly ReaderBlock[],
    };
  });
}

/** The document the sheet renders, or nothing at all for a code the index does not carry. */
export function recordDocument(code: string): RecordDocument | undefined {
  const entry = ARCHIVE_INDEX.find((item) => item.code === code);
  if (!entry) return undefined;
  const authored = FILED_BODIES[entry.code];
  return {
    code: entry.code,
    designation: entry.designation,
    klass: entry.klass,
    filed: entry.filed,
    status: entry.status,
    organization: entry.organization,
    clearance: entry.clearance,
    abstract: entry.abstract,
    sections: authored ? authored.map(toSection) : heldSections(entry),
    source: authored ? "filed" : "held",
  };
}

/* ------------------------------------------------------------------------- */
/* The stand-in renderer                                                      */
/* ------------------------------------------------------------------------- */

/**
 * One section's heading and blocks, laid out on the sheet.
 *
 * This is the piece the Markdown renderer replaces. It is handed to the viewer
 * through the viewer's slot, so the frame has no idea it exists: swap this
 * component for `renderMarkdown(section.source)` and nothing in
 * `reader-window.tsx` changes.
 */
export function RecordFilingBody({ section }: { section: ReaderSection }) {
  return (
    <>
      <h2 className="reader-section-heading">{section.heading}</h2>
      {section.blocks.map((block, position) => <FilingBlock key={position} block={block} />)}
    </>
  );
}

function FilingBlock({ block }: { block: ReaderBlock }) {
  switch (block.kind) {
    case "paragraph":
      return <p className="reader-paragraph">{block.text}</p>;
    case "lede":
      return <p className="reader-lede">{block.text}</p>;
    case "quote":
      return (
        <blockquote className="reader-quote">
          <p>{block.text}</p>
          {block.attribution && <cite className="reader-quote-source">{block.attribution}</cite>}
        </blockquote>
      );
    case "list":
      return (
        <ul className="reader-list">
          {block.items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      );
    case "fields":
      return (
        <dl className="reader-fields">
          {block.rows.map((row) => (
            <div className="reader-field" key={row.label}>
              <dt>{row.label}</dt>
              <dd className={row.mono ? "circa-mono" : undefined}>{row.value}</dd>
            </div>
          ))}
        </dl>
      );
    case "withheld":
      return (
        <div className="reader-withheld">
          <span className="reader-withheld-stamp circa-label">{block.label}</span>
          {/* The redaction is drawn rather than typed, the way the index draws a withheld name. */}
          <span className="reader-withheld-bars" role="img" aria-label={block.label}>
            <span /><span /><span />
          </span>
          <p className="reader-withheld-note">{block.note}</p>
        </div>
      );
  }
}
