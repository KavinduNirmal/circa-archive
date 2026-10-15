# Markdown Renderer — Implementation Plan

**Deliverable:** one Markdown source (streamed from the CMS) rendered to three targets — a paper-like HTML **viewer**, an **email**-safe HTML body, and a **PDF** — plus a plain-**text** export.
**Test corpus:** `client/public/Ghost_story.md` (152 lines).
**Repo state this plan assumes:** `client/` is Next.js 16.4.0 + React 19.3.1 + Tailwind 4 + shadcn (new-york), bun 1.3.14. **No Markdown dependency is installed** — `client/package.json` has no `react-markdown`, `remark`, `marked`, or `zustand`. This is a greenfield capability, not a change to an existing renderer.
**Status:** partly implemented. The parse layer (§4–§5, §8), the on-screen viewer (§5, Phase 2), and the plain-text emitter (§7, Phase 4) are in the tree and covered by tests; see **Implementation status** below. Email (Phase 5) and PDF (Phase 3) are **not built** — they remain gated on §10 Q1/Q5 and on §9 R1.

---

## Implementation status (recorded after the fact)

| Plan item | Where it landed | State |
| --- | --- | --- |
| §4.3 pre-parse table repair | `client/src/lib/markdown/normalise-redactions.ts` | Built. One line of the corpus changes; the 12-cell row is a regression test. |
| §8.2 unified pipeline | `client/src/lib/markdown/pipeline.ts` | Built. **One plugin list**, shared with the viewer, so the sheet and an export cannot drift. |
| §4.3 stage 2 redactions | `client/src/lib/markdown/redaction-plugin.ts` | Built. **Also walks `inlineCode`**: the corpus's table-cell redactions sit inside backticks, so a `text`-only resolver finds nothing there. |
| §5 image directive | `client/src/lib/markdown/image-directive-plugin.ts` | Built, with `assetBaseUrl` resolution. |
| §8.3 interfaces | `client/src/lib/markdown/types.ts` | Built. `RenderInput`, warnings, and the `redaction`/`figure` mdast nodes. |
| §8.5 validation | `client/src/lib/markdown/validate.ts` | Built: unmatched delimiter, unknown alignment, relative image, missing header, header/body disagreement. |
| Phase 2 viewer | `client/src/components/reader/record-markdown.tsx`, `paper-redaction.tsx`, `paper-figure.tsx` | Built. Wired into the existing reader slot, as the plan's §2 predicted: `reader-window.tsx` was not touched. |
| Phase 4 plain text | `client/src/lib/markdown/emitters/to-text.ts` | Built **without `strip-markdown`/`remark-stringify`**. The table needed a custom handler regardless, and with it the frontmatter header, `[REDACTED]`, captions, and the 80-column measure, so one small tree walk replaced two dependencies. |
| Phase 3 PDF, Phase 5 email | — | Not built. `ARCHITECTURE.md:112` ("No PDF generation") stands, and the plan's §10 Q1/Q5 are unanswered. The emitters take the same `ParsedRecord`, so either can be added without disturbing the viewer. |
| Corpus | `client/src/components/reader/ghost-story.ts` | Filed as record `CIRCA-S-03007` in the archive index, so the renderer's widest case is reachable in the reader. A test holds the bundled string byte-identical to `public/Ghost_story.md`. |

Two deviations worth naming. The viewer is `record-markdown.tsx` rather than `record-reader.tsx`, because this repository already uses "record reader" for the window frame. And the viewer keeps the frame's section headings: the section, not the `##`, is the unit of navigation, so the frame prints the heading and the renderer draws the body.

---

## 1. The answer, in one screen

**Recommended stack.** `remark-parse` + `remark-gfm` + `remark-frontmatter` in a **single mdast pipeline**, fanned out to three emitters. Keep `react-markdown@10.1.0` as the React *presentation* layer for the on-screen viewer only; do not let it own the pipeline, because email and PDF cannot use a React component tree.

| Target | Emitter | Why |
| --- | --- | --- |
| **HTML viewer (paper)** | `react-markdown@10.1.0` with a `components` map, fed a pre-parsed mdast | Already nominated at `ARCHITECTURE.md:111`. Renders into the existing desktop shell; no `dangerouslySetInnerHTML` (README: "no `dangerouslySetInnerHTML` or XSS attacks"). |
| **Email body** | mdast → **hast** → **static HTML string** (`mdast-util-to-hast` + `hast-util-to-html`), then **`juice@12.2.0`** CSS-inlining | Email clients cannot run React. `juice` inlines the `<style>` rules and strips the tag (verified below). |
| **PDF** | The *same* static HTML string → headless Chromium `page.pdf()` via the `playwright@1.64.1` **already in the repo** as a devDependency | Only reliable way to get floats, `<figcaption>`, and page breaks. `@react-pdf/renderer` cannot float (see §6). |
| **Plain text** | mdast → **`strip-markdown@6.0.0`** + **`remark-stringify@11.0.0`**, with a custom pipe-table formatter | Verified: `strip-markdown` drops frontmatter and flattens tables. The table needs a small custom pass (§7). |

**Three findings that change the design** (each verified by running the parser, not by recall):

1. **The user's suspicion is correct, and worse than expected.** `||redacted||` inside a table cell **does** break the parse. `client/public/Ghost_story.md:47` produces a **12-cell row** instead of 4, because GFM's cell divider *is* the pipe (`|`), and `||` is therefore two empty cells. This is not a renderer bug to work around at render time — it shatters the table in the *parser*, before any renderer sees it. **The fix belongs in a pre-parse normaliser, not in a plugin** (§4).
2. **A naive "parse `||` in the micromark inline construct" approach cannot work inside table cells at all**, even with the pipes escaped: escaping turns each `|` into a `characterEscape` token, so the text-construct tokenizer keyed on code 124 never fires. Verified by dumping the micromark event stream. This is why the normaliser must run *before* parsing (§4).
3. **The document has a data-integrity defect that the renderer will make visible:** frontmatter says `status: FILED` (line 6), the body byline says `Status: **OPEN**` (line 29), and the code block says `STATUS: OPEN` (line 123). A renderer that displays both will show a record that contradicts itself. That may be intentional (see §10) — but it must be a *decision*, not an accident.

**Also load-bearing:** without `remark-frontmatter`, the YAML block is **not** a metadata block — it parses as a `thematicBreak` followed by loose text, and the record's entire header is silently destroyed. Verified.

---

## 2. Scope and what is explicitly not in scope

**In scope**

- Parse `client/public/Ghost_story.md`-shaped documents: YAML frontmatter, GFM tables, blockquotes, code fences, headings h1–h3, images with an alignment directive in the alt text, inline and table-cell redactions, raw HTML comments, links.
- Four output surface/format pairs: on-screen HTML, email HTML, PDF, plain text.
- Streaming input from the CMS (chunked body).

**Out of scope — say so plainly rather than half-building**

- The CMS itself, the SignalR transport, and the S3 image URLs. This plan defines the interface the renderer needs; it does not build the client.
- The editor. `ARCHITECTURE.md:111-112` and `client/src/components/word/README.md` establish that the editor holds Markdown as a string and **deliberately does not render it** ("the record's `.pdf` is the reader's job, and turning the document into a preview would be a second renderer to keep in step with the first"). That decision stands; we are building that reader.
- Real `.pdf` on disk served to the desktop shell. **This plan contradicts a stated product decision** — see §10.

