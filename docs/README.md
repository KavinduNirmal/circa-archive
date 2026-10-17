# Project documentation

## Responsibility and structure

- [GITFLOW.md](GITFLOW.md): branch model, protection rules, release checklist, and hotfix procedure.
- [OPEN_SOURCE_CHECKLIST.md](OPEN_SOURCE_CHECKLIST.md): verified repository settings and remaining owner actions.
- `portal.webp`: preview of the public archive portal used by the root README.
- `workstation.webp`: preview of the CIRCA/OS workstation used by the root README.
- `lore/`: reserved for original fictional setting documentation.

## Boundaries and verification

Keep public contributor references and supporting documents here. Draft technical contracts live in the root [ARCHITECTURE.md](../ARCHITECTURE.md); executable code belongs in the application directories, and each folder documents itself in its own `README.md`. Check relative links and rendering when editing, and run `bun run check` for folder README coverage.
