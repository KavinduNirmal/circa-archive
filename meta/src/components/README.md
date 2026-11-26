# Project components

## Responsibility

Own the publication's reusable compositions, independent of the Next.js archive and workstation.

## Structure and boundaries

- `BitmapSeal.astro`: static square halftone rendering of the original plotted eye. It is printed small and flat in the project margin and specimen header; decorative and font-independent.
- `BrandIcon.astro`: drawn GitHub, ChatGPT and coffee marks for branded actions. Icons inherit the link colour and are decorative.
- `Specimen.astro`, `Editions.astro`, `Faq.astro`: a ruled record extract, two archive entrances set side by side as adjacent passages, and native question disclosures with drawn plus icons.
- `Beginnings.astro`: the four ruled index rows that begin the documentation from the landing page. It is a list, not a card grid, so the sequence reads as the archive's table of contents.
- `AboutPage.astro`: project account, team register, terms, and support pages. The project page places the seal in its margin note, then follows the premise, institutional principle, fact register, editions, questions, and contact links without numbered section bands.
- `Document.astro`: the documentation reader. Search and chapter navigation sit in the left column; the right column carries the current page's headings. Article content comes from the explicit public registry.
- `CopyMarkdown.tsx`: the copy control and tooltip inside the reader.
- `TeamAvatars.tsx`: the shadcn/Radix avatar contract in the only React island. Portraits are circular, local, and grayscale; initials cover failures. Team names and roles render outside the island, with a no-JavaScript portrait fallback.

Copy belongs in locale catalogs, team data in `../lib/site.ts`, and styling in the modules under `../styles/`. Do not import Next.js runtime components or private content.

## Verification

From `meta/`, run `bun run typecheck`, `bun run test`, `bun run build`, and `bun run test:e2e`. The identity browser scenarios cover narrative order, the agency motto, portrait loading/failure, shallow-page breadcrumbs, support links, control geometry, search scope, and mobile navigation.
