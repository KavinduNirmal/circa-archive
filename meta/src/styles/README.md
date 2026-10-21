# Publication styles

## Responsibility and structure

`site.css` owns the independent Astro site's typography, shared 1280px ruled frame, spacing tokens, near-black/bone/ember palette, square controls, and responsive compositions. Instrument Serif and Noto Serif KR carry headings; DM Sans carries prose; IBM Plex Mono carries uppercase controls and navigation.

## Boundaries

Patterns frame the identity artwork on Home and About the Project, with a restrained documentation/fact-register accent. The project dossier also uses a bone/ink principle band with a hatch confined to its edge. Prose remains clear. The original character seal in `../lib/seal.ts` supplies `BitmapSeal.astro`: square halftone cells on a two-ink ember/black plate. A faded grid surrounds the plate; the documentation index uses a restrained diagonal hatch. Neither treatment sits behind prose, requires animation, nor depends on JavaScript. Portraits are cropped square. These styles must not reach the archive/workstation, which run in the separate Next.js project.

## Verification

Build from `meta/` with `bun run build`, then run `bun run test:e2e`. Inspect the captured EN/KO pages at 375, 768, 1024, and 1440px, including mobile disclosures, large text, focus, and reduced motion. Passing overflow assertions alone does not establish visual quality.
