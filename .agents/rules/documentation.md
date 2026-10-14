# Code as documentation

## Readable code

Use precise domain names, cohesive functions, explicit contracts, and clear dependency boundaries. Comment reasons, constraints, and tradeoffs rather than narrating obvious syntax. Document public contracts and non-obvious side effects; keep examples consistent with code.

## Every authored folder needs a README

Every repository-owned folder must contain an exact `README.md`, including hidden authored directories, tests, scripts, and new modules. Update it alongside changes to responsibilities. Exclude generated, dependency, ignored, and Git metadata folders, including `.husky/_/`, `node_modules/`, `.next/`, `bin/`, and `obj/`.

Follow the CustomerConcierge reference pattern: responsibility, annotated structure, and explicit include/exclude ownership boundaries. Do not copy its unrelated customer domain or impose its layers on CIRCA.

Each README explains:

1. **Responsibility:** what this folder owns and why it exists.
2. **Structure:** important files and subfolders with short descriptions.
3. **Boundaries:** what belongs here and what belongs elsewhere.
4. **Usage and verification:** actual commands, dependencies, and data flow where relevant.

For placeholder folders, state that they are unimplemented and link their design context. Avoid invented commands, duplicate specifications, and exhaustive lists that quickly become stale. Use relative documentation links.

Run `bun run check` for coverage. The hook checks the Git index: stage README additions alongside their source files. A README existing only in the working tree does not satisfy the next commit.
