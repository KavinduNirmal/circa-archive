import { ARCHIVE_INDEX, CLASS_LABELS, STATUS_LABELS, type ArchiveEntry } from "../browser/archive-index";
import { recordSections, recordSource } from "./record-sources";
import { RecordMarkdown } from "./record-markdown";
import { sectionIndex, type ReaderBlock, type ReaderSection, type RecordDocument } from "./reader-model";

/**
 * The record service, stood in for.
 *
 * The archive index carries an entry for every record; it does not carry the
 * filing itself. This module is the seam where the filing arrives: it builds a
 * whole sectioned document out of an index entry, filling the body from an
 * authored Markdown source where the preview has one and holding it where it
 * does not.
 *
 * The body is rendered by the Markdown renderer in `@/lib/markdown`, through
 * `RecordMarkdown`. What this module decides is only the shape: which sections
 * a record has, what they are called, and which of them the archive has
 * released. Nothing here parses Markdown, and `reader-window` is unchanged by
 * any of it, because the frame renders whatever the host hands the slot.
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

/**
 * Sections of a filed record that the archive still holds.
 *
 * A record can be released in part. `INC-00042` is filed but its disposition
 * is sealed, so the section exists in the source and the sheet renders the
 * withheld shape in its place rather than the prose the author wrote.
 */
const WITHHELD_SECTIONS: Readonly<Record<string, readonly { heading: string; label: string; note: string }[]>> = {
  "INC-00042": [
    {
      heading: "Disposition",
      label: "Sealed",
      note: "Sealed at Level 5 on 2001-03-04, on the surveyor's own recommendation. The measurement is held at the desk.",
    },
  ],
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

/**
 * A filed record's sections, taken from its Markdown.
 *
 * The opening section also carries the entry's fields, and the fields are the
 * only content here that is not the author's: that is the point of them.
 */
function filedSections(entry: ArchiveEntry): ReaderSection[] {
  const markdown = recordSource(entry.code);
  if (!markdown) return [];
  const held = WITHHELD_SECTIONS[entry.code] ?? [];
  return recordSections(markdown).map((section, position) => {
    const withheld = held.find((item) => item.heading === section.heading);
    const blocks: ReaderBlock[] = [];
    if (position === 0) blocks.push(fieldsBlock(entry));
    if (withheld) blocks.push({ kind: "withheld", label: withheld.label, note: withheld.note });
    return {
      id: slug(section.heading),
      index: sectionIndex(position),
      heading: section.heading,
      // A held section contributes no prose at all: the source is not handed on.
      ...(withheld ? {} : { source: section.source }),
      blocks,
      ...(withheld ? { withheld: true } : {}),
    };
  });
}

/** Every section except the opening one is withheld: the entry is released, the filing is not. */
function heldSections(entry: ArchiveEntry): ReaderSection[] {
  return SECTION_NAMES[entry.klass].map((heading, position) => {
    if (position === 0) {
      return {
        id: slug(heading),
        index: sectionIndex(position),
        heading,
        source: entry.abstract,
        blocks: [fieldsBlock(entry)] satisfies readonly ReaderBlock[],
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
  const authored = recordSource(entry.code);
  return {
    code: entry.code,
    designation: entry.designation,
    klass: entry.klass,
    filed: entry.filed,
    status: entry.status,
    organization: entry.organization,
    clearance: entry.clearance,
    abstract: entry.abstract,
    sections: authored ? filedSections(entry) : heldSections(entry),
    source: authored ? "filed" : "held",
  };
}

/* ------------------------------------------------------------------------- */
/* The section body                                                           */
/* ------------------------------------------------------------------------- */

/**
 * One section's heading and body, rendered on the sheet.
 *
 * The heading belongs to the frame, because a heading is the section's name and
 * the rail, the anchor, and the search all agree on it. The body is the
 * renderer's: `RecordMarkdown` parses and draws the Markdown, and the structural
 * blocks below it are the two things that are not prose — the fields borrowed
 * from the catalogue, and the withheld shape.
 */
export function RecordFilingBody({ section }: { section: ReaderSection }) {
  return (
    <>
      <h2 className="reader-section-heading">{section.heading}</h2>
      {section.source ? <RecordMarkdown source={section.source} /> : null}
      {section.blocks.map((block, position) => <FilingBlock key={position} block={block} />)}
    </>
  );
}

function FilingBlock({ block }: { block: ReaderBlock }) {
  switch (block.kind) {
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
