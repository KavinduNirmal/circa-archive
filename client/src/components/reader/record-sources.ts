import { ARCHIVE_INDEX } from "../browser/archive-index";
import { GHOST_STORY } from "./ghost-story";

/**
 * The filings, as the CMS would hand them over: one Markdown source per record.
 *
 * This is the content half of the stand-in record service. The renderer is the
 * real thing; what is still a preview is where the bytes come from. A record
 * that appears here is `filed`; one that does not gets the withheld shape.
 *
 * The body is authored as it would be stored — frontmatter first, then `##`
 * sections — and `recordSections` is what turns one document into the sections
 * the reader frame navigates. A section's source is the body *without* its
 * heading, because the frame prints the heading: it is the unit of navigation,
 * and printing it twice would give the sheet two names for one page.
 *
 * `GHOST_STORY` is the plan's corpus, `CIRCA-S-03007`, and it is the widest
 * exercise of the renderer: frontmatter, a GFM table with redactions inside a
 * cell, two kinds of blockquote, an alignment directive of each kind, and a
 * code block. The other four records are the preview's own, and they are
 * ordinary filings by comparison.
 */

function heldUnder(code: string): { total: number; explorations: number } {
  const held = ARCHIVE_INDEX.filter((entry) => entry.organization === code);
  return {
    total: held.length,
    explorations: held.filter((entry) => entry.klass === "exploration").length,
  };
}

/** Counted rather than asserted, so the sentence cannot overstate the index. */
const organisationHoldings = heldUnder("ORG-C-005102");

export const RECORD_SOURCES: Readonly<Record<string, string>> = {
  "INC-00014": `## Brief

Eleven wagons left the yard on the night of 2 June 1998 and twelve arrived. Every copy of the waybill lists eleven, and the crew count closes without a twelfth hand.

## The waybill

Copy 3 of 4 is held in the yard office and is the copy the audit worked from. The wagon numbers run in order without a gap, and the tare weights sum to the train's weighed total.

The discrepancy is in the number of vehicles and not in their numbers, which is why the audit could not close it. No copy has been produced that lists twelve.

## Crew count

Seven staff signed the outward return. Seven signed the inward return, in the same order, on a form that had room for eight.

> The train was complete at both ends. I counted it twice because of the fog.
>
> — Guard's return, 1998-06-03

## Disposition

Filed as an accounting discrepancy at the yard's request. The wagon is not listed as missing, because no register ever carried it.
`,

  "INC-00042": `## Brief

Three surveyors climbed the same stairwell on three mornings in February 2001. Each reached landing 9 from landing 6 in the same number of steps, and the building has eight landings.

## Field account

The first climb was paced and counted twice from the lobby. The second and third were counted by different officers with hand counters, and no briefing passed between them.

The stairwell is a straight dog-leg with a window at every second landing. Nothing in it can be walked past twice, which is what made the reading worth repeating.

## Measurement

Landing 9 carries the door plate of landing 7 on its east jamb. The plate is original to the frame: its screws have not been turned and the paint breaks unbroken across its head.

> The counter reads nine. The plate reads seven. Both readings are correct.
>
> — Survey note, 2001-02-19

## Disposition
`,

  "INC-00907": `## Brief

Two gauges on the same estuary, eleven kilometres apart, recorded the same high water eleven minutes apart on 16 May 2007. Both were read from the paper trace, and both traces survive.

## Both readings

Station A reads 04:07 and station B reads 04:18. Over the whole of the flood the two traces agree in shape to within a millimetre, which is the part neither station can account for.

- Station A, upper estuary: high water 04:07
- Station B, lower estuary: high water 04:18

## Calibration

Both instruments were checked against the same staff gauge in the same week. The check sheets are countersigned, and neither instrument was adjusted afterwards.

## Disposition

Filed as contested. Neither reading has been withdrawn, and the estuary's tide table reproduces the earlier of the two.
`,

  "ORG-C-005102": `## Charter

The body was filed in 1988 under a code issued before its designation was settled. The designation has been withheld at the holder's request since the same year.

## Holdings

Records filed under this lens carry a Level 3 clearance rather than the Level 4 of the index entry. The holder has asked for that difference to be read as a filing preference and not as a correction.

The archive files ${organisationHoldings.explorations} of its ${organisationHoldings.total} records under this code as explorations. Neither was adopted, and neither has been withdrawn.

## Standing

Read-only since 1992, and open to new filings only by a body already entered in the directory. The code stays resolvable inside the archive, which is the holder's stated reason for keeping it: a body that cannot be named can still be cited.
`,

  "CIRCA-S-03007": GHOST_STORY,
};

/** The Markdown for a record the preview has released, if it has one. */
export function recordSource(code: string): string | undefined {
  return Object.prototype.hasOwnProperty.call(RECORD_SOURCES, code)
    ? RECORD_SOURCES[code]
    : undefined;
}

export type RecordSourceSection = {
  heading: string;
  /** The section body alone: the heading line, the preamble, and any closing rule are gone. */
  source: string;
};

/**
 * One document into the sections the frame navigates.
 *
 * Only `##` splits, so an `###` stays inside its section — the corpus's filing
 * metadata belongs to its addendum, not to a page of its own. A fence is
 * tracked so a `##` inside a code block is never mistaken for a heading, and a
 * closing thematic rule is trimmed because it belongs to the divider between
 * sections rather than to the section above it.
 */
export function recordSections(markdown: string): RecordSourceSection[] {
  const sections: { heading: string; body: string[] }[] = [];
  let current: { heading: string; body: string[] } | null = null;
  let fenced = false;

  for (const line of markdown.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
    const heading = fenced ? null : /^##\s+(.+?)\s*$/.exec(line);
    if (heading) {
      if (current) sections.push(current);
      current = { heading: heading[1], body: [] };
      continue;
    }
    if (current) current.body.push(line);
  }
  if (current) sections.push(current);

  return sections.map((section) => ({
    heading: section.heading,
    source: section.body
      .join("\n")
      .replace(/\n*-{3,}\s*$/, "")
      .trim(),
  }));
}
