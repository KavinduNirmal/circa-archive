# Archive browser

## Responsibility

The in-world web browser, opened from the **Search** desktop shortcut. It shows exactly one document: the CIRCA internal archive index, presented the way a 1999 institutional intranet page was presented. It is the first destination with a real application screen instead of a placeholder.

A record is the one thing this window does not open. Reading a record is the [reader](../reader/README.md)'s job, and a second, worse record view here would be two readers to keep in step; the shell hands the code over and the browser marks it visited.

The fiction drives the interaction model. The local network permits one address and one tab, so every other browser affordance is present, correct, and refused with an in-world reason rather than hidden:

| Affordance | Behaviour |
| --- | --- |
| The single tab | Permanent, never closable, always labelled `CIRCA Internal Archive`. Activating it returns to the index. |
| **New tab** (`File`, and the `+` in the tab strip) | Refused: additional browser contexts are not permitted on the local network. |
| Address bar | Editable, but only the archive address resolves. Any other host is refused and the field is taken back. |
| Bookmarking | Disabled, with the reason on the item. |
| **Stop** | Permanently disabled and labelled `No transfer in progress`: this browser never has a transfer to abort. |
| Back / Forward | Real. A document stack with a cursor drives them, and they are disabled at the ends of that stack. A record is not a document in that stack: opening one leaves the index on screen. |
| Refresh / Home | Real; both report what they did in the status bar. |
| View → Text size | Real; scales the document through `data-text-size` without touching chrome. |

## Structure

- `archive-index.ts`: the entry vocabulary, the preview fixture, and the pure query function. No React, no presentation.
- `archive-page.tsx`: the document the browser displays (index, results, no-match) and nothing else. It renders no record: a code is handed to the reader and the index stays where it was, so Back is still the way to the list the code came from.
- `browser-chrome.tsx`: the browser's own furniture: menu bar, toolbar and address bar, the permanent tab strip, and the status bar.
- `browser-window.tsx`: the document stack, the search form state, the action set, and the composition of chrome plus page.
- `browser-notice.tsx`: the refusals and the About box, as classic message boxes.
- `browser-identity.ts`: the in-world product name and window title, in their own module so the notices and the chrome do not import each other in a cycle.

## Visual contract

The chrome is workstation furniture: steel palette, hard bevels, uppercase micro-labels, no rounding. The document inside the tab is not: it switches to the paper surface the records render on. That contrast is the whole idea, because it makes the window read as a frame around someone else's document rather than one more steel panel.

- **Composition.** Menu bar, then toolbar and address on one row, then the tab strip, then the page, then a two-part status bar. The active tab wears the page's own paper colour and drops its bottom edge, so it merges into the document below.
- **Document language.** Masthead with the supplied seal as a printed plate, a double rule, the section links, a boxed search block, a bordered table, and a footer. Chrome labels and table headers are uppercase; document prose is sentence case, because a paragraph set in caps is harder to read for no institutional gain.
- **Colour roles.** Ink on pale zinc paper; deep institutional blue for links; a muted violet with a dotted underline for visited codes, so the state is not colour alone; hazard amber for the restricted-zone lock and the level stamp; crimson for sealed and restricted statuses. Status is never carried by colour alone.
- **Hierarchy.** The search block is a filled, bordered plate on the index, where searching is the page's job, and an outlined block of the same fields above a record, where the record leads. One filled button per page: the search submit.
- **States.** Index with recently filed; results with a wired table; no match with three format hints plus targeted recovery (widen the period) and a full reset; a withheld record; the refusal and About boxes; text size small, normal, and large.
- **Reflow.** The browser is its own size container, because a workstation window is resized independently of the screen. Below 560px the toolbar drops to icons (the accessible name lives on `aria-label`, so nothing is lost); below 480px the address bar takes its own row; below 430px the search fields stack and the status bar keeps the zone cell and drops the clearance cell.

## Data and honesty

The fixture is illustrative preview content, not canon, and the page says so in its footer. It is deliberately mundane: no organization is named, no incident claims a story, and any body whose designation would name one is withheld as `null` so the page can render the design system's redacted bar. Codes and dates follow `PROJECT_CONTEXT.md` (`INC-00000`, `ORG-A-000000`, `ORG-A-000000/C1`, `CIRCA-R-0000`). A withheld designation is not in the searchable text, which is the point of withholding it.

Nothing here reaches the network. There is no request to fail, so no loading or transport-error state exists; the archive is instant because it is local, and the status bar reports exactly what happened rather than simulating a transfer.

## Boundaries and verification

Search only. Filing, records, votes, authorization, and every other destination belong to the backend and later screens. The window carries no generic destination status strip: the browser prints its own status bar, and `WorkstationWindow` now omits that strip when a destination passes a null status.

Run `bun run test` for the query rules, the single tab, the refusal, the document stack, the visited marker, and the handoff to the reader; `bun run lint` and `bun run typecheck` for the rest.
