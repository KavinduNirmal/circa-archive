# Independent project website

## Decision

Move the out-of-fiction project website from Next.js to the independent `meta/` Astro package. Keep the archive, workstation, and accounts in `client/`. Retain English and Korean, the dark editorial palette, serif headings, and ruled composition. Redesign Home, Documentation, About, and a dedicated Sponsor page.

Documentation is built from allowlisted checked-out public Markdown. Changes require a new build; runtime GitHub fetching and its cache are removed. Private lore and `.agents/brain` are never content sources. Shared English lore remains English in the Korean interface, with a language notice.

Nginx selects separate project and archive origins. The project has an independent static Nginx container; the existing gateway owns host routing, legacy redirects, API forwarding, and forwarding-header replacement. Public origins are configuration, not inferred from an inbound Host header. Archive authentication stays on the archive origin.

Navigation is Home; Documentation (Overview, Lore, Contribution, Building); About (project, team, terms); Sponsor; Enter the archive (public archive, workstation). Documentation chapters collapse; article bodies remain expanded. No backend schema, account policy, license, or publishing workflow changes are introduced.

## Consequences and verification

Astro can build without a backend or GitHub connection once dependencies are installed. The two applications share public source documents through the repository, not application imports or a new workspace. Legacy locale-prefixed meta links receive permanent redirects; existing article heading IDs remain stable. Moved About fragments have compatibility targets and browser enhancement.

Run the repository, client, meta, browser, and ingress checks documented in their READMEs. Build and verify replacement artifacts before switching live traffic. Keep the prior application and routing artifacts for rollback. Real hostname, TLS certificate provisioning, and live deployment remain operator configuration.

## Editorial identity restoration — 2026-10-21

The Astro migration retains CIRCA's original near-black, bone and ember publication identity. Its shared frame, numbered section bands, square geometry, uppercase IBM Plex Mono controls and faint localized patterns replace inconsistent page-specific styling. The homepage sequence is hero, original plotted seal with the existing agency motto, project explanation/specimen, editions, documentation, build facts, contribution instructions, and questions.

Only documentation retains a breadcrumb. Mobile chapter navigation uses a compact native disclosure; desktop keeps the three-column manual. Repeated opening prose is displayed once without modifying the downloadable source. The shadcn/Radix avatar group is restored as a small React island, with a locally served actual GitHub portrait and initials fallback. Explicit user requirements supersede earlier allowances for tiny rounded corners and monograms-only profiles. Local portrait serving preserves the absence of runtime third-party image requests. Sponsor lists Buy Me a Coffee alongside the configured GitHub Sponsors destination and nonfinancial contributions.

All existing routes, locales, source endpoints, separate-origin links and Nginx compatibility redirects remain part of the migration contract.

### Bitmap and two-tone refinement

The identity plate now samples the existing plotted seal into static SVG square halftone cells, preserving the original character-grid aspect ratio. It uses only ink and ember, with a faded technical grid around the plate and stippling at its corners. The documentation index receives a more visible, masked diagonal hatch. These textures remain outside paragraph backgrounds; they do not animate or require JavaScript, new image assets, or a client rendering dependency.

The About the Project dossier reuses the bitmap seal in a split introduction, followed by the existing premise and a bone/ink principle band. Its fact register separates the explanation from the technical entries. A masked hatch occupies the section's top gutter, and the principle band's hatching is confined to its edge. All existing section IDs, localized prose, edition links, questions, contact destinations, and legacy fragments remain intact.
