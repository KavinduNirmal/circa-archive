# Test-driven development

- For new executable behavior and bug fixes, use **red → green → refactor** in small increments.
- Write a focused behavioral test first. Run it and confirm it fails for the expected missing behavior. Resolve setup/import failures before treating the result as a valid red phase.
- Implement the smallest coherent change that passes, then refactor while tests stay green.
- For bugs, reproduce the defect with a regression test before fixing it. Never weaken assertions or delete failing tests to hide a defect.
- Test observable contracts and meaningful edge cases, especially authorization, voting, lifecycle transitions, and record visibility. Mock external boundaries where appropriate; verify persistence and APIs with integration tests.
- Use the module's documented runner. Root `bun run test` covers repository tooling only. Establish a runner before adding the first executable application behavior.
- Documentation edits require link and consistency checks, not artificial unit tests. Where no automated seam exists, explain the limitation and provide reproducible manual verification.
- Report failing and passing checks accurately, including checks not run. Never claim unexecuted tests passed.