---

## 3. Constraints, verified vs assumed

| # | Constraint | Source | Status |
| --- | --- | --- | --- |
| C1 | Next.js 16.4.0, React 19.3.1, TS 6, Tailwind 4, bun 1.3.14 | `client/package.json` | **verified** |
| C2 | No Markdown package is installed today | `client/package.json` | **verified** |
| C3 | `react-markdown` + `remark-gfm` is the nominated renderer | `ARCHITECTURE.md:56`, `ARCHITECTURE.md:111`, `.agents/brain/PROJECT_CONTEXT.md:346` | **verified** |
| C4 | Zustand is the nominated state library | `ARCHITECTURE.md:56` | **verified as nominated, but not installed** |
| C5 | "No PDF generation. The `.pdf` extension is a diegetic lie" | `ARCHITECTURE.md:112` | **verified — and in tension with this request** |
| C6 | Records are authored in Markdown, rendered as paper; `.pdf`/`.eml`/`.txt` are the three record extensions | `ARCHITECTURE.md:111`, `ARCHITECTURE.md:478-480` | **verified** |
| C7 | The editor does not render Markdown, by decision | `client/src/components/word/README.md`, `document-model.ts:1-9` | **verified** |
| C8 | Playwright 1.64.1 is already a devDependency | `client/package.json` | **verified** |
| C9 | TDD is required for behaviour changes; root tests are `bun:test`, frontend is Vitest, e2e is Playwright | `AGENTS.md` (Testing Guidelines) | **verified** |
| C10 | Every authored folder needs a `README.md`; `bun run check` enforces it | `AGENTS.md`, root `package.json` `check` script | **verified** |
| C11 | Two-space indent, UTF-8, LF | `.editorconfig` | **verified** |
| A1 | The CMS will deliver frontmatter + body as one string | not stated anywhere; inferred from `client/public/Ghost_story.md` | **assumed — confirm** |
| A2 | Email is sent from a server, not the browser | not stated | **assumed** |
| A3 | A headless browser is available in the deploy target | not stated | **assumed — this is the biggest deployment risk (§9 R1)** |
| A4 | A render worker may spawn Chromium | not stated | **assumed — confirm** |

---

## 4. The redaction problem, and why the fix is a normaliser

This is the single most important section. Everything else is packaging.

### 4.1 What actually happens today

`client/public/Ghost_story.md:47`:

```markdown
| S-05 | 17 | Two legal names (`||redacted||` / `||redacted||`) | Both |
```

Parsed with `remark-parse@11.0.0` + `remark-gfm@4.0.1`, the table comes out as:

```text
row 0 (4 cells): ["Subject","Age","Discrepancy","Verified?"]
row 1 (4 cells): ["S-01","34","Two birth dates (1987-04-12 / 1987-04-19)","Both"]
...
row 5 (12 cells): ["S-05","17","Two legal names (`","","redacted","","/","","redacted","","`)","Both"]
row 6 (4 cells): ["S-06–S-11","—","Records sealed by request","—"]
```

**Twelve cells, not four.** The backticks do not protect the pipes: an unescaped `|` in a GFM cell is a divider *regardless of any inline construct around it*.

Isolated repro (verified, `probe2.mjs` case 1):

| Cell source | Parsed cells |
| --- | --- |
| `| x \|\|redacted\|\| y \| z \|` | `["x","","redacted","","y","z"]` |
| `| \`\|\|redacted\|\|\` \| z \|` | `["\`","","redacted","","\`","z"]` |
| `| \\|\\|redacted\\|\\| \| z \|` | `["\|\|redacted\|\|","z"]` ✅ |
| `| &#124;&#124;redacted&#124;&#124; \| z \|` | `["\|\|redacted\|\|","z"]` ✅ |

So there are exactly two syntaxes that survive a table cell: **backslash-escaped pipes** and **HTML entities**. Both yield the literal text `||redacted||` in the cell.

### 4.2 Why a cleverer plugin cannot rescue it

The obvious next idea is "register a micromark inline construct on `|` and read it in the cell." Verified to fail. Dumping the micromark event stream for a cell containing `\|\|x\|\|`:

```text
> tableContent   "a \|\|x\|\| b"
> data           "a "
> characterEscape "\|"   > escapeMarker "\"  > characterEscapeValue "|"
> characterEscape "\|"   ...
> data           "x"
> characterEscape "\|"   ...
```

Each escaped pipe is consumed as a **`characterEscape`**, not as a `data` byte, so a `text`-construct tokenizer keyed on `codepoint 124` is never invoked. And an *unescaped* `||` has already been consumed by the table construct as two `tableCellDivider`s before inline tokenisation is reached.

**Conclusion: `||` cannot be recognised inside a GFM table cell by any inline extension.** The blank-line-delimited, cell-splitting happens upstream of all of it.

### 4.3 The fix: normalise before parsing, then resolve at the mdast layer

Two-stage, and the split is deliberate:

**Stage 1 — `normaliseTableRedactions(source)` (a pure string function, runs before `remark-parse`).**
Walk the lines. Track whether the cursor is inside a table (a GFM delimiter row — `|---|:--:|` — has been seen within the last two lines). Inside a table row, rewrite each *unescaped* `||` to `\|\|`. Outside a table, leave the line byte-identical, because there `|` has no structural meaning.

Verified on the real file: **exactly one line changes** — line 47 — and the table becomes correct.

```text
row 5 (4 cells): ["S-05","17","Two legal names (||redacted|| / ||redacted||)","Both"]
row 0..6: every row has 4 cells ✅
```

**Stage 2 — resolve the delimiter off the mdast, not off the tokenizer.**
After parsing, walk `text` nodes (and every `tableCell`) and split on `||`, producing `redaction` nodes. The `||` in paragraph-level prose *is* reachable by a real micromark extension if you want one (see the working extension in §4.4), but **you must not build two mechanisms** — a single string-level resolver that runs on `text` node values covers prose, blockquotes, table cells, and emphasis nesting uniformly, and it is far easier to unit-test.

**Recommendation:** ship **only** the string-level resolver. A `redaction` mdast node is still produced — just by a `remark` transform plugin (`visit` + `unist-util-visit`), not by a micromark syntax extension. This removes an entire class of micromark-internals risk. The working micromark extension is preserved in `.dsh-scratch/reference/redaction.mjs` as evidence that prose-level parsing is possible; it is **not** needed in the product.

Guard against a half-typed `||` — the resolver must only pair an even count within a single text node, and leave an unmatched `||` as literal text. Report the unmatched case as a validation warning (§8).

### 4.4 Fallback if you insist on byte-level control (not recommended)

A real micromark extension works for prose. Verified output on the real file, with `micromark-extension-gfm-strikethrough`'s structure transplanted:

```text
L83 in <paragraph> -> "not to be approached"
L95 in <paragraph> -> "disaster"
L99 in <paragraph> -> "containment breach"
L99 in <paragraph> -> "sealed"
```

