# Public site

## Responsibility and structure

The project's public face and the transition into the fiction.

- `terminal-copy.ts`: everything the archive half says. The institution's own voice: the public access notice, the three clauses, the scene labels, the field list an entry carries, the organizations' vocabularies, and the entry band. No repository facts, no frameworks, no licences.
- `site-meta.ts`: everything the project half says, plus every real fact either half is allowed to print. Project identity, the two tracks, the writers' filing types and canon rules, the developers' stack, layout, commands and loop, the document index, and the specimen record.
- `landing-page.tsx`: the composition. A server component; the only stateful parts are the islands below.
- `copy-command.tsx`: the copy control for a command or a document path. Reports a blocked clipboard rather than failing silently.
- `boot-sequence.tsx`: the power-on screen at `/desktop` and the `WorkstationBoot` wrapper that mounts the shell behind it.

## The composition

The page has two movements and two materials, and the composition says so before the copy does.

- **The archive** (dark steel). A bar, a masthead that owns a viewport of quiet, the three duties, the entries on file, one filing set as paper, the bodies the archive files under, and an entry band. Mono for all data, uppercase micro-labels, hairline and dotted rules.
- **The hinge.** A full-bleed band with a dashed cut line, saying out loud that everything above it is fiction and everything below it is the project.
- **The brief** (paper). A letterhead with a two-entry contents list, then the two tracks, then a document colophon, then a dark band that closes the page back in the fiction and re-offers the way into the machine.

Three rules keep it from flattening into an even stack of sections, which is the failure mode this page had first time round:

1. **One spacing scale.** Every gap is `--s1` to `--s6` (6, 12, 22, 38, 64, 104px). Scenes take the large steps, items inside a scene take the small ones, so the rhythm varies on purpose: an airy clause band, then a dense ledger, then an open filing scene.
2. **One rail.** `--rail` carries the § number and a single word at a constant x in every scene, and it sticks while the scene scrolls. The eye always has a left anchor and always knows which movement it is in. The seal sits at that same x in the masthead, and every scene heading sits at the body x, so the two columns are alignment, not decoration.
3. **Few containers.** Rules and bands do the grouping. Borders are kept for surfaces that exist in the world: the notice, the paper filing, a command line. There is no card grid on the page, and no badge that is not a word.

The eye path the layout is built to produce: seal, wordmark, commission, one line of machine data, the notice, the cue, then § 1 to § 4, the entry band, the hinge, the letterhead contents, track A, track B, the colophon, the closing action.

## Usage

`/` renders the landing page. `/desktop` renders `WorkstationBoot` around `DesktopShell`, so arriving at the workstation plays the post screen first: the shell mounts underneath and stays `aria-hidden` and `inert` until the last check resolves, which makes the handover a reveal rather than a page load. `bootLines()` reports what the shell actually mounted, and `useSyncExternalStore` reads `prefers-reduced-motion`, so an operator who asked for less motion never sees the post screen.

Changing the copy: the fiction goes in `terminal-copy.ts`, the project goes in `site-meta.ts`. The split is enforced, not conventional, by two checks in `tests/site-meta.test.ts`: the project's figures must match the manifests, the checkout, and the README, and the terminal's copy may not mention a repository, a pull request, a licence, or a framework.

## Boundaries

The page reads from `../browser/archive-index.ts`, `../files/files-index.ts`, and `../mail/mailbox-index.ts` for its counts, its ledger, its organizations, and its specimen; it writes nothing and owns no state beyond a clipboard acknowledgement. It is not a second source of truth: when a fact changes, it changes in the file that owns it, and `site-meta.ts` is updated to match. Filing, search, and record rendering belong to the applications inside the workstation, not here.

Two consequences of that rule are visible in the design. The backend rows are marked `planned` because the services, database, and storage are drafts in `ARCHITECTURE.md` and nothing is running. The document index copies a path rather than linking it, because no Git remote is configured yet and a link would be a promise the checkout cannot keep.

## Verification

Run `bun run --cwd=client test`, `lint`, `typecheck`, and `build`.

The first landing page was replaced on 2026-10-15 after review: it was an even stack of five identical sections, each a numbered heading with a right-aligned standfirst over a card grid, which read as generated rather than as the institution the rest of the project builds. The redesign rebuilt the page as two movements with one spacing scale, one rail, and the material change at the hinge. Verified in headless Firefox (157.0.1) at 1440px and 430px, with full-page captures and detail crops at native scale, plus the unit suite (203 tests). Rendered and inspected: the masthead, all four archive scenes, the entry band, the hinge, the brief letterhead, both tracks, the command rows, the colophon, and the closing band at both widths.

Findings fixed in the same pass:

- The seal was a dim smudge at 132px under a mask that cut its own ring away. It is now 148px, unmasked at the centre and only faded at the photograph's edges, and it holds the rail column.
- The commission name wrapped to two lines and broke the masthead block. The measure was widened so it sets on one line at desktop.
- The notice was the masthead's second voice on paper and a narrow column on a phone. Below 640px it now reads across the full measure.
- Command notes drifted with the length of the command. They now take the far end of the row, so the command lines read as a form.
- The paper half was too close to the archive's grey. It keeps the shared paper tokens but scopes a lighter sheet and darker soft ink, because this is a document meant to be read at length.

Limitations: headless Firefox screenshots fire before React hydrates, so the Radix-portaled menu and popover surfaces still cannot be captured; the Start menu's exit link is covered by the unit suite instead. The capture pipeline occasionally serves a light half of a screenshot with inverted values, so background colours on paper were checked by sampling pixels rather than by eye.
