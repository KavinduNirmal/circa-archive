# Project components

## Responsibility

Own the publication's reusable compositions, independent of the Next.js archive and workstation.

## Structure and boundaries

- `BitmapSeal.astro`: static square halftone rendering of the original plotted eye, with an ink/ember printing plate; decorative and font-independent.
- `SectionHeading.astro`: shared numbered section band and optional introduction.
- `Specimen.astro`, `Editions.astro`, `Faq.astro`: illustrative record, two archive entrances, and native question disclosures.
- `AboutPage.astro`: project dossier, team register, terms, and support pages. The dossier pairs its introduction with the shared bitmap seal, then presents the premise, institutional principle, and fact register before editions, questions, and contact links.
- `Document.astro`: accessible manual layout and progressive search/copy hooks; article content comes from the explicit public registry.
- `TeamAvatars.tsx`: the shadcn/Radix avatar contract in the only React island. Images are local; initials cover failures. Team names and roles render outside the island, with a no-JavaScript portrait fallback.

Copy belongs in locale catalogs, team data in `../lib/site.ts`, and styling in `../styles/site.css`. Do not import Next.js runtime components or private content.

## Verification

From `meta/`, run `bun run typecheck`, `bun run test`, `bun run build`, and `bun run test:e2e`. The identity browser scenarios cover narrative order, portrait loading/failure, shallow-page breadcrumbs, support links, controls, and mobile navigation.