…and **not** the table cell. Reach for this only if you later need a *block-level* redaction construct that is not expressible as an inline span. Note the working code needed `codes.verticalBar`, **not** `codes.pipe` — `micromark-util-symbol` has no `pipe` key, and the typo produces a confusing `combine-extensions` crash, not a clean error.

---

## 5. The image alignment directive

The test file writes `![right|Figure 1. …](./evidence/door-south-2004.jpg)`. Verified parse: CommonMark accepts this as an ordinary image whose **`alt` text begins with `right|`** and whose `title` is `null`.

```json
{"url":"./evidence/door-south-2004.jpg","alt":"right|Figure 1. The door, photographed from the south approach, 2004. The pines are visible at the treeline.","title":null,"line":60}
```

All three nodes behave identically (`probe1.mjs`):

| Line | `alt` prefix | `url` | `title` |
| --- | --- | --- | --- |
| 60 | `right\|` | `./evidence/door-south-2004.jpg` | `null` |
| 72 | `full\|` | `./evidence/door-interior-2004.jpg` | `null` |
| 87 | `left\|` | `./evidence/registry-notice-2004.jpg` | `null` |

So **Markdown has no image-alignment or caption concept**, and this convention is entirely ours. The transform that consumes it:

```ts
// /^(right|left|full)\|(.*)$/s  ->  { align, caption }
```

Emit a `figure` node carrying `align` and `caption`; **strip the `right|` prefix from the alt text in every emitter.** If you skip that, the literal string `right|Figure 1. …` leaks into the rendered HTML — verified present in the naively converted output. It is also the accessible name of the image, so leaving it would be an accessibility defect, not just an ugly one.

Three target-specific renderings, because `float` is not portable:

| Target | `left` / `right` | `full` |
| --- | --- | --- |
| HTML viewer | `float: <side>` on a `<figure>`, `figcaption` below | `width: 100%` |
| **Email** | **`<table role="presentation">` with `align="left\|right"` on the `<td>`** — `float` is 68% supported and **0% in Outlook for Windows** (§6) | full-width table row |
| PDF | `float: <side>` — Chromium honours it | `width: 100%` |

For `full` images inside an email, do **not** rely on `max-width` alone; set the `<img width>` attribute as well.

---

## 6. Email: what survives, and what you must give up

`float` is the answer to "can we keep the paper look in email", and the answer is no.

**Verified against the Can I Email dataset** (`https://www.caniemail.com/api/data.json`, `last_update_date: 2026-09-16`), counting support across every feature × family × platform cell. Read as "supported / measured":

| Feature | Supported | Unsupported | Verdict for us |
| --- | --- | --- | --- |
| `<table>` | **50 / 50 (100%)** | 0 | ✅ the only layout primitive to trust |
| `<blockquote>` | 49 / 50 (98%) | 0 | ✅ |
| `<pre>` | 40 / 45 (89%) | 0 | ✅ |
| `<h1>`–`<h6>` | 50 / 50 (100%) | 0 | ✅ |
| `background-color` | 46 / 51 (90%) | 0 | ✅ |
| `line-height` | 39 / 47 (83%) | 0 | ✅ |
| `<style>` element | 56 / 90 (62%) | 18 | ⚠️ in *addition* to inlined styles, never alone |
| `float` | 41 / 60 (68%) | 7 | ❌ **Outlook Windows: "Not supported" for every version 2007–2019.** Use `align` |
| `display:flex` | 38 / 64 (59%) | 20 | ❌ |
| `position` | 14 / 48 (29%) | 12 | ❌ |
| `@font-face` | 16 / 59 (27%) | 33 | ❌ — no serif webfont; fall back to a font *stack* |
| `orphans` / `widows` | 11 / 43 (26%) | 17 | ❌ — no real page-break control |
| `column-count` | 32 / 47 (68%) | 15 | ❌ |
| `clear` | 11 / 48 (23%) | 6 | ❌ |
| `box-shadow`, `transform`, `filter` | 45%, 45%, 44% | ~30 each | ❌ — no paper texture, no stamp rotation |
| Base-64 images | 34 / 53 (64%) | 16 | ❌ as the default; see below |
| HTML comments | 30 / 30 | 0 | n/a — we drop them anyway |

`float`'s own note (verified on the feature page): *"Not supported. `table` and `img` elements can use an `align` attribute to get a similar effect."*

**Consequences, stated plainly.** The email is not the record. It is a **notification that a record exists**, and it should be honest about that: a `role="presentation"` table shell with a white "sheet" cell, a font **stack** (`Georgia,'Times New Roman',serif` — no webfont), table cells instead of floats, inlined styles as the source of truth, and a single call to action linking back to the on-screen viewer. Do not attempt the texture, the rotated stamp, or the left/right wrap.

**Images in an email.** `./evidence/door-south-2004.jpg` is a *relative* path. It cannot resolve in a mail client under any circumstances. The renderer must be handed an absolute base URL and rewrite `./evidence/…` → `https://<host>/records/<CIRCA-S-03007>/evidence/…`. Prefer a plain absolute `https://` URL over base-64: base-64 is 64% supported and Gmail clips messages above ~102 KB, which base-64 inflation makes likely.

**CSS inlining is verified to work on this exact document.** Running the assembled email HTML through `juice@12.2.0`:

- `<style>` tag: **removed** after inlining ✅
- the `float`-free table cell carrying `align="right" width="240"` and the absolute `img src`: **preserved** ✅
- a `<span>` redaction inside a `<blockquote>`: inlined to `style="background-color:#111111;color:#111111;"` ✅ resulting size 10,770 → 18,530 bytes
- frontmatter: **absent from the body** ✅

One verified `juice` caveat: it handles Tailwind-style escaped class names (`.gap-1\.5`, `.md\:grid`) correctly, **but not inside a `@media` query** (`.dark\:text-white` was not inlined). So do not rely on a `@media (prefers-color-scheme: dark)` block for anything load-bearing. It also inlines `::after`/`::before` content when `inlinePseudoElements: true`, but **not** `:hover`/`nth-child` — those must not carry required styling.

---

## 7. Plain text: the table is the whole problem

Both naive approaches were run against the real file. Neither produces a usable table.

| Approach | Frontmatter | Table | Links | Image caption | Verdict |
| --- | --- | --- | --- | --- | --- |
| `remove-markdown@0.8.0` | ❌ **left in, as raw YAML** | ❌ raw `\| S-01 \|` pipes kept | ❌ URL dropped, label kept | `right\|Figure 1. …` | ❌ |
| `strip-markdown@6.0.0` | ✅ dropped | ❌ **flattened** to `S-01 34 Two birth dates (…) Both S-02 41 …` | ❌ URL dropped, label kept | ✅ plain caption text | ✅ best base |
| `html-to-text@10.0.1` after mdast→hast | ✅ (if you drop the node) | ❌ flattened the same way, even at `wordwrap: 100` | ❌ label only | skipped or leaked | ⚠️ |

**Recommendation: `strip-markdown@6.0.0` + `remark-stringify@11.0.0` as the base, plus one custom `table` handler** that lays the table out with fixed-width columns. This is the only remaining work, and it is ~40 lines. `strip-markdown`'s handler for `table` should be replaced with one that:

