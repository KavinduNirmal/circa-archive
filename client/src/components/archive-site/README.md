# Public archive

## Responsibility and structure

The full-page reading edition of the archive: the website a visitor uses instead
of the interactive workstation. It is server-rendered, needs no client JavaScript
to read, and carries the same entries as the archive browser. Client islands handle navigation disclosures and record annotations; neither
requires loading the Markdown editor parser.

- `archive-chrome.tsx`: the full-bleed frame — the classification notice above the
  masthead, the masthead with the search box, the section bar, the announcement
  bar, breadcrumbs, and the foot. It also carries the About dropdowns for archive guidance and project resources,
  preserving the overview links to `/[lang]/site/about` and `/[lang]/meta`. The masthead carries the server-verified personal access link.
- `site-search.tsx`: the global search form. It submits canonical query fields
  as a plain GET to the index, so searches survive bookmarks and work without
  JavaScript. The masthead puts the same filters behind a `<details>`; the index
  shows them in a ruled band.
- `archive-home.tsx`: the front page — search, a featured record, recent filings,
  most consulted, a random door, organizations, and the workstation invitation.
- `archive-records.tsx`: the archive index table and global search results,
  including active-filter links and pagination.
- `archive-record.tsx`: one record as a work page. The name and its code share a
  line, the tools that act on the whole record sit in one band, the sheet carries
  unnumbered section headings with matching contents links, and the foot repeats the step through the
  register as two large leaves. Its particulars carry the exploration count when
  records have been filed against it, and the status updates have their own rail
  section: an accordion of coloured cards.
- `archive-explorations.tsx`: the exploration list filed against one record. It
  reuses the ordinary record table and links every row to the ordinary record
  page; it is a filter over the citation web, not a second record template.
- `archive-organizations.tsx`: the organizations directory — a ledger leaf with the
  totals above, a directory search, and one numbered entry per body carrying its
  holdings as a margin tally.
- `archive-about.tsx`: the reading guide, set as a leaf of the archive's own
  prose. The classes are a colour key with a released code beside each, and the
  statuses wear the chips they wear in the index; either name opens the index
  filtered by it. The margin carries the guide's sections and the edition's own
  count; its guide numbering is independent of the record reader.
- `archive-footer.tsx`: the shared foot of the public shell — registry line,
  edition mark, directory, and return-to-top key. Both the archive chrome and the
  access register render it.
- `archive-write.tsx` and `archive-write.module.css`: the author landing's
  client island — the guidance bar, the two-column creation cards, and the
  browser-local incident draft list. Only the incident card is wired; the other
  creation actions are disabled placeholders.
- `archive-data.ts`: the questions these pages ask of the index — consultation
  counts, holdings, adjacency, and a random code. No React.
