# Public site

## Responsibility and structure

The project's public face and the transition into the fiction. Everything here is outside the story: it is addressed to contributors, so it prints real status, real commands, and real links instead of in-world copy.

- `site-meta.ts`: the facts the landing page is allowed to state. Project identity, community roles, the stack with each row marked `shipped` or `planned`, the repository layout, the documented commands, the eight contribution steps, the document index, and the specimen record.
- `landing-page.tsx`: the page composition (docket, community, record, project record, contributing, documents, footer). A server component: it holds no state, and the two things that need state are islands.
- `copy-command.tsx`: the copy-to-clipboard control for a command or a document path.
- `boot-sequence.tsx`: the power-on screen at `/desktop` and the `WorkstationBoot` wrapper that mounts the shell behind it.

## The rule this folder exists to enforce

A landing page makes claims about a repository, and claims drift. `tests/site-meta.test.ts` checks every one of them against the thing it describes: the runtime and framework versions against `package.json` manifests, the document and layout paths against the files on disk, every `bun run` command against the script the manifest defines, the status against the README's own status line, and the specimen record against the archive index the browser files. If any of those change without the page changing, the suite fails. Nothing here may state a fact that no other file can confirm.

Two smaller consequences of the same rule:

- The backend rows are `planned`, and the table draws them with a state chip, because the services, database, and storage are drafts in `ARCHITECTURE.md` and nothing is running.
- The document index copies a path rather than linking it. No Git remote is configured yet, so a link would be a promise the checkout cannot keep.

## Usage

`/` renders the landing page. `/desktop` renders `WorkstationBoot` around `DesktopShell`, so arriving at the workstation plays the post screen first: the shell mounts underneath and stays `aria-hidden` and `inert` until the last check resolves, which makes the handover a reveal rather than a page load.

`bootLines()` reports what the shell actually mounted (nodes in the file index, letters in the mail spool, entries in the archive index) so the numbers on the post screen are the same numbers the workstation will show. `bootDurationMs()` is derived from the line count, and the boot test drives the timers by hand rather than waiting them out. `useSyncExternalStore` reads `prefers-reduced-motion`, so an operator who asked for less motion never sees the post screen, and a mid-session change is honoured. Any key, or the Skip post button, hands the screen over immediately.

The landing page's nav and the copy controls are real. Copy reports a blocked clipboard instead of failing silently, because the clipboard API is unavailable over plain HTTP and in some locked-down browsers.

## Boundaries

The page reads from `../browser/archive-index.ts`, `../files/files-index.ts`, and `../mail/mailbox-index.ts` for its counts and its specimen; it writes nothing and owns no state of its own. It is not a second source of truth for project facts: when a fact changes, it changes in the file that owns it and `site-meta.ts` is updated to match, which the test then enforces. Filing, search, and record rendering belong to the applications inside the workstation, not here.

## Verification

Run `bun run --cwd=client test`, `lint`, `typecheck`, and `build`.

Verified on 2026-10-15 by rendering `/` and `/desktop` into headless Firefox (157.0.1) at 1440px and 420px and inspecting the pixels, plus the unit suite. Rendered and inspected: the masthead with the docket plate and the seal watermark, the shipped-stack ledger, the community role grid, the specimen record on paper, the project table with planned-state chips, the repository layout, the contribution steps with their command rows, the document index, and the footer at both widths; and the post screen in both its posting and handed-over states.

- The boot plate was nearly the same value as its own field. The field is now darker at the edges, the plate keeps a deeper inset glow, and the screen wears the same scanline filter as the desktop it reveals.
- The section rail was cut off at 420px with no sign that it scrolls. It now fades at its right edge below 720px.
- The specimen is `INC-00042` from the browser's index rather than a record written for the page, so the example a visitor reads is the one the workstation returns for that code.
- Limitation: headless Firefox screenshots fire before React hydrates. The Radix-portaled menu and popover surfaces still cannot be captured; the Start menu's new exit link was verified in the unit suite instead, and every other surface on these two routes is server-rendered.
