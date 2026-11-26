# Design systems

The repository speaks in three registers. Which one you are in decides almost every visual choice.

## Three systems, one repository

CIRCA Archive is not one design system. It is three, each answering a different question.

| System          | Surface    | Rule                                                                                                                |
| --------------- | ---------- | ------------------------------------------------------------------------------------------------------------------- |
| Workstation     | `/desktop` | 1990s institutional software: steel, bevels, dense chrome, 12px. Never use it outside the desktop.                  |
| Reading edition | `/site`    | Paper, ink, a serif masthead, filed documents. Depth is a bevel; no gradients.                                      |
| Project page    | `/meta`    | Warm archival paper, burnt-orange ink, Instrument Serif display, a printed dot field, and a quiet asymmetric essay. |

> [!NOTE]
> The project page is the exception
>
> It is allowed to look unlike the archive because it answers a different question. The archive links here only through a labelled action, and none of these project styles reach the archive.

## The project page

The project site is a static Astro publication. Its visual world is **the quiet essay with a printed field**: a near-white warm paper ground, one burnt-orange accent, a reading column offset to the right, a mono source note in the margin, and a fixed halftone dot field that fades before the prose. It follows Design E from the recorded studies.

The styles are split by responsibility under `meta/src/styles/`: `tokens.css`, `base.css`, `layout.css`, `editorial.css`, `prose.css`, `documentation.css`, and `print.css`, imported in that order by `site.css`. Add a rule to the module that owns the element. Use the tokens; do not introduce a second accent, a gradient, a bevel, or a drop shadow.

| Token            | Use                                                                          |
| ---------------- | ---------------------------------------------------------------------------- |
| `--paper`        | the near-white warm ground of every page.                                    |
| `--paper-raised` | the navigation bar, dropdown panels, and code surfaces.                      |
| `--ink`          | headings and primary reading text.                                           |
| `--ink-body`     | long-form prose.                                                             |
| `--muted`        | annotations, secondary prose, and labels.                                    |
| `--accent`       | links, the second display line, the seal, and the printed field. One accent. |
| `--rule`         | the only structural border: a hairline.                                      |
| `--serif`        | Instrument Serif for display, section headings, leads, and quotations.       |
| `--sans`         | IBM Plex Sans for reading copy and controls.                                 |
| `--mono`         | IBM Plex Mono for codes, annotations, navigation, and controls.              |
| `--measure`      | 620px for the essay; Markdown prose caps at 68ch.                            |

Noto Serif KR carries Korean display and headings; the sans stack supplies Korean reading copy.

## Layout and navigation

The shell is centred at 1280px with fluid gutters. The essay is offset 22% from the left on wide screens, capped at 620px, with a 190px note in the margin. The note moves into flow below 1180px. Opening pauses, section intervals, and the measure carry the pacing; section numbers are not used because the essay is not a sequence of steps.

The top bar is a flat, 60px mono strip: wordmark at the left, plain links and native disclosures at the right, language switching at the far right. The current page receives a paper fill and an inset ink underline. Navigation must remain usable without JavaScript through native `details`.

Search belongs to the documentation reader alone. It is the only search field in the project site, and the keyboard shortcut does nothing outside documentation.

## Patterns worth keeping

- One accent. If everything is orange, nothing is orange.
- Hairlines and whitespace instead of cards. A record extract is a ruled block, not a surface.
- The dot field is decoration: pointer-transparent, behind content, masked away from the reading column, and hidden in print.
- The seal is printed small and flat, in the margin or footer, never as a hero plate.
- Actions are square, mono, and clearly labelled; no pills, badges, or icon-only controls.
- Code tables, alerts, and record metadata stay inside the documentation's quieter three-column reader.

## Accessibility

Target WCAG 2.2 AA. Body text clears 4.5:1 against the paper; the burnt-orange accent clears 4.5:1 for small text and is never the only carrier of meaning. Links are underlined, the current page uses a fill plus underline, and focus is a visible 2px ring.

- Navigation, chapter groups, and questions use native `details`; Escape closes open menus and returns focus.
- Touch targets are at least 44px for navigation, search, and primary actions.
- Motion is one short arrival on the opening, disabled by `prefers-reduced-motion`.
- Content reflows at 320px and 200% zoom without horizontal page overflow; tables and code scroll inside their own frames.

## Adding a page

A project page is an Astro route under `meta/src/routes/` injected in `astro.config.mjs` and wrapped in `Shell.astro`. Copy goes in both locale catalogs under `meta/messages/`; composition goes in a component or route using the editorial classes. A documentation page is added to `meta/src/lib/registry.ts` with sources at `docs/documentation/{en,ko}/<slug>.md`.

Do not reach into the archive's chrome or the workstation's bevels. Do not add a font, gradient, or shadow to make something feel finished. Restraint and one strong gesture are the system.
