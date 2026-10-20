# Project surface

## Responsibility and structure

The one part of the client outside the fiction: the project landing report, the
dossier, and the documentation. It is allowed to look unlike the archive, because
it answers a different question.

| File | Owns |
| --- | --- |
| `meta-chrome.tsx` | The frame shared by every project route: skip link, project identity strip, navigation, framed `<main>`, and footer. A server component; the two client islands are `MetaNav` and the language switcher. |
| `meta-nav.tsx` | The shadcn NavigationMenu (documentation panel) and the mobile Sheet, with grouped mobile documentation and a global documentation-search entry. Client component. |
| `meta-home.tsx` | The landing report: the hero field with its faded seal, premise and specimen, editions, the specifications and field guides, the machinery, contribution, and the questions. Six sections and no closing pitch. |
| `meta-about.tsx` | The dossier: the register, the nine-section index, and the long-form premise, editions, build, contribution, roster, support, questions, contact, and licence. |
| `meta-sections.tsx` | The dossier's nine sections, each an open band and a landmark with its own heading. |
| `meta-parts.tsx` | The shared section band, specimen card, and two edition panels. |
| `../ui/avatar.tsx` | The shadcn avatar primitive and its group, used for the contributor profiles. |
| `meta-plate.tsx` | The dossier's seal as a character plate, pasted as a string. Generated from `public/circa_eye.png`, never at request time. The landing hero uses the same artwork as a faded silhouette instead. |
| `meta-links.ts` | The addresses the project points at: repository, funding, the three issue destinations, and the two licence deeds. |
| `meta.css` | The system: palette, the framed composition, the hero field, the band, the docs pillars, the dossier, the docs surface, the footer, and the responsive rules. |
| `docs/` | The documentation registry, GitHub Markdown renderer, global search, pager, and source actions. See its [README](docs/README.md). |

Everything is server-rendered except the navigation drawer, the docs search, the
copy key, and the language switcher. A reader without JavaScript gets the whole
argument and every document.

## Composition

The page is a filed report: one continuous 1280px measure with side rules and
sections separated by hairlines on a generous block rhythm. Every section — on
the landing page and in the dossier alike — opens with the same band: folio and
kicker, then the title, then the lede or action, closed by a rule. The label sits
above the title rather than in a left rail, so nothing indents away from the
page's left edge. The only hero ornament is a dot field with the seal faded into it. The hero copy takes the wider share of the frame — 64%,
with an 18ch display measure — so the English title sets in two lines instead of
breaking to a third, and the hero stands 82vh tall so the field has room to be a
field rather than a strip. The dossier's opening title keeps its own 22ch
measure instead of inheriting the hero's.

Borders connect cells — the stats are one ruled strip of three, the editions
share a division, the manual is one ruled spread, the build facts are one
ledger, the contributor profiles share one division — rather than wrapping each
group in its own card. Section titles are
set below the hero's display size on purpose: one display, then a repeating
smaller title, then the reading copy. A lone section action sits under its
title; an action that has a lede sits beside it.

The documentation section is the one place where the hero's dot screen returns:
a dotted spotlight bleeds in from its upper corner, behind the text and never
bright enough to read through. It is decoration, hidden from assistive
technology, and it is the only other texture on the surface.

The project layer is also allowed the shadcn primitives in `../ui/` (navigation
menu, sheet, input, button). Its palette is re-declared inside `.meta-page`, so
those primitives inherit the project colours without restyling globals. The
drawer is portalled to `<body>`, so `.meta-sheet` restates the tokens it needs.

## Boundaries

The shared header and landing statistics omit backend progress notices. Technical
status belongs in the documentation and specific FAQ answers.

This folder owns the only copy allowed to say the Commission is not real. UI copy
lives in the `meta` namespace; documentation articles live in `docs/documentation/`; names that are data rather than
copy — the maintainer's handle, licence identifiers — live in `meta-links.ts`.

It asserts no capability the project does not have. Account registration and sessions use the
.NET authentication service; notes, drafts, and replies remain in the browser tab; there is no mail service, so the three
contact doors are repository issues.

## Regenerating the dossier's plate

`meta-plate.tsx` holds the output, not a renderer. To regenerate it, sample
`public/circa_eye.png` at 72 columns of alpha onto the ten-step ramp in the file's
doc comment and replace the string. It is a static artifact on purpose: no canvas,
no image request, no client JavaScript, and it stays sharp at any zoom.

## Usage and verification

Served at `/{lang}/meta`, `/{lang}/meta/about`, and
`/{lang}/meta/documentation`. `tests/archive-site.test.tsx` and
`tests/meta-pages.test.tsx` cover the dossier, the landing report, the manual,
the docs search and Ctrl/Cmd+K focus, the pager, the catalog contract, and every link. Run
`bun run --cwd=client test`, `lint`, `typecheck`, and `build`.
