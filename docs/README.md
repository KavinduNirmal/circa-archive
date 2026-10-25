# Project documentation

## Responsibility and structure

- [documentation/](documentation/README.md): English and Korean Markdown sources for the website developer manual.
- [GITFLOW.md](GITFLOW.md): branch model, protection rules, release checklist, and hotfix procedure.
- [adr/](adr/README.md): architecture decision records — what was decided, why, and what it costs.
- [OPEN_SOURCE_CHECKLIST.md](OPEN_SOURCE_CHECKLIST.md): verified repository settings and remaining owner actions.
- `auth-sign-in-desktop.png` and `auth-sign-up-mobile-ko.png`: reviewed English desktop and Korean mobile previews of the personal access forms, captured by the auth browser suite with an isolated test API.
- `reader-slab-desktop.png` and `reader-slab-mobile.png`: reviewed public record reader at 1440px and 390px, showing locally bundled Zilla Slab and unnumbered section headings.
- `reader-table-desktop.png`: Markdown table typography keeps Courier New values and DM Sans headers alongside the slab-serif prose.
- `desktop-cookie-mobile.png`: desktop shortcut rail, taskbar, and cookie notice occupy separate usable space at 390px; the rail scrolls to reach all applications.
- `portal.webp`: preview of the public archive portal used by the root README.
- `workstation.webp`: preview of the CIRCA/OS workstation used by the root README.
- [AUTHOR_GUIDE.md](AUTHOR_GUIDE.md): platform collaboration rules for story authors, including the filing taxonomy, typed wikilinks and the entity registry, protected constraints, character permissions, content warnings, revisions, assessment, the public regulations, and CC BY-NC-SA 4.0 licensing; implementation remains pending.
- [lore/](lore/README.md): original fictional setting, archival voice, and linked reference notes for Incidents and their records.

## Boundaries and verification

Keep public contributor references and supporting documents here. Draft technical contracts live in the root [ARCHITECTURE.md](../ARCHITECTURE.md); executable code belongs in the application directories, and each folder documents itself in its own `README.md`. Check relative links and rendering when editing, and run `bun run check` for folder README coverage.