1. computes each column's width from the longest cell (capped, e.g. 32 chars);
2. emits a header line, a rule of `-` and `+` junctions;
3. pads and joins each row.

Also decide, explicitly and in the plan's terms, the answers to:

- **Does plain text keep the redaction?** A `.txt` record that reveals what the `.pdf` hides defeats the point. **Recommendation: render `||redacted||` as `[REDACTED]` in all four targets** — never emit the redaction's text content in the email or `.txt` targets. This is a policy question, not a technical one; §10 Q3 records it.
- **Should frontmatter become a text header block?** **Recommendation: yes, but explicitly formatted** — re-emit the fields as `CIRCA CODE: CIRCA-S-03007` lines (mirroring the in-document code block at lines 119–132) rather than raw YAML. `strip-markdown` drops it, so this is a deliberate re-add.
- **Line wrapping.** Unwrapped by default. If wrapped, wrap at 80 and keep code blocks and tables unwrapped.

---

## 8. Architecture

### 8.1 Data flow

```
CMS stream (chunked markdown)
        │
        ▼
[1] normaliseTableRedactions(source)        ← pre-parse string pass, §4.3
        │
        ▼
[2] unified()
      .use(remarkParse)
      .use(remarkGfm)                        ← tables, strikethrough, autolinks, task lists, footnotes
      .use(remarkFrontmatter, ["yaml"])      ← REQUIRED; without it the header is destroyed
      .use(remarkRedactions)                 ← mdast transform: split text on || (§4.3 stage 2)
      .use(remarkImageDirective)             ← mdast transform: alt `right|caption` -> figure (§5)
      .use(remarkValidate)                   ← unmatched ||, unknown align, missing images (§8.5)
        │
        ├── mdast ─────────────────────────────────────────────┐
        │                                                      │
        ▼                                                      ▼
[3a] react-markdown@10.1.0                    [3b] toHast() + toHtml()  → static string
     with components map                            │
        │                                            │
   ┌────┴─────┐                              ┌───────┴────────┬──────────────┐
   ▼          ▼                              ▼                ▼              ▼
HTML        on-screen                    email + juice    Chromium        mdast + strip-markdown
viewer      (streaming RSC)              → email HTML     page.pdf()      + custom table handler
                                                         → PDF           → .txt
```

**The critical invariant:** parse **once**, fan out from one mdast. If the HTML viewer and the PDF are built by two different parsers, they will drift, and the fiction is that they are the same document. This is exactly the risk `client/src/components/word/README.md` names when it refuses to add a second renderer — so make this renderer the *only* one.

### 8.2 Proposed file layout

Respecting the repo's "every authored folder has a README" rule (C10) and the existing convention of pure, renderer-free logic modules (`document-model.ts`, `files-index.ts`, `editor-state.ts`):

```
client/src/lib/markdown/
  README.md                     ← required by `bun run check`
  pipeline.ts                   ← the unified() chain; parseMarkdown(source) -> mdast
  normalise-redactions.ts       ← normaliseTableRedactions()            [pure, §4.3]
  redaction-plugin.ts           ← remark transform: text -> redaction nodes
  image-directive-plugin.ts     ← remark transform: alt -> figure nodes
  validate.ts                   ← render warnings, never throws
  emitters/
    to-email-html.ts            ← mdast -> hast -> html -> juice
    to-pdf.ts                   ← mdast -> hast -> html -> playwright page.pdf()
    to-text.ts                  ← mdast -> strip-markdown -> custom table formatter
  email.css                     ← the inlining source of truth
  paper.css                     ← the viewer's print-independent paper styling
client/src/components/reader/
  README.md
  record-reader.tsx             ← the viewer; uses react-markdown + components map
  paper-figure.tsx              ← the three figure alignments
  paper-redaction.tsx           ← the <mark> reveal-on-click
```

Server emitters (`to-email-html`, `to-pdf`, `to-text`) must be importable from a **route handler**, so they must not pull in `"use client"` code. Keep `react-markdown` out of their import graph.

### 8.3 Interfaces

```ts
/** Everything the renderer is allowed to depend on. No React, no DOM. */
export type RenderInput = {
  /** The raw CMS payload: YAML frontmatter + markdown body, exactly as stored. */
  markdown: string;
  /** Absolute origin for relative image paths such as `./evidence/door.jpg`. */
  assetBaseUrl: string;
  /** How a redaction is presented. Policy, not presentation. */
  redactionMode: "hidden" | "labelled" | "visible";
};

export type RenderWarning = {
  code:
    | "unmatched-redaction"      // an odd number of `||` in one text node
    | "unknown-image-align"      // `![top|...]`
    | "relative-image-in-email"  // no assetBaseUrl supplied
    | "metadata-field-missing";  // a field the viewer relies on
  message: string;
  line?: number;
};

export type RenderResult<T> = { output: T; warnings: RenderWarning[] };

export function parseRecord(input: RenderInput): RenderResult<Root>;          // mdast
export function renderEmailHtml(input: RenderInput): Promise<RenderResult<string>>;
export function renderPdf(input: RenderInput): Promise<RenderResult<Uint8Array>>;
export function renderText(input: RenderInput): RenderResult<string>;
export function renderViewerTree(input: RenderInput): RenderResult<Root>;     // mdast for react-markdown
```

**Error cases, explicit.**

| Condition | Behaviour |
| --- | --- |
| Frontmatter absent | Render the body; warn `metadata-field-missing`; do **not** throw. |
| Frontmatter present but unparseable YAML | Throw. A file whose header is corrupt must not render as if it were fine. |
| Unmatched `||` | Leave as literal text; warn `unmatched-redaction`. |
| Unknown image alignment | Treat as `full`; warn `unknown-image-align`. |
| Relative image with no `assetBaseUrl` | Omit the image; warn `relative-image-in-email`. Never emit a relative `src`. |
| Unknown remark node type | Emit a `text` fallback. **Never** let `mdast-util-to-hast` use its default handler — verified below. |

> **Verified trap.** `mdast-util-to-hast@13.2.1`'s default handler for an **unknown** node type emits a `<div>`. Applied to our sentence-level `redaction` node, the real file produced `<p>…the door in question is <div>not to be approached</div> and that…</p>` — **a block element illegally nested inside a `<p>`**, which the browser will silently restructure. You must supply an explicit `handlers.redaction`. This is a silent-corruption failure, not a crash.

### 8.4 Streaming

"Streamed via a CMS" and "streaming markup" are two different requirements; this plan answers both.

