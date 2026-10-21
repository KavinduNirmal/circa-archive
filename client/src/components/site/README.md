# Public site

## Responsibility and structure

The public agency portal at `/` and the workstation's boot sequence.

- `landing-page.tsx`: the server-rendered portal — masthead, navigation, the public access statement, four audience procedures, the register rails, the contact and revision tables, and the policies. All copy comes from the `landing` namespace, so the page is the same composition in every language.
- `landing-page.module.css`: the portal's skin. Steel chrome over three paper tones, a bevel and a rule everywhere, no gradients. Responsive rules for the three-column page, the two-column tablet page, and the stacked phone page, plus Korean word breaking.
- `portal-signs.tsx`: the four small client behaviours — the sentences that change, the attendance readout, the refreshable register, and the links to pages the site lists but does not hold. They carry no copy; every string arrives as a prop.
- `portal-signs.css`: their furniture — the sunken counter wells, the cream notice slip, and the link-shaped buttons.
- `boot-sequence.tsx`: the existing `/{lang}/desktop` power-on screen and `WorkstationBoot` wrapper. `bootLines` takes a translator, so the post reports the mounted index in the reader's language.
- `boot.css`: the post screen's plate, seals, progress cells, and its blink and settle animation. Imported by `boot-sequence.tsx`.
- The language switcher both this portal and the workstation use lives one level up, in `../language-switcher.tsx`.

## Localization decision — 2026-10-15

The portal and the workstation chrome follow the request's language; the application interiors behind them do not yet. Strings live in `messages/<locale>/` rather than in a per-component dictionary, and the landing page is a Server Component, so its prose is rendered rather than shipped: `src/app/[lang]/layout.tsx` sends the browser only the shell, boot, and switcher namespaces.

The four client components in this folder read copy from props, not from the catalog, so the `landing` namespace still never enters the client bundle. What crosses is a handful of specific strings attached to those components, not the catalog they came from.

Two things deliberately did not translate. The archive codes, document numbers, dates, and the circular number are identifiers — `PA–01` is the same document in either language — so they are carried through the catalogs unchanged and a test holds them. The logo is an image and carries no translatable text; the accessible name of the institution is the `h1` beside it.

Neither bundled face carries Hangul. `:lang(ko)` in `globals.css` names the Korean faces to fall back to so the three platforms agree; the portal's own stacks end in generic `serif`, `sans-serif`, and `monospace` fallbacks and already degrade that way. Korean prose also sets `word-break: keep-all`, because Hangul breaks between syllables by default and a word like "마십시오" should not be split across two lines. Bundling a Korean webfont, and whether the uppercase micro-label tracking should be relaxed for Hangul, remain open interface questions.

## Design decision — 2026-10-17: an agency site left running

This supersedes the 2026-10-15 portal composition. The page is no longer a tidy public-information site with a decorative register mark; it is the Commission's own site as it would have looked if one clerk had built it in 1998 and nobody had touched it since. The routes, the institution, and the copy's jurisdiction are unchanged.

**The problem with the previous page.** It was legible but it looked designed. Clean gutters, a modern grid, and one moving element read as a current site dressed in old colours. A reader could tell the era from the palette but not from the page.

**What replaced it.** A table-shaped page: three paper columns divided by rules, boxed panels with steel title bars, a directory, a notice board, a rotated continuation stamp with a receipt stamp laid over its corner, a hit counter in sunken cells, a closing line that recommends 800 × 600, and a link list to four pages the site does not hold. Density replaces whitespace. The page is longer than it needs to be on purpose, because a site of this period was.

**No gradients.** There is not one on this page, and a test asserts it. Every surface is a flat fill inside a one-pixel rule, and depth comes only from the bevel: the top and left edge light, the bottom and right edge dark. That is the difference between an artefact and a modern interface borrowing the artefact's colours.

**The controls are the workstation's.** Navigation is a row of raised steel plates with the current page pressed into the paper; the entry block offers two doors side by side — the workstation in the blue block and the public reading edition as a paper key — each with a two-pixel bevel that inverts when pressed; links are the platform link blue and underlined. Focus is a dotted rectangle, which is what the era's browsers drew. Redrawing a distinct "retro" control set here would have made the portal a different machine from the one it leads to. Visited links were dropped on purpose: the browser's plum turned the navigation into a record of where the reader had been, which reads as a fault on a bar that is meant to stay fixed.

**The logo.** `public/circa_full_logo.svg` — the eye and the `C.I.R.C.A` wordmark — sits on a dull paper plate in the masthead, where the drawn `IR / CA` monogram used to be. The artwork is black, so it needs a light plate against the steel chrome, and the result reads as a printed mark pasted into a banner, which is what the site would have had. The full lockup is used rather than the bare eye because the wordmark is the institution's short name and the `h1` beside it carries the long one; a reader should be able to learn both from the banner.

