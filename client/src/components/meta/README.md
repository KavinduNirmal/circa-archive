# Project page

## Responsibility and structure

The one page outside the fiction. It explains the project, what is invented, the
two editions, how the archive is built, what is not collected, and its
accessibility. `meta-about.tsx` renders it and `meta.css` sets it apart from the
archive: the same steel and paper, no fiction chrome, one measured column.

## Boundaries

This folder owns the only copy that is allowed to say the Commission is not real.
The archive never points at it except through the labelled "About the site"
button, and nothing in the archive's fiction links here by accident. Copy lives
in the `meta` namespace; the page is rendered on the server and carries only the
language switcher as a client component.

## Usage and verification

Served at `/[lang]/meta/about`. `tests/archive-site.test.tsx` checks its
headings, the out-of-fiction notice, and the links back into the archive,
public portal, and workstation. Run `bun run --cwd=client test`, `lint`,
`typecheck`, and `build`.