- `record-prose.tsx`: the server-side Markdown renderer. It runs the same pipeline
  as the viewer and turns the tree into React elements, with redactions as a
  checkbox and its label (`<details>` is not phrasing content and would break the
  paragraph and the page's hydration) and missing figures as plates. Citations
  into the archive are written in the corpus as `/site/…` and prefixed with the
  reader's language here, because a Markdown document cannot know which edition is
  reading it.
- `record-notes.tsx`: the annotations client island — the annotations list and the
  correspondence slip. Its words are the workstation viewer's — annotations, a
  note filed by a correspondent, a reply to a correspondent, a cancel — but a note
  written here is a draft held in the browser and stamped `Not filed`, because the
  reading edition has no writing desk.
- `archive-site.module.css`: the full-page stylesheet. Full-bleed chrome, a wide
  reading grid, steel panels, and paper sheets. No gradients; depth is a bevel.
- `archive-button.tsx` and `archive-button.module.css`: the site's one control.
  It is the workstation's tool button — a one-pixel bevel, a pressed well for the
  held and current states, tracked uppercase — and it renders the element the job
  needs: the locale-aware link, a plain anchor for `#anchors` and downloads, or a
  real `<button>`. `tone` picks the ground, `steel` on the navy chrome or `paper`
  on the sheets. The masthead's access key, the search key, the section bar,
  the record's action bar, and the random door all use it.

**Brand.** The masthead pairs the seal with the wordmark and the institution's
motto. The seal is `public/circa_snake_with_eye.svg` used as a CSS mask, painted by
the anchor's own colour, so it is exactly as light as the wordmark and brightens
with it on hover — no recoloured copy of the artwork and no light plate behind it.
`C.I.R.C.A` is set in Libre Baskerville, the edition's reading face; the line
under it is the landing catalog's `motto`, not a second string, so both languages
already carry it. The serif also sets what the archive says at length about
itself — a record's abstract, a page's lede, the standing note — while chrome,
headings, labels and keys stay DM Sans through `--font-sans`. A record's own prose
uses locally bundled Zilla Slab at 16px with 1.75 leading for a printed archive
feel. Paragraphs, quotations, and the colophon share that face. Markdown table
values and code retain Courier New; table headers and two-column key labels
use DM Sans. Regular, italic, bold, and bold italic Latin faces are
bundled so authored emphasis renders without synthetic styling. This reader
choice supersedes the earlier Courier-only reading-edition specification;
the workstation reader retains its own typography.
Record names are set as filing titles: capitals and tracked; their descriptions
stay serif and sentence-cased.

**Colour.** Each class owns one desaturated colour — incident crimson, organization
steel, continuity teal, memo ochre — carried by the code in an index, the class tag,
and the class doors on the front page. Status keeps its own boxed chip: neutral,
crimson for contested, amber for sealed and restricted, struck for erased. The
warnings column is an 8×8 swatch beside the word Clear or Warning: red for
warnings present, orange for an author-supplied warning list, and white for no
warnings. Its title and accessible name also carry the specific warning names, so
the colour is never the only signal. Lucide icons mark the section headings and the primary keys only;
they are decorative and always `aria-hidden`.

## Status history and explorations

A record's status updates are filed sentences, not Markdown: a severity change, a
claim, a sealing. The reading edition gives them their own rail section, full
width in the aside, as a native `<details>` accordion of coloured cards. The
section is closed by default, so the history is available without becoming a
section of the filing and without client JavaScript. The card's tone — neutral,
changed, or claimed — is part of the filed update, not inferred from its wording.

The exploration count beside them links to
`/{lang}/site/records/{code}/explorations`. That page lists the records whose
filing type is `EXPLORATION` and whose citation points at this record; each row
opens the ordinary record page. Exploration records do not carry status updates
of their own, because the parent's count is the account of them.

## Boundaries

The archive is fiction; the project page is not. This folder never explains that
the Commission is invented — `../meta/` owns that — and the About navigation
provides explicit links to guidance and project resources. The pages read from the index, the record
service, and the correspondence fixtures; they never invent a record, a citation,
or a note. Downloads are generated from the authored Markdown through the same
pipeline as the reader, and a held filing has no download at all.

## Usage and verification

Run `bun run --cwd=client test`, `lint`, `typecheck`, and `build`.
`tests/archive-site.test.tsx` covers the chrome and its search, the front page
sections, the index and server search, record pages (including a sealed section
and a held filing), the status-update accordion and its card tones, the exploration link and list,
the action bar, the annotations list and its composer, downloads and the refused
download, the organizations and guide, the project page, and link integrity in
both languages. The routes live in `../../app/[lang]/site/`.

The shared frame supports a compact editor variant that retains the masthead and navigation while omitting the classification notice, announcement ticker, and footer. The navigation includes the locale-aware incident editor entry point. Editing lives in [incident-editor](../incident-editor/README.md).

## About navigation dropdowns

`archive-nav-dropdown.tsx` preserves the About links and adds adjacent disclosure
buttons. Hover opens the panel; click or Enter toggles it; Tab reaches its links;
Escape closes it and restores focus. Leaving the group closes it unless focus
remains inside, and outside clicks or focus departure dismiss it. Menus use the
existing steel palette and 44px touch targets on narrow or coarse-pointer screens.

The requested archive menu extends the previous fiction-only navigation boundary:
Rules and Content Warnings link to sections of the existing author guide,
Guidelines opens that guide, and Filings opens the records index. The site menu
links to configured sponsorship and GitHub URLs, documentation, lore, and the
existing licence/terms section (TOS). These are existing destinations, not new
policy pages. English and Korean labels live in the site catalogs.

`archive-write.tsx` and `archive-write.module.css` provide the author landing: a guidelines bar, five creation cards in two columns (the final odd card spans
the row), and the existing local incident draft as a list with
empty/loading/error states. Only incident creation and continuation are wired. Archive navigation opens `/site/write`.

Search filters open from a disclosure in both variants. Controls use the shared shadcn Button, Input, NativeSelect and Radix Checkbox. Warning tags cycle unchecked → included → excluded → unchecked, with explicit labels and an indeterminate minus for exclusions. Without JavaScript, native checkboxes provide separate include/exclude choices.

`site-search.tsx` supplies the site message namespace to the interactive `search-form.tsx` without adding public archive prose to the global client provider.

Search results show type and class on separate lines, each with a coloured square, the archive warning swatch, and separate uppercase warning labels coloured by red/yellow/green severity without colour-name prefixes. Holder codes remain search filters and are omitted from the results table.

API-approved sealed records render their returned excerpt without the access-request
notice; redacted incident/record results retain their corresponding sealed notice.
