# Incident editor

## Responsibility and structure

The browser-local incident authoring interface shared independently of its site frame.

- `workspace.tsx` places horizontal Form information / Content navigation above the main panel and coordinates Editor / Preview tabs, local checks, registry details, and restricted-character acknowledgement.
- `incident-form.tsx` presents incident questions; `source-editor.tsx` wraps `@uiw/react-md-editor` with an H1–H6 dropdown, italic, bold, quote, inline code, code block, external reference, internal reference, and redaction actions. Formatting uses the current selection and remains undoable. Heading levels replace the current line’s heading marker; quotes prefix the selected lines.
- `preview.tsx` uses the existing record renderer with entity-reference and attached-image presentation. Raw HTML stays disabled; malformed YAML yields a recoverable message.
- `entity-sidebar.tsx` handles fixture search, imports, temporary entities, and local image attachments. `modal.tsx` provides accessible dialogs and the mobile drawer.
- `site-editor.tsx` is the site host: restore, serialized debounced saves, object-URL lifetimes, and font preferences.
- `registry-fixtures.ts` supplies illustrative entities and verified destinations. `editor.module.css` owns the paper/steel layout and matched input/highlight font metrics.

## Interfaces and boundaries

`IncidentEditorWorkspace` accepts an `IncidentDraft`, `onChange`, registry data, controlled font settings, and an asset resolver. It owns no storage or route. Other hosts can embed it; this change does not integrate the desktop Word application.

The Markdown input stays mounted across both tab levels, preserving history and selection. Font choices affect editing only. Attached images persist as blobs with stable IDs, never object URLs. Removing temporary entities leaves authored text intact, making references unresolved. Permanent character removal withdraws the draft's import permission.

A restricted-character acknowledgement applies to this draft only. The warning describes the future submission policy; this prototype sends no owner notifications and makes no network writes.

Content warnings are checkboxes for Graphic Violence, Psychological Horror, Sexual Violence, Self-Harm, and Major Character Death, plus No Warnings Apply and Warnings Not Provided. The last two are distinct confirmations: No Warnings Apply states that none of the listed warnings are present, while Warnings Not Provided leaves the question open. Selecting a specific warning clears both disclosure checkboxes; selecting a disclosure clears the specific warnings. Removing the last specific warning returns the draft to Warnings Not Provided. Drafts saved by the first editor with `none`, `green`, `yellow`, or `red` are normalised when restored. Check draft reports local issues, while submission remains unavailable. Backlinks remain empty until a draft has been filed.

Draft restore failures preserve the stored copy and allow in-memory editing. Save failures show an unsaved notice. The save debounce is 400ms, with a flush on route unmount and an attempt on page hide. A locale remount waits for the previous flush; leaving with unsaved edits invokes the browser’s unsaved-changes safeguard. For a full reload, users should wait for the saved status before closing. A browser can still evict local data.

## Usage and verification

Open `/en/site/write/editor` or `/ko/site/write/editor`. Add translations to the `editor` catalogs in both locales.

From `client/`, run `bun run test -- tests/incident-editor-workspace.test.tsx tests/incident-editor-host.test.tsx`, `bun run lint`, `bun run typecheck`, and `bun run test:e2e -- e2e/incident-editor.spec.ts`. Browser tests exercise real editor input, undo, font alignment, image restoration, registry dialogs, and mobile focus.