**The page stays in the fiction.** An earlier pass in this change announced "not a real office" in a cream strip and a footer colophon. That was removed: the page is the agency's own site from the utility strip to the last line, and the meta layer is carried by the route metadata, by the archive link leading to a workstation that marks itself as a preview, and by the page's own structure — a directory, a breadcrumb, and sectioned procedures that let a reader see where they are without being told the fiction is a fiction. A test asserts the page never uses out-of-character words (not a real office, demonstration, reconstruction, simulation, fictional).

**The sentences that change.** Five sentences are replaced for a moment and put back: the correspondent notice (the brief's own example — "retain the reference number" becomes "forget the reference number"), the access statement (a record confirms _your_ receipt), the hours addendum, the visitor note (one of these is present, then two), and the closing line (the document does not end here). Each replacement lives in the markup as `data-alter`, beside the printed sentence in the catalog, because a translator who cannot see both versions will not write a variant that reads as the same sentence remembering itself differently. The cues are staggered from six to forty-five seconds, so two never fire together; two changes at once read as an effect, and one change while the reader is somewhere else is the uncanny thing.

**The page acknowledges the visitor without keeping them.** The attendance box counts the time this tab has been open, and after a minute its note changes from "recorded" to "still present". The visit counter reads 412 and says one of them is present, which is true. Neither stores anything and neither identifies anyone: the acknowledgement is real and it cannot follow the reader anywhere, which is the only version of this that is not a lie.

**Refreshing the register.** The register's refresh control withdraws the notices on screen, says none were received, and dates the page a day earlier. The notices remain illustrative, so this is the only refresh their register performs, and the way it runs backwards is the joke.

**Pages that are not held.** The rail lists four pages — a withdrawn reading-room plan, a guestbook closed in 1998, the previous circular, an index of personnel — as ordinary links. Choosing one opens the workstation's own message box with the reason and the reference. They are buttons rather than anchors because nothing navigates, which also means no address is invented for a page that does not exist.

**What was retired.** The register mark's 80 ms shift after 19 seconds is gone; the page's movement is now the altered sentences, which are rarer and more specific. The earlier out-of-character strip and colophon are gone too. The continuation stamp stays, now joined by a receipt stamp, and the stamp is a static tilt rather than an animation, so it survives reduced motion.

**Typography.** Verdana for the site's own labels, Georgia for anything the institution says at length, and Courier for codes, dates, and counters — the mixed staging of the period, and a deliberate exception to the workstation's single sans stack. All three end in generic families so Korean degrades to a platform face.

## Boundaries

The only application destination is the workstation, reached in the reader's own language. Local links resolve to real sections, including an unavailable-document notice. Public access explains how to use Archive and Search. Submission guidance describes temporary editor drafts and does not promise transmission. Organization registration remains unconnected. Personal account registration and sign-in use the real authentication service through the separate access pages. The portal navigation resolves the current session on the server. The contact directory lists routing references, not operational email addresses. The page makes no claim of a network security clearance and does not break character to explain itself.

The uncanny behaviours are presentation, not data. The uncanny effects do not store a visit, set cookies, or call a network; the alterations are attributes in the markup, the attendance is a local interval, and the refresh is a state change. Authentication UI lives separately in `../auth/` and uses essential session cookies; it does not change these presentation effects.

## Usage and verification

Run `bun run --cwd=client test`, `lint`, `typecheck`, and `build`. `tests/landing.test.tsx` covers both archive entries — the workstation and the public reading edition — the four audience procedures, local link integrity, the page staying in character, the altered sentences in the markup and their staggered cues, the closed pages, and the no-gradients rule. `tests/portal-signs.test.tsx` covers the alteration cycle and its reduced-motion opt-out, the attendance count and its "still present" note, the refresh withdrawing the notices and dating the page earlier, and the message box behind a closed page. `tests/i18n-messages.test.ts` holds the English and Korean catalogs in step, including the alteration pairs.

## Verification — 2026-10-17

The new contract tests were written first and failed against the previous page and a stub client module: 12 landing assertions, then 5 behavioural failures in the portal apparatus. They pass after the rewrite. The full frontend suite, lint, TypeScript, the folder-README check, and a production build are clean.

Screenshots were inspected at 1440px and 390px, in English and Korean: the three-column page, the stacked phone page, the logo plate, the two stamps, the counter wells, the notice board, and the foot. Captures fire before the client effects mount, so altered sentences and the message box do not appear in them; both are covered by the unit tests, and the browser suite is written to exercise the alteration timer.

Browser-suite limitation, stated plainly: `e2e/landing.spec.ts` was updated for the new page — the archive entry, the withdrawn document, the disclosure, the sentence alteration, and reduced motion — but was **not run**. Playwright's Chromium is not installed in this environment, and the download stalled when pointed at a writable cache, so nothing here is a claim about browser results.