1. **Streamed transport** (the CMS returns chunks). Buffer to a complete document before parsing. A partially-received markdown file has structurally invalid tables and unterminated fences, and re-parsing per chunk means re-rendering the reader on every chunk. If a progressive reveal is wanted, that is a UI concern (show a "receiving" state, then the document), not a parser concern.
2. **Incremental render** (the user should see something before the body finishes). Use React Server Components + `<Suspense>`: render the frontmatter/header block first from the partial metadata, then stream the body. Because the pipeline is a pure `string → mdast` function, this needs no global store.
3. **If true chunk-boundary re-parsing is required later** — e.g. token-by-token display — the prior art is Vercel's `streamdown@2.7.0`, which ships `remend@1.4.0`, a dependency whose self-description is *"Self-healing markdown. Intelligently parses and styles incomplete Markdown blocks."* That is the specific problem: an unclosed fence or a half-written table at a chunk boundary. **This is a lead, not a recommendation** — `streamdown` depends on `marked`, `rehype-raw`, and `rehype-sanitize`, which duplicates the remark pipeline we already need, and it is Apache-2.0 against this repo's MIT-only dependency posture. Use it as a reference for *what* to heal, not as a dependency.

### 8.5 Validation

`validate.ts` should produce warnings rather than throw for content defects, and throw only for structural ones. The two defects already present in the test file make good first tests:

- `client/public/Ghost_story.md:6` `status: FILED` vs `:29` `Status: **OPEN**` vs `:123` `STATUS: OPEN` — a **frontmatter/body disagreement**. Decide whether to warn or to make the body authoritative (see §10 Q4). I recommend the renderer treat frontmatter as authoritative for *chrome* and the body as authoritative for *prose*, and emit a warning when they disagree — because in this fiction, the disagreement may be the point.
- `client/public/Ghost_story.md:142-151` contains an HTML comment (the syntax legend) whose content uses `||text||` **unescaped** at line 146. With `rehype-raw` disabled the comment is dropped, so this is harmless today. If `rehype-raw` is ever enabled, that legend becomes live markup and its `||` become redactions. Verified: with `allowDangerousHtml: false`, `toHast` emits **zero** raw nodes; with `true`, **one**. **Recommendation: keep `rehype-raw` off.** `react-markdown`'s own README notes it "typically escapes HTML (or ignores it, with `skipHtml`)" and that `dangerouslySetInnerHTML` is one of its three stated reasons not to be a wrapper around a naive converter.
- Because `remark-gfm` supports **footnotes** (verified: `footnoteReference`/`footnoteDefinition` nodes are produced), decide whether footnotes are in-world. `ARCHITECTURE.md:478-480` does not list them. Notes in a .NET-paginated body have no `.NET`—no footnote model. Recommend disabling footnotes for now to avoid rendering something the data model cannot file.

### 8.6 Failure modes

| Failure | Consequence | Mitigation |
| --- | --- | --- |
| Chromium missing / OOM in the deploy target | PDF export 500s | Feature-detect at boot; return `503` with a typed error; cache aggressively so the browser is hit once per content hash (R1) |
| CMS chunk boundary splits a table | Garbled table in *streaming* preview only | Buffer to completion (§8.4.1) |
| Image 404 with a bad `assetBaseUrl` | Broken figure | Validate `assetBaseUrl` shape; emit `relative-image-in-email` |
| Malicious markdown from a user-authored record | XSS in the viewer | `rehype-raw` off (raw HTML is inert); `react-markdown`'s `urlTransform` left at its secure default — the README warns that overriding it "will open you up to XSS" |
| A record large enough to make a 3-minute Chromium run | Request timeout | Cap input size; `pageRanges`/streaming not needed at this scale; move PDF to a queue if records exceed ~1 MB |

---

## 9. Technology decisions and rejected alternatives

### D1 — Renderer

| Option | Version | React 19 | Custom `\|\|` inline syntax | Streaming | License | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| **`react-markdown`** | **10.1.0** | ✅ peer `react >=18` | ✅ full unified pipeline | ✅ | MIT | **CHOSEN** — already nominated; `remark` plugins drop in |
| `streamdown` | 2.7.0 | ✅ `^18 \|\| ^19` | ⚠️ via the remark plugins it bundles | ✅ best-in-class | Apache-2.0 | ⚠️ Heavier — pulls `marked`, `rehype-raw`, `rehype-sanitize`; duplicates our pipeline. Reference only |
| `markdown-it` | 15.0.2 | n/a (string→HTML) | ⚠️ needs a `md.inline.ruler` rule, not remark's ecosystem | n/a | MIT | ❌ Would need `dangerouslySetInnerHTML` for the viewer and a *second* plugin ecosystem |
| `marked` + `DOMPurify` | 18.1.1 | n/a | ⚠️ `marked.use({extensions})` | n/a | MIT | ❌ Same two-ecosystem problem; sanitize-by-default is weaker than raw-HTML-off |
| `mdast-util-from-markdown` used directly | 2.1.0 | n/a | ✅ | ✅ | MIT | ✅ **Adopt as a companion**, not a replacement — it is exactly what `unified` wraps, and is what the server emitters use |

`react-markdown@10.1.0`'s own dependency set is lean and all-MIT (11 runtime deps: `hast-util-to-jsx-runtime`, `mdast-util-to-hast`, `remark-parse`, `remark-rehype`, `unified`, `unist-util-visit`, `vfile`, …). Last published **2025-03-07**. Peer deps `react >=18`, `@types/react >=18` — React 19 is satisfied.

> **Honest gap.** `react-markdown` was **not** installed and rendered in this sandbox — the `client/` tree has no Markdown package and I did not modify the repo to add one. Everything above about mdast behaviour is verified by running `remark-parse`/`remark-gfm`/`mdast-util-to-hast@13.2.1` directly, which is the same pipeline `react-markdown` wraps. The `react-markdown`-specific claims (default raw-HTML-off, `skipHtml`, `urlTransform`, `components`) come from its published README, not from execution. **Phase 0 below exists to close this gap.**

### D2 — PDF

| Option | Version | Mechanism | Blocker |
| --- | --- | --- | --- |
| **Playwright `page.pdf()`** | **1.64.1** (already a devDependency, C8) | headless Chromium print-to-PDF | Needs a browser on the host. **Recommended.** |
| `puppeteer` | 25.14.0 | same Chromium engine | A second browser download alongside the one Playwright already manages |
| `@react-pdf/renderer` | 4.9.0 | renders a React tree, **not** HTML | ❌ Cannot float — the left/right figure wrap is the whole visual point (§5). Would require rebuilding the layout in a flexbox subset |
| `pdf-lib` / `pdfkit` | — | low-level | ❌ You would be writing a text layout engine |
| `md-to-pdf` / `markdown-pdf` | 5.2.5 / 11.0.0 | wrappers around Puppeteer | ❌ `markdown-pdf` last published **2022-07-12**; `md-to-pdf` 2025-11-20. Both hide a browser dependency and force their own markdown pipeline |
| `weasyprint` (Python) | — | HTML→PDF, excellent paged media | ❌ Introduces a second language runtime into a .NET + Node stack |
| `@sparticuz/chromium` | 153.0.0 | serverless Chromium | Fallback if the deploy target cannot ship the full browser (§9 R1) |

**Verified `page.pdf()` API** (read from the installed `playwright-core@1.64.1` type definitions, `types.d.ts:4101-4234`):

