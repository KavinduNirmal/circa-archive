# Project documentation

## Responsibility and structure

- [documentation/](documentation/README.md): English and Korean Markdown sources for the website developer manual.
- [GITFLOW.md](GITFLOW.md): branch model, protection rules, release checklist, and hotfix procedure.
- [adr/](adr/README.md): architecture decision records — what was decided, why, and what it costs.
- [OPEN_SOURCE_CHECKLIST.md](OPEN_SOURCE_CHECKLIST.md): verified repository settings and remaining owner actions.
- `auth-sign-in-desktop.png` and `auth-sign-up-mobile-ko.png`: reviewed English desktop and Korean mobile previews of the personal access forms, captured by the auth browser suite with an isolated test API.
- `portal.webp`: preview of the public archive portal used by the root README.
- `workstation.webp`: preview of the CIRCA/OS workstation used by the root README.
- [AUTHOR_GUIDE.md](AUTHOR_GUIDE.md): platform collaboration rules for story authors, protected constraints, character permissions, and continuity adoption; implementation remains pending.
- [lore/](lore/README.md): original fictional setting, archival voice, and linked reference notes for Incidents and their records.

## Boundaries and verification

Keep public contributor references and supporting documents here. Draft technical contracts live in the root [ARCHITECTURE.md](../ARCHITECTURE.md); executable code belongs in the application directories, and each folder documents itself in its own `README.md`. Check relative links and rendering when editing, and run `bun run check` for folder README coverage.
