# Architecture and security

- Use product context for direction and `ARCHITECTURE.md` for draft technical contracts. Identify conflicts and update affected documents when decisions change.
- Organize code around cohesive domain responsibilities. Separate transport/UI, business behavior, and persistence; avoid layers without a concrete purpose.
- Store stable IDs and display archive codes. Preserve author credit, lineage, and visibility rules. Fictional organizations are entities, not login accounts.
- Render fictional `.pdf` records from Markdown as specified; do not add PDF generation solely for filenames.
- Validate inputs at boundaries and authorize server-side. Authentication alone does not grant record, dossier, or moderation permissions.
- Handle concurrent votes and state transitions using constraints and appropriate transactions. Test uniqueness, forbidden transitions, and failure paths.
- Sanitize untrusted rendered content, constrain uploads, and prevent private records or secrets leaking through logs, search, errors, or real-time events.
- Document schema changes, migration commands, compatibility, and recovery. Obtain explicit approval for destructive migrations.
- Follow `SECURITY.md` for vulnerability handling and preserve required third-party licensing notices.