- `printBackground` — **defaults to `false`**; Playwright's own doc says *"By default, `page.pdf()` generates a pdf with modified colors for printing."* The paper background will be silently dropped unless this is `true`. Also set `-webkit-print-color-adjust: exact`.
- `preferCSSPageSize` — **defaults to `false`**, which *scales content to fit the paper size*. Set `true` to let `@page { size: A4 }` win.
- `format` — **defaults to `'Letter'`**, not A4. Set `'A4'` explicitly or use `preferCSSPageSize`.
- `margin` — **defaults to none**; use CSS `@page` margins instead so both paths agree.
- Also available and relevant: `outline` (PDF bookmarks from headings), `tagged` (accessible PDF), `pageRanges`, `scale` (0.1–2).
- **`displayHeaderFooter` + `headerTemplate`/`footerTemplate` limitation, quoted:** templates must use the injected classes `'date'`, `'title'`, `'url'`, `'pageNumber'`, `'totalPages'`, and *"Script tags inside templates are not evaluated"* and *"Page styles are not visible inside templates."*

> **Unverified.** I could **not** run Chromium in this sandbox: the browser binary is not installed and `/home/kavindu/.cache/ms-playwright` is on a read-only mount, so `playwright install chromium` cannot write. **No PDF was produced and no `@page` behaviour was measured.** The API semantics above are read from the installed type definitions. Whether Chromium's print engine honours CSS Paged Media **`@page` margin boxes** (`@top-center`, `@bottom-right` with `counter(page)`) is **unverified and is the highest-value thing to check in Phase 0** — if it does, page headers/footers need no `headerTemplate` at all; if it does not, fall back to `headerTemplate`.

### D3 — Plain text

`strip-markdown@6.0.0` (MIT, 1 dependency) over `remove-markdown@0.8.0` (which leaks raw YAML — verified). `html-to-text@10.0.1` is the alternative if you prefer going through HTML, but it flattens tables identically and adds a second conversion stage.

### D4 — Zustand: **not needed**

`ARCHITECTURE.md:56` nominates Zustand for the desktop, and it is **not installed** (C2/C4). For this feature specifically:

**Argument against adding it now.** A document viewer is a **prop-driven pure function**: `markdown: string → UI`. It has no cross-window shared state. The repo already demonstrates the pattern that succeeds here — `client/src/components/word/editor-state.ts` is a pure `useReducer` with "no refs and no timers", and `document-model.ts:1-9` documents the discipline of keeping logic renderer-free and testable. Adding a global store to render one string would be a second state paradigm alongside the reducer, for no benefit.

The state a document viewer genuinely owns, and where each should live:

| State | Where it belongs |
| --- | --- |
| The markdown source | A prop from the server component / CMS client |
| The parsed mdast | `useMemo` on `(markdown, rendererVersion)` client-side; `cacheLife`/`cacheTag` server-side if it must survive navigation |
| Per-redaction reveal toggles | **Local** `useState` in the redaction component. Never global — it is per-instance UI |
| Scroll position | DOM. Do not lift it |
| Active export format | Local to the export menu |
| Which windows are open / z-order | **Already handled** by `client/src/components/window-manager.tsx` |

**The condition that flips the answer:** if a revealed redaction must persist **across windows** (reveal in the viewer, and the PDF export must then include it), that is genuinely cross-tree state and Zustand's `createStore` + Context pattern (per `ARCHITECTURE.md:56`) becomes the right home. Model it as `revealedRedactions: Map<recordId, Set<index>>` and keep it out of the renderer itself. **Do not adopt Zustand as a side effect of this feature**; adopt it when the desktop shell needs it, and let the renderer stay pure.

### D5 — Caching

**Verified against the installed Next.js 16.4.0** (`client/node_modules/next/cache.d.ts`):

- `cacheLife(profile)` and `cacheTag(...)` are exported from `next/cache` with a full set of profiles (`default`, `seconds`, `minutes`, `hours`, `days`, `weeks`, `max`) and documented stale/revalidate/expire windows. This is the current API.
- `unstable_cache` is **still exported and not marked `@deprecated`** in 16.4.0. `unstable_noStore`, `revalidatePath`, `revalidateTag`, `updateTag`, `refresh`, `io`, `navigation`, and `prefetch` are also exported.
- `cacheComponents` exists as a top-level `next.config.ts` flag; the nested form is marked `@deprecated use top-level cacheComponents instead` (`config-shared.d.ts:1163-1166`, `:1048-1049`). **Currently `client/next.config.ts` does not set it.**

**Recommendation.** Prefer `cacheLife` + `cacheTag` (the current API) behind a `"use cache"` boundary, with `cacheTag(\`record:${contentHash}\`)` so a CMS edit invalidates precisely. **Do not enable `cacheComponents` as part of this work** — that is a site-wide behavioural change and belongs in its own decision.

**Cache key: `sha256(markdown)` is necessary but not sufficient.** `ARCHITECTURE.md:181` already stores `ContentHash VARCHAR(64) -- SHA-256 of markdown`. The key must also cover everything that changes the output for identical input:

```
cacheKey = sha256( markdown )
         + rendererVersion      // bump when the pipeline or CSS changes
         + assetBaseUrl         // absolute URL embedded in email/PDF
         + redactionMode        // hidden | labelled | visible
         + target               // viewer | email | pdf | text
```

