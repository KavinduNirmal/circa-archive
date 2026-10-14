# Security Policy

## Supported versions

CIRCA Archive is in pre-production and has no released or deployed application. There are no supported release lines yet. Security fixes will target the current development branch until a release support policy is published.

## Reporting a vulnerability

Do not disclose vulnerabilities, credentials, or exploit details in public issues or pull requests.

On GitHub, use **Security → Report a vulnerability** when private vulnerability reporting is enabled. If that option is unavailable, use a private security contact explicitly published by the repository owner. If neither exists, ask the owner to enable private reporting without disclosing the vulnerability publicly.

Include the affected revision, affected component, reproduction steps, expected impact, and a suggested fix if available. Use synthetic data and redact secrets. Coordinate public disclosure with the maintainer after remediation. No response deadline or bounty is currently offered.

## Contributor practices

- Keep real configuration in ignored local environment files.
- Put only placeholder values and variable descriptions in `.env.example`.
- Never commit database passwords, JWT signing secrets, storage keys, or production data.
- If a credential is exposed, revoke or rotate it promptly; removing the file alone is insufficient.
- When application code is added, verify authorization and validate untrusted Markdown, uploads, and API input.

The repository owner must enable a private reporting route before publishing. See the [publishing checklist](docs/OPEN_SOURCE_CHECKLIST.md).
