# Design systems

The repository speaks in three registers. Which one you are in decides almost every visual choice.

## Three systems, one repository

CIRCA Archive is not one design system. It is three, each answering a different question.

| System | Surface | Rule |
| --- | --- | --- |
| Workstation | `/desktop` | 1990s institutional software: steel, bevels, dense chrome, 12px. Never use it outside the desktop. |
| Reading edition | `/site` | paper, ink, a serif masthead, filed documents. Depth is a bevel; no gradients. |
| Project page | `/meta` | near-black, bone, ember, serif display, mono labels, a hairline field. Not bound by the workstation rules. |

> [!NOTE]
> The project page is the exception
>
> It is allowed to look unlike the archive because it answers a different question. The archive links here only through a labelled button.

## Project page tokens

The project page's tokens are declared once on .meta-page in components/meta/meta.css. Use them, and do not introduce a fourth accent.

| Token | Use |
| --- | --- |
| `--meta-ink` | the near-black canvas behind every page. |
| `--meta-bone` | primary text, the solid key, and the specimen sheet. |
| `--meta-mist` | secondary text and labels; the smaller size is for captions. |
| `--meta-ember` | index numerals, links, focus rings, and the one accent. Never the only signal. |
| `--meta-line` | rules and borders at 14% bone; the soft variant divides sections. |
| `--meta-serif` | the argument: display headlines, section titles, quotations, and names. |
| `--meta-sans` | reading copy and controls; 16–17px for body text. |
| `--meta-mono` | every label, index, caption, command, and code sample. |

The meta scope also carries the shadcn variables, so a primitive from components/ui inherits this palette without restyling globals. Keep meta styles scoped: the workstation stylesheet must not reach in, and this one must not reach out.

## Patterns worth keeping

The field is the visual signature: a measured grid with edge hatching, corner crosses, mono status rails, and a halftone plate built from CSS dot screens. It is decoration, always aria-hidden.

- One focal point per screen, then a second, then the rest.
- Hairlines instead of cards. A card is a surface, not a default wrapper.
- Numbers and labels in mono; the argument in serif; reading copy in sans.
- One accent. If everything is ember, nothing is.

The reference for the landing page is an instrument panel, not a brochure: status lines, plates, measured margins. Add detail a person can read, not noise.

## Accessibility

Target WCAG 2.2 AA. Project-page text uses bone or mist on near-black; ember is for labels, numerals, and focus, and never the only carrier of meaning.

- Every interactive element has a visible focus ring: 2px ember, offset.
- Motion is one short arrival; honour prefers-reduced-motion.
- Every plate, chart, and screenshot is decoration with a text caption or aria-hidden.
- Navigation and language switching are keyboard reachable; the mobile drawer traps focus through Radix Dialog.
- Content reflows at 320px and 200% zoom without losing function.

Check contrast and focus when you change a control. They are part of the design, not a cleanup pass.

## Adding a page

A project page is a server component under the meta route, wrapped by the shared chrome. Copy goes in the locale's meta catalog; styles go in meta.css under .meta-page. A documentation page adds a topic in `docs-topics.ts` and Markdown files in `docs/documentation/en/` and `docs/documentation/ko/`. Headings, article text, and relative links come from those files on GitHub.

Do not add a page that reaches into the archive's chrome or the workstation's bevels. Do not add a second font, a gradient, or a shadow to make something feel finished. The system's job is restraint with one strong gesture.
