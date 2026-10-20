# Writing a record

A record is Markdown with an optional YAML header, and one parse feeds both editions.

## Anatomy of a record

A record is a single Markdown document. Its YAML header carries the fields; its body is what a reader sees. A level-two heading starts a navigable section; a level-three heading stays inside one.

```markdown
---
circa_code: CIRCA-S-03007
incident_ref: INC-03007
title: The Unwalled Door
type: DISCOVERY
status: FILED
severity: S
originator: H. Kim
filed_date: 2004-09-12
last_revision: 2004-09-14
classification: LEVEL 3
clearance: REVIEWER
related:
  - INC-00907
tags:
  - door
---

# The Unwalled Door

## Brief

A free-standing door in a pasture in Gangwon Province.
```

> [!NOTE]
> The header is data, not body copy
>
> The parser removes the YAML block before rendering. It never prints as text, and it is never sent to the client as a block of prose.

## The header fields

The frontmatter is parsed and kept as metadata. The archive index remains the source of truth for the catalogue, so a record's body can disagree with its own header — one intentionally does. The pipeline reports the disagreement rather than reconciling it.

| Field | Meaning |
| --- | --- |
| `circa_code` | the record code this filing is cited by. |
| `incident_ref` | the incident the filing belongs to. |
| `title` | the title printed on the sheet. |
| `type` | DISCOVERY, INCIDENT, EXPLORATION, or RUMOR. |
| `status` | the filing state as the document declares it. |
| `severity` | S, A, or B — the classification's severity. |
| `originator` | the name on the byline. |
| `filed_date` | ISO filing day and last revision day. |
| `classification` | the access level and the clearance it requires. |
| `related / tags` | cross-references and labels; both are lists. |

## Sections and anchors

Use a level-two heading for a section a reader should be able to jump to, and a level-three heading for structure inside it. The reader's page rail is built from level-two headings, and a heading inside a fenced code block is ignored.

Record names are set as filing titles; the prose is set in a typed face. There is no rich layout to maintain, which is why a record survives a change of edition.

> [!WARNING]
> A sealed section is still on the page
>
> The reader frame withholds it; the Markdown still contains it. Content removal is a product decision, not an editing one.

## The archive's syntax

The corpus extends GFM with four conventions. Each one is handled by the shared pipeline, so every renderer agrees about it.

| Convention | Result |
| --- | --- |
| `\|\|text\|\|` | a redaction, held behind paper until the reader opens it. |
| `![right\|caption](path)` | a figure with an alignment (left, right, full) and a caption. |
| `> quote` | a blockquote; the filings use it for correspondence and notices. |
| `\| table \|` | a GFM table. Redactions work inside cells because rows are repaired before parsing. |

Raw HTML is not passed through: a script element in a record is text, and enabling raw HTML would make the archive's own syntax legend live markup.

Citations to other records are written as /site/records/CODE; the reading edition prefixes the reader's language, because a Markdown document cannot know which edition is reading it.

## Where a record lives

Bodies live in components/reader/record-sources.ts; index entries live in components/browser/archive-index.ts. A record can be reachable without a body — the reader shows the withheld shape, which is a real state of the interface.

CIRCA-S-03007 is the renderer's test corpus and is filed in the index on purpose. It exercises the header, a table with redactions, all three figure alignments, quotes, and a code fence.

> [!NOTE]
> There is no CMS yet
>
> Adding a record today means editing those two TypeScript modules. When archive content is served by the API, the renderer should keep taking Markdown and not learn where it came from.
