# Contributing to CIRCA Archive

Contributions to specifications, documentation, design, and future application code are welcome. Follow our [code of conduct](CODE_OF_CONDUCT.md).

## Before starting

1. Read [README.md](README.md), [AGENTS.md](AGENTS.md), and the relevant design documents.
2. Search existing issues and pull requests for related work.
3. Open a proposal before making substantial architecture, dependency, or story-mechanic changes. Small corrections can go straight to a PR.

The project is in pre-production. The product context defines direction, while `ARCHITECTURE.md` is a draft. Call out inconsistencies and explain your proposed resolution.

## Local workflow

Fork the repository, clone your fork, and create a focused branch such as `docs/record-lifecycle` or `feat/record-editor`. Make one coherent change per PR. Do not commit local environment files, credentials, generated output, or unrelated editor settings.

Use Bun 1.3.14 for frontend packages and root tooling. Run `bun install --frozen-lockfile`, then `bun run prepare` to initialize Husky. Run `bun run check` and `bun run test`; `bun run precommit` reproduces staged checks. Commit `bun.lock` and avoid competing frontend lockfiles.

Install frontend dependencies separately in `client/` with `bun install --frozen-lockfile`. See its README for Next.js development/build commands, Vitest tests, and optional Playwright smoke tests. Root `bun run check:client` runs frontend lint, typecheck, and unit tests. Use `.env.example` for placeholders only.

Follow `.editorconfig`, [AGENTS.md](AGENTS.md), and [agent rules](.agents/rules/README.md). Every authored folder needs `README.md` describing responsibilities, structure, boundaries, and usage; generated directories are excluded. Keep domain names consistent and update specifications with behavior changes.

## Verification

Follow red → green → refactor for new behavior and bug fixes: write and run a failing behavioral test, implement, then refactor with tests passing. For documentation, check links, rendering, examples, and product consistency. For code, run configured formatter, lint, build, and relevant tests. Prioritize authorization, voting, lifecycle transitions, and visibility rules.

The hook validates staged folder READMEs, then runs root tooling tests and frontend lint/typecheck/unit tests. Unstaged READMEs do not count. Frontend checks run against the working tree; review partially staged changes carefully. Extend checks with future behavior and fix failures rather than bypassing hooks.

No coverage percentage is mandated. Report exactly what you verified and which checks could not run. Do not claim successful tests when no runner exists.

## Commits and pull requests

Use concise imperative commit messages, for example `Document organization appeals`. There is no required prefix or established Git history convention.

Complete the PR template: explain the problem, resulting behavior, related issue or specification, and verification. Include screenshots for interface changes and migration or configuration notes when applicable. Draft PRs are welcome for early feedback. Maintainers review scope, compatibility, and verification before merging; address feedback in the same PR.

## Licensing and reports

Submit only work you have permission to contribute under [MIT](LICENSE). Identify third-party material and retain required notices. Do not copy reference fiction, artwork, or assets without permission. No contributor license agreement is currently required.

Report vulnerabilities according to [SECURITY.md](SECURITY.md), rather than in a public issue. General questions may use a blank issue with clear context.