The content hash alone would serve a stale PDF after a CSS change, which is the classic failure of hashing only the source. (This is reasoning from the pipeline's own inputs, labelled as reasoning — I did not find prior art to cite for the composite-key form. Contentlayer/Velite-style caches generally key on content + config, which is the same shape.)

---

## 10. Risks, unknowns, and the decisions that are yours

### Risks, most severe first

**R1 — Chromium in the deploy target (severity: high).** `page.pdf()` needs a real browser (~150–300 MB of Chromium plus system libs). If the .NET/Next deploy target is a slim container or a serverless function, this is the plan's largest single risk, and Next.js route handlers on Vercel have function size limits that a full Chromium exceeds. **Mitigation:** decide the host *before* Phase 3; use `@sparticuz/chromium@153.0.0` if serverless; run PDF in a queue with a warm browser pool if not. **Signal it has materialised:** PDF latency above ~3 s cold, or an image-size build failure.

**R2 — Email fidelity (severity: medium, but certain).** The paper aesthetic cannot survive email (68% float support, **0% in Outlook Windows**; 27% `@font-face`; 26% `orphans`). **Mitigation:** accept that the email is a notification, not the record, and design it as such (§6). **Signal:** a stakeholder asking why the email "doesn't look like the record."

**R3 — A renderer drift between viewer and PDF (severity: medium).** Two pipelines showing different documents would break the core fiction that a record is one artifact. **Mitigation:** the single-parse invariant (§8.1) plus a golden-file test asserting that the viewer's mdast and the PDF's mdast are byte-identical (§11 T1).

**R4 — Redaction as a correctness liability (severity: medium).** A redaction is a *content* promise, not a style. If the normaliser mis-pairs a `||`, redacted text could be emitted in plain sight. **Mitigation:** fail closed — an unmatched delimiter must leave the text **hidden** where a redaction was open; add a property test that for every input, the set of `redaction` node texts in the `.txt`/`.pdf` output is empty when `redactionMode: "hidden"`.

**R5 — The `\|\|` migration has no second source of truth (severity: low).** The normaliser is a heuristic on line shape. **Mitigation:** it is pure and exhaustively unit-testable, and it must be a no-op on any document with no `||` at all — assert that over a large corpus of records.

### Unknowns — things research could still resolve

- **U1.** Whether Chromium's print engine honours `@page` margin boxes. Resolvable in Phase 0 (needs a browser).
- **U2.** `react-markdown@10.1.0` rendered under React 19.3.1 + Next 16.4.0 with Turbopack. Resolvable in Phase 0 (needs a dependency install).
- **U3.** Whether the CMS streams *markdown text* or a *pre-parsed AST*. This changes §8.4 entirely. **Ask the CMS owner.**
- **U4.** Whether the CMS stores frontmatter as a separate typed record. If so, §4's YAML handling and `remark-frontmatter` become unnecessary and the metadata path shortens considerably.

### Decisions that belong to the user, not to inspection

These are recorded as questions with my recommended default. I have deliberately not guessed them.

| # | Question | Recommended default | Why it matters |
| --- | --- | --- | --- |
| **Q1** | **Does a *real* PDF violate the fiction?** `ARCHITECTURE.md:112` says, verbatim: *"No PDF generation. The `.pdf` extension is a diegetic lie; files are Markdown rendered as paper."* A real downloadable PDF contradicts a documented design decision. | Keep **both**: the on-screen record stays diegetic HTML (unchanged), and the PDF is an **out-of-fiction export** — a "Print / Export" action in the viewer's menu, clearly an operator tool, not a record. Never place a generated PDF inside the in-world file tree. | This is the single largest design conflict in the request. Resolving it the other way (`ARCHITECTURE.md:112` wins) removes Phase 3 entirely and roughly a third of the work. |
| **Q2** | Do **all four** targets need to exist, or is the priority order viewer → PDF → text → email? | Build viewer + PDF first (highest fidelity, one pipeline), then text, then email. | Email is the most constrained and lowest-fidelity target (§6); doing it last avoids designing the paper CSS around a client that cannot support it. |
| **Q3** | Does **plain text** reveal redacted content? | No — `[REDACTED]` in every target, including `.txt`. | A redaction is a content promise (§R4). A `.txt` that leaks what the `.pdf` hides is a canon hole. |
| **Q4** | `status: FILED` (frontmatter) vs `Status: OPEN` (body, line 29 and 123) — which is authoritative? | Warn and render both, flagging the disagreement. If one must win: **frontmatter for chrome, body for prose.** | The story is explicitly *about* record inconsistency. Making the renderer silently reconcile them destroys the theme; making it crash is unusable. |
| **Q5** | Is **email** an out-of-fiction export too, or does the in-world mail client (`.eml`, `ARCHITECTURE.md:479`) render it? | Out-of-fiction export, same as Q1. | If in-world, the email body must fake a 1990s mail client rather than look like a modern notice — a completely different design. |

---

## 11. Phased implementation

TDD throughout: confirm a failing behavioural test before each implementation (C9). Frontend tests are Vitest; `bun run check:client` runs lint + typecheck + test.

### Phase 0 — Close the unverified gaps (do this first; it is small and it de-risks everything)

| # | Test / probe | Passes when |
| --- | --- | --- |
| T0.1 | Install the stack; render `Ghost_story.md` through `react-markdown@10.1.0` under React 19.3.1 | No peer warning; no runtime error |
| T0.2 | Lazy-load a Chromium build and produce a PDF from a static HTML string | A non-empty PDF buffer; **and** record whether `@page { @top-center }` produced a running header |
| T0.3 | Assert `page.pdf()` defaults | `printBackground` off by default (backgrounds absent unless `true`); `format` defaults to Letter |

Output: a short addendum recording what was actually observed, closing U1 and U2.

### Phase 1 — Parse layer (no UI, no emitters)

Files: `pipeline.ts`, `normalise-redactions.ts`, `redaction-plugin.ts`, `image-directive-plugin.ts`, `validate.ts`.

| # | Test | Expected |
| --- | --- | --- |
| T1.1 | `normaliseTableRedactions(Ghost_story.md)` | **Exactly one line differs** (line 47); output contains `\|\|redacted\|\|` |
| T1.2 | `normaliseTableRedactions` on a document with no `\|\|` | Byte-identical output |
| T1.3 | Parse the normalised file | Table has **7 rows × 4 cells**, every row 4 cells |
| T1.4 | Parse the **unnormalised** file | Row 5 has **12** cells — *this test documents the bug and must stay* |
| T1.5 | Redaction nodes | **4** nodes: line 83 "not to be approached", line 95 "disaster", line 99 "containment breach", line 99 "sealed" |
| T1.6 | Table-cell redaction | Row 5 cell 3 is `Two legal names (\|\|redacted\|\| / \|\|redacted\|\|)` and yields **2** redaction nodes |
| T1.7 | Image nodes | **3**: `./evidence/door-south-2004.jpg` / `-interior-2004` / `registry-notice-2004`, each with `title: null` and an alt prefixed `right\|`/`full\|`/`left\|` |
| T1.8 | Frontmatter | Parsed YAML has all 13 scalars plus `related[]` (3) and `tags[]` (5); `filed_date` is the **string** `"2004-09-12"` |
| T1.9 | Parse **without** `remark-frontmatter` | Child 0 is a `thematicBreak` — documents why the plugin is mandatory |
| T1.10 | Unmatched `\|\|` | Left literal; one `unmatched-redaction` warning; **no** redaction node |
| T1.11 | Every emitted `.txt`/`.pdf` mdast under `redactionMode: "hidden"` | Zero redaction text content (property test, R4) |

### Phase 2 — Viewer

Files: `client/src/components/reader/record-reader.tsx`, `paper-figure.tsx`, `paper-redaction.tsx`, `paper.css`, plus `README.md`s.

| # | Test | Expected |
| --- | --- | --- |
| T2.1 | Render the record | h1 + 5 h2 + 1 h3, 6 `thematicBreak`s |
| T2.2 | Table | One `<table>`, 7 rows, 28 cells |
| T2.3 | Figures | `right` floats right, `left` floats left, `full` is full width; each has a `figcaption` from the alt text **without** the `right\|` prefix |
| T2.4 | Redaction a11y | Renders as `<mark>` with an accessible label; not colour-only |
| T2.5 | Raw HTML | The legend comment at line 142 renders **nothing** (no `<!--` in output) |
| T2.6 | Headings with duplicate text | Distinct `id`s (the test file has an h2 "Field Account" once, but the slugger must not collide on repeat) |
| T2.7 | XSS | A `<script>` and a `javascript:` link in a fixture record are inert |

### Phase 3 — PDF (gated on Q1)

Files: `emitters/to-pdf.ts`, a `print.css`, and a route handler (`export const runtime = "nodejs"`).

| # | Test | Expected |
| --- | --- | --- |
| T3.1 | PDF for the test record | Non-empty buffer, valid `%PDF-` header, A4 |
| T3.2 | Page size | `@page { size: A4 }` wins (`preferCSSPageSize: true`) |
| T3.3 | Backgrounds | Grey sheet present (`printBackground: true` + `-webkit-print-color-adjust: exact`) |
| T3.4 | Figures | Float survives; caption legible at 40 mm width |
| T3.5 | Running header | Either `@page { @top-center }` works, or `headerTemplate` with `pageNumber`/`totalPages` does |
| T3.6 | Table + blockquote pagination | No row or quote split across a page boundary (`break-inside: avoid`) |
| T3.7 | Chromium absent | Typed `503`, not a 500 stack trace |

### Phase 4 — Plain text

Files: `emitters/to-text.ts`.

| # | Test | Expected |
| --- | --- | --- |
| T4.1 | Text export | Contains no `|`, no `**`, no `#`, no raw YAML |
| T4.2 | Table | Rendered as a **padded, aligned** table — not flattened |
| T4.3 | Frontmatter | Re-emitted as `CIRCA CODE: …` header lines |
| T4.4 | Redaction | `[REDACTED]`, with the underlying text absent |
| T4.5 | Images | Caption only, no `right|` prefix, no path |
| T4.6 | Links | Label retained; `#`-only anchors do not emit a bare `#` |
| T4.7 | Wrapping | ≤ 80 columns except code blocks and tables |

### Phase 5 — Email

Files: `emitters/to-email-html.ts`, `email.css`.

| # | Test | Expected |
| --- | --- | --- |
| T5.1 | `<style>` tag absent after inlining | ✅ (verified achievable with `juice@12.2.0`) |
| T5.2 | No `float`, no `position`, no `flex`, no `@font-face` in the output CSS | Asserted by a lint on the stylesheet |
| T5.3 | Figures | `role="presentation"` table with `align` on the `<td>` |
| T5.4 | Image `src` | Absolute; a relative path with no `assetBaseUrl` produces a warning and the image is omitted |
| T5.5 | Redaction | `<span style="background-color:#111111;color:#111111;">` — **and the text is not present in the plain-text part of the MIME message** |
| T5.6 | Frontmatter | Not in the body |
| T5.7 | Size | Under 102 KB for a record of this shape |
| T5.8 | A `@media (prefers-color-scheme: dark)` rule | Not load-bearing — `juice` does not inline it (verified) |

---

## 12. Dependency manifest

All versions read from `https://registry.npmjs.org` in this session. Licenses all MIT unless noted.

**Runtime — client (viewer)** — added to `client/package.json`:

| Package | Version | Last publish | Role |
| --- | --- | --- | --- |
| `react-markdown` | 10.1.0 | 2025-03-07 | React viewer |
| `remark-gfm` | 4.0.1 | 2025-02-10 | tables, strikethrough, autolinks, task lists |
| `remark-frontmatter` | 5.0.0 | 2023-11-20 | **mandatory** — YAML block |
| `unist-util-visit` | 5.1.0 | 2026-01-22 | transforms |
| `yaml` | 2.9.1 | 2026-09-11 | frontmatter parsing (ISC) |
| `github-slugger` | 2.0.0 | — | heading anchors |

**Runtime — server (emitters)**:

| Package | Version | Last publish | Role |
| --- | --- | --- | --- |
| `mdast-util-to-hast` | 13.2.1 | 2025-11-23 | mdast → hast, with explicit handlers |
| `hast-util-to-html` | 9.0.5 | — | hast → static HTML string |
| `juice` | 12.2.0 | 2026-09-24 | email CSS inlining |
| `playwright` / `playwright-core` | 1.64.1 | 2026-10-15 | **already installed** (C8); PDF via Chromium |
| `strip-markdown` | 6.0.0 | 2023-11-20 | plain-text base |
| `remark-stringify` | 11.0.0 | 2023-11-20 | text serialisation |

**Deliberately NOT added:** `zustand` (§D4), `rehype-raw` (raw HTML off by design, §8.5), `streamdown` (Apache-2.0 + duplicate pipeline, §D1), `marked`, `markdown-it`, `gray-matter` (last publish 2023-07-12), `@react-pdf/renderer` (no float, §D2), `mjml@5.4.1` (its own component language, not markdown).

One caveat on maintenance: `remark-frontmatter`, `remark-stringify`, `strip-markdown`, and `rehype-raw` all show **2023-11-20** as their last publish — a lockstep remark-11 release, not abandonment. They are stable, not stale.

---

## 13. Definition of done

1. `client/public/Ghost_story.md` renders to all four targets without manual intervention.
2. The table renders as **7 rows × 4 cells** in every target — no 12-cell row anywhere.
3. All **4** prose redactions and the **2** table-cell redactions resolve; no `||` appears in any output.
4. All **3** figures carry a correct alignment and a caption with no `right|`/`left|`/`full|` prefix.
5. No raw YAML and no HTML comment reaches any output.
6. Viewer and PDF are produced from **byte-identical mdast** (T1.11 / R3).
7. Email output contains no `float`, no `position`, no `flex`, and no `<style>` tag.
8. `bun run check:client` passes; every new folder has a `README.md` (`bun run check`); documentation updated per `AGENTS.md`.
9. `ARCHITECTURE.md:111-112` is **updated** to record whatever Q1/Q5 decide, so the spec and the code agree.

---

## 14. Reproducing the evidence

Probes and the working extension are preserved at `.dsh-scratch/reference/` with a README. They exist because `/tmp` does not persist between tool calls in this sandbox, and every claim in §4–§7 was established by running the parser rather than by recall. **Delete with `rm -rf .dsh-scratch`** — nothing there is product code.

Key commands, all run from `.dsh-scratch/reference` after `bun install --frozen-lockfile`:

```sh
bun probe4.mjs    # redaction nodes via a real micromark extension
bun probe10.mjs   # the normaliser fix: table becomes 7 rows x 4 cells
bun emailprobe.mjs # email HTML through juice
```

### Confidence summary

| Claim | Confidence |
| --- | --- |
| `\|\|` in a GFM cell splits the row (12 cells) | **Confirmed** — ran it |
| Escaping to `\\|\\|` fixes it; **exactly one line** changes | **Confirmed** — ran it |
| An inline micromark construct cannot fire in a table cell | **Confirmed** — dumped the event stream |
| `remark-frontmatter` is mandatory | **Confirmed** — ran it both ways |
| `![\|right\|caption](path)` parses with the prefix intact in `alt` | **Confirmed** — dumped the mdast |
| Default `toHast` handler emits an illegal `<div>` in a `<p>` | **Confirmed** — produced the HTML |
| Plain-text tools flatten the table | **Confirmed** — ran `remove-markdown`, `strip-markdown`, `html-to-text` |
| Email CSS support numbers | **Confirmed** — `caniemail.com/api/data.json`, updated 2026-09-16 |
| `juice` inlines correctly on this document; not inside `@media` | **Confirmed** — ran it |
| `page.pdf()` defaults (`printBackground` false, `format` Letter) | **Confirmed from the installed type definitions**, not from execution |
| Chromium honours `@page` margin boxes | **Unverified** — no browser in this sandbox (U1) |
| `react-markdown` under React 19 | **Unverified** — package not installed; claims are from its README and npm metadata (U2) |
| Zustand is unnecessary here | **Inferred** — from the viewer's data flow and the repo's existing reducer pattern. It is a design judgement, not a measurement |
| The cache key must include `rendererVersion` | **Inferred** — reasoning from the pipeline's inputs |
