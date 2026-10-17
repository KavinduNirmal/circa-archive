# Public site

## Responsibility and structure

The public agency portal at `/` and the workstation's boot sequence.

- `landing-page.tsx`: server-rendered public notices, audience procedures, directory, revision register, and archive entry. All copy comes from the `landing` namespace, so the page is the same composition in every language.
- `landing-page.module.css`: scoped portal layout, steel and paper palette, responsive rules, and rare decorative movement.
- `boot-sequence.tsx`: the existing `/{lang}/desktop` power-on screen and `WorkstationBoot` wrapper. `bootLines` takes a translator, so the post reports the mounted index in the reader's language.
- `boot.css`: the post screen's plate, seals, progress cells, and its blink and settle animation. Imported by `boot-sequence.tsx`.
- The language switcher both this portal and the workstation use lives one level up, in `../language-switcher.tsx`.

## Localization decision — 2026-10-15

The portal and the workstation chrome follow the request's language; the application interiors behind them do not yet. Strings were moved to `messages/en.json` and `messages/ko.json` rather than into a per-component dictionary, and the landing page is a Server Component, so its prose is rendered rather than shipped: `src/app/[lang]/layout.tsx` sends the browser only the `shell`, `boot`, and `switcher` namespaces.

Two things deliberately did not translate. The seal monogram `IR / CA` is a graphic device, not prose, and stays in the markup. Archive codes, document numbers, dates, and the circular number are identifiers — `PA–01` is the same document in either language — so they are carried through the catalogs unchanged and a test holds them.

Neither bundled face carries Hangul. `:lang(ko)` in `globals.css` names the Korean faces to fall back to so the three platforms agree; the portal's own stacks name generic `serif` and `monospace` fallbacks and already degrade that way. Bundling a Korean webfont, and whether the uppercase micro-label tracking should be relaxed for Hangul, are open questions recorded in `../../../.agents/brain/DESIGN.md`.

## Design decision — 2026-10-15

The landing redesign brief supersedes the previous explicit fiction/project split. All displayed copy and route metadata now use the Commission's institutional voice without naming the project. The Commission retains its established full name and domain rules; its administrative appearance does not change its nature into a real government agency. The brief's mixed serif, monospace, and sans-serif typography and uneven spacing override the workstation's strict sans-serif/spacing rules on this route only.

The purpose is orientation and entry. A compact blue-steel masthead and conventional top navigation sit above a narrow directory, a paper public notice, and a secondary notices column. Hard rules, numbered procedures, an outdated news register, and an intentionally misplaced continuation stamp create an aging portal. The archive entry remains above the fold on a phone; the full directory follows the procedures on narrow screens, with compact procedure shortcuts directly beneath the public access statement. No remote fonts, motion libraries, or new client state are required. A decorative register mark shifts for 80ms after 19 seconds, once per page load. Reduced motion disables it; the displaced stamp remains.

## Boundaries

The only application destination is the workstation, reached in the reader's own language. Local links resolve to real sections, including an unavailable-document notice. Public access explains how to use Archive and Search. Submission guidance describes temporary editor drafts and does not promise transmission. Organization registration and credential verification are explicitly unconnected, with no fake form or invented authentication. The contact directory lists routing references, not operational email addresses. The page makes no claim of a network security clearance.

## Usage and verification

Run `bun run --cwd=client test`, `lint`, `typecheck`, and `build`. `tests/landing.test.tsx` covers the primary path, four audience procedures, internal link targets, service limitations, and diegetic metadata. Browser checks in `e2e/landing.spec.ts` cover keyboard entry, mobile overflow, document disclosure, and reduced motion. Inspect desktop and mobile captures for density, legibility, hierarchy, and the intentionally displaced stamp. Boot behavior remains covered by `tests/workstation-boot.test.tsx`.

## Verification — 2026-10-15

The four portal contract tests first failed against the previous page, then passed after replacement. Final verification passed: 188 frontend unit tests, 7 repository tooling tests, lint, TypeScript, folder README checks, and production build. The legacy two-movement copy, clipboard control, styles, and their obsolete tests were retired with that composition.

All six `landing.spec.ts` tests passed in Chromium against a production server on port 3002: responsive layouts at 1440/640/390/320px, keyboard skip and archive entry, disclosures, unavailable-document navigation, and live reduced-motion switching. The same tests against the existing development server passed five checks but left the destination workstation at its unhydrated boot screen in the keyboard test; the trace also recorded HMR WebSocket handshake failures. Production verification used a temporary Playwright config with the same test file and `baseURL: http://localhost:3002`. The broader pre-existing desktop browser suite was not run.

Interactive browser review inspected full desktop, tablet, and phone layouts, confirmed no horizontal overflow, and exercised the archive path. Tablet registers now stack to avoid cramped headings; phone procedure links precede the longer notices. Computed text contrast was checked across 153 visible text elements; the five marginal directory numbers were darkened to the already-verified secondary ink. The static displaced stamp remains under reduced motion; the decorative register movement lasts 80ms, once, after 19 seconds. Preview captures are `/tmp/circa-landing-desktop.png` and `/tmp/circa-landing-mobile.png`.
