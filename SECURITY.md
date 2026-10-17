# Security Policy

## Supported versions

CIRCA Archive is in pre-release development and has no supported release line yet. Security fixes target `develop`. Once releases exist, the latest tagged release on `main` will receive fixes; older releases will be supported only when a release policy says so.

## Reporting a vulnerability

Do not disclose vulnerabilities, credentials, or exploit details in public issues, pull requests, or discussions.

Use GitHub's private vulnerability reporting:

1. Open the repository's **Security** tab.
2. Choose **Report a vulnerability**.
3. Describe the affected revision and component, reproduction steps, expected impact, and any suggested fix.

The private advisory form is available at <https://github.com/KavinduNirmal/circa-archive/security/advisories/new>. Reports are visible only to the maintainers until a coordinated disclosure.

Use synthetic data and redact secrets. If a credential is exposed, revoke or rotate it immediately; deleting the file or commit is not sufficient. Coordinate public disclosure with the maintainer after remediation. No response deadline or bounty is currently offered.

## Contributor practices

- Keep real configuration in ignored local environment files.
- Put only placeholder values and variable descriptions in `.env.example`.
- Never commit database passwords, signing secrets, storage keys, or production data.
- Validate untrusted Markdown, uploads, and API input when application services are added.
- Authorize server-side; authentication alone does not grant record, dossier, or moderation permissions.
- Keep private records and secrets out of logs, search results, errors, and real-time events.
- Report suspected vulnerabilities privately instead of opening an issue.

## Repository protections

The public repository enables secret scanning, push protection, Dependabot alerts, CodeQL analysis, dependency review on pull requests, and protected `main` and `develop` branches. Branch protection requires passing status checks and a pull request before merging. Dependency updates for Bun are handled by Dependabot version updates; Bun is not currently covered by Dependabot security updates, so advisories are reviewed manually.
