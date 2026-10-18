# Workspace route group

## Responsibility

The CIRCA/OS workstation, mounted once for every desktop URL. This is a route
group, so `(workspace)` never appears in an address: `/{lang}/desktop`,
`/{lang}/desktop/{destination}`, and `/{lang}/desktop/record/{code}` all render
through this layout.

## Structure

- `layout.tsx`: the persistent shell — `WorkstationStoreProvider`, the
  `WorkstationBoot` post screen, and `DesktopShell` — plus the workstation's
  metadata and its `noindex, nofollow` policy.
- `desktop/`: the workstation route and its [design decisions](desktop/README.md),
  including the pages that mark a deep-link URL and return `null`.

## Boundaries

The shell lives here rather than in a page because a page unmounts on navigation:
putting it in the layout is what keeps open windows and the reader's trail across
an in-workspace route change, and what stops the post screen replaying on every
deep link. `DesktopUrlSync` joins the layout when URL synchronisation lands.

The pages under this group are URL markers only. They exist to match a path, to
hold `generateStaticParams` and the `notFound()` guard, and to prerender both
languages. The layout deliberately does not render their `children`, because no
server-rendered document belongs inside a window; the public
`/{lang}/site/records/[code]` edition is the canonical reading surface.

This group is not the public site and holds no copy. Every sentence a reader sees
comes from `client/messages/<locale>/`.

## Usage and verification

`/{lang}/desktop` boots the workstation with nothing focused; the nested routes
select a destination or a record. Run `bun run test` for the shell and store
suites, `bun run build` to confirm the desktop routes appear in the table for
both languages, and `bun run test:e2e` for the browser behaviour.
