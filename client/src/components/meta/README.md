# Project surface

## Responsibility and structure

The one part of the client outside the fiction: the project landing report, the
dossier, and the documentation. It is allowed to look unlike the archive, because
it answers a different question.

| File | Owns |
| --- | --- |
| `meta-chrome.tsx` | The frame shared by every project route: skip link, top status line, navigation, framed `<main>`, and footer. A server component; the two client islands are `MetaNav` and the language switcher. |
| `meta-nav.tsx` | The shadcn NavigationMenu (documentation panel) and the mobile Sheet, with a restyled project header. Client component. |
| `meta-home.tsx` | The landing report: hero with its plate, premise and specimen, editions, the documentation manual, the machinery, contribution, the questions, and the inverted closing band. |
| `meta-about.tsx` | The dossier: the register, the nine-section index, and the long-form premise, editions, build, contribution, roster, support, questions, contact, and licence. |
| `meta-sections.tsx` | The dossier's nine sections, each a landmark with its own heading. |
| `meta-parts.tsx` | The shared section band, specimen card, and two edition panels. |
| `meta-plate.tsx` | The seal as a character plate, pasted as a string. Generated from `public/circa_eye.png`, never at request time. |
| `meta-links.ts` | The addresses the project points at: repository, funding, the three issue destinations, and the two licence deeds. |
| `meta.css` | The system: palette, the framed composition, the band, the manual, the plate, the dossier, the docs surface, the footer, and the responsive rules. |
| `docs/` | The documentation registry, prose, sidebar, pager, and copy key. See its [README](docs/README.md). |

Everything is server-rendered except the navigation drawer, the docs filter, the
copy key, and the language switcher. A reader without JavaScript gets the whole
argument and every document.

## Composition

The page is a framed ledger: one continuous 1280px measure with side rules, rows
separated by hairlines, and folio numbers in a left rail. The only texture is the
hero plate's dot screen; the field is deliberately not repeated behind other
sections. Borders connect cells — the hero and its plate share a frame, the stats
are one ruled strip, the editions share a division, and the manual is one bordered
spread — rather than wrapping each group in its own card.

The project layer is also allowed the shadcn primitives in `../ui/` (navigation
menu, sheet, input, button). Its palette is re-declared inside `.meta-page`, so
those primitives inherit the project colours without restyling globals. The
drawer is portalled to `<body>`, so `.meta-sheet` restates the tokens it needs.

## Boundaries

This folder owns the only copy allowed to say the Commission is not real. Copy
lives in the `meta` namespace and nowhere else; names that are data rather than
copy — the maintainer's handle, licence identifiers — live in `meta-links.ts`.

It asserts no capability the project does not have. There is no backend, so
notes, drafts, and replies are described as living in the browser tab; there is
no mail service, so the three contact doors are repository issues.

## Regenerating the plate

`meta-plate.tsx` holds the output, not a renderer. To regenerate it, sample
`public/circa_eye.png` at 72 columns of alpha onto the ten-step ramp in the file's
doc comment and replace the string. It is a static artifact on purpose: no canvas,
no image request, no client JavaScript, and it stays sharp at any zoom.

## Usage and verification

Served at `/{lang}/meta`, `/{lang}/meta/about`, and
`/{lang}/meta/documentation`. `tests/archive-site.test.tsx` and
`tests/meta-pages.test.tsx` cover the dossier, the landing report, the manual,
the docs filter, the pager, the catalog contract, and every link. Run
`bun run --cwd=client test`, `lint`, `typecheck`, and `build`.
