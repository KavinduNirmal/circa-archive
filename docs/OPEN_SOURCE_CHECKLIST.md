# Open-source publishing checklist

Repository documents and templates are prepared locally. Complete these owner-managed steps before opening the project to contributors.

## Before publishing

- [ ] Review all files for secrets, private notes, personal information, and third-party material, including `.agents/brain/` and any existing Git history.
- [ ] Confirm the copyright notice in `LICENSE` represents the project's rights holders.
- [ ] Ensure `.env.example` contains placeholders only and local credentials remain ignored.
- [ ] Create or select the public GitHub repository and configure its remote.
- [ ] Publish a private maintainer contact for code-of-conduct reports.
- [ ] Enable GitHub private vulnerability reporting under repository security settings, or publish a private security contact in `SECURITY.md`.

## GitHub settings

- [ ] Enable issues and confirm that the bug, feature, and documentation forms appear.
- [ ] Confirm the pull request template appears for new PRs.
- [ ] Protect the default branch against force pushes and deletion; require PR review when reviewer availability permits.
- [ ] Enable secret scanning and push protection where available.
- [ ] Add a repository description and relevant topics; avoid badges claiming checks that do not exist.

## When application scaffolding lands

- [ ] Document runtime versions, installation, environment variables, and build/test commands.
- [ ] Add CI for the actual configured formatting, lint, build, and test tools; require those checks before merging.
- [ ] Configure dependency updates for manifests that exist.
- [ ] Review third-party dependency and asset licenses and retain required notices.
- [ ] Define release support, changelog/versioning practices, and the policy for hosted user content.
