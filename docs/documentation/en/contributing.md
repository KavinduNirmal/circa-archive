# Contributing

One coherent change, the checks that prove it, and a pull request that says what you verified.

## Before you start

Read README.md, AGENTS.md, and the documents the change touches. Search issues and pull requests first. Open a proposal for architecture, dependencies, or story mechanics; small corrections can go straight to a pull request.

> [!WARNING]
> The drafts are drafts
>
> ARCHITECTURE.md describes an unbuilt platform; the design and product documents describe intent. If the code and the specification disagree, say so in the issue instead of quietly choosing one.

## One change per branch

Fork, branch, and keep one change per branch. docs/record-lifecycle and feat/record-editor are the example shapes. Do not mix a refactor with a behaviour change.

- Commit the lockfiles; do not add a competing package manager lockfile.
- Do not commit local environment files, credentials, generated output, or editor settings.
- Preserve author credit, stable IDs, and display codes.

Write tests first where the change is behavioural: red, green, refactor. No coverage threshold is mandated, and a test that asserts a key rather than a sentence is worse than no test.

## The checks

Before you open a pull request, run what you changed. The full pass is the hook.

```sh
bun run check
bun run test
bun run check:client
bun run precommit
```

The hook verifies staged READMEs, then runs the root tooling tests and the frontend lint, typecheck, and unit suite. A failure is the check working; fix it rather than bypassing it.

## Documentation is part of the change

Documentation changes with the code. Every authored folder needs a README, every user-facing string needs a key in each language, and a new behaviour needs a test in the project's idiom.

- New copy: add the key to English, translate Korean, then run the catalog test.
- New folder: add README.md and stage it.
- New interface: screenshots in the pull request, at desktop and mobile widths.
- Changed route: update metadata and every link the tests hold.

## Commits and pull requests

Use an imperative commit message: Add record creation endpoint. In the pull request, state the problem, the resulting behaviour, the related issue or specification, and exactly what you verified.

No contributor licence agreement is required. Submit only work you can licence under MIT, and identify third-party material.

> [!NOTE]
> Where to ask
>
> Bugs and proposals go to the issue templates. Security reports go through SECURITY.md, never a public issue.
