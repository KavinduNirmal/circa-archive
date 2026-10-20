# Language segment

## Responsibility

The document shell for one language, and the routes that live under it. Every page
in the app is under this segment, so `app/[lang]/layout.tsx` is the root layout:
it renders `<html lang>`, `<body>`, the fonts, and the message provider.

## Structure

- `layout.tsx`: resolves the segment to a supported locale, sets `lang` on the
  document, publishes the locale's metadata, and mounts `NextIntlClientProvider`
  with only the namespaces client components read. An unknown segment is a 404
  rather than a silent English page.
- `page.tsx`: the public landing page, with the locale's title, description, and
  `openGraph.locale`.
- `(workspace)/`: the persistent workstation route group. Its layout owns the
  shell, the post screen, and the store provider, so an in-workspace navigation
  does not remount them; the route group itself never appears in an address. See
  its [README](<(workspace)/README.md>) and the workstation's
  [design decisions](<(workspace)/desktop/README.md>).
- `sign-in/`, `sign-up/`, and `account/`: localized personal access routes with non-indexable metadata; shared UI lives in `components/auth/`.
- `site/`: the public archive as a full-page website — index, record pages,
  search, organizations, guide, and a random door. See its [README](site/README.md).
- `meta/`: the project layer outside the fiction — the landing report, the
  dossier at `meta/about`, and the documentation at `meta/documentation`. See its
  [README](meta/README.md).

## Boundaries

This folder composes; it does not hold copy or layout. The portal itself is in
`../../components/site/`, the workstation in `../../components/`, and every
translated string in `../../../../messages/`.

The archive is server-rendered and needs no client JavaScript to read; its
search is a GET form on the index, and its download links are route handlers
serving the authored Markdown. The `/meta` routes are the only part of the app that speaks outside the fiction.

The segment is named `lang` rather than `locale` because that is the name the
product asked for. next-intl does not care: it resolves the locale from the
pathname prefix through the proxy, not by looking for a particular segment name.

Bare paths are not routes here. `/` and `/desktop` have no page; `src/proxy.ts`
redirects them to the reader's language, which is why each document answers at
exactly one address.

## Usage and verification

`generateStaticParams` builds both languages ahead of time, and `setRequestLocale`
tells next-intl which one a build is for. The portal and archive resolve request cookies for their access controls and therefore render per request. The workstation remains independent of personal access. Check `bun run build` for the current route table.

To see the resolution rules rather than the pages, run `bun run test` and read
`tests/i18n-routing.test.ts`, which drives the proxy directly: an explicit prefix
wins, then the `NEXT_LOCALE` cookie, then `Accept-Language`, then English.

The root layout also mounts the shared necessary-cookie notice after page content in DOM order, keeping page skip navigation first. Its banner reserves space through the document CSS and workstation canvas. Acknowledgement uses a separate non-authentication cookie.

Font faces are declared locally in the root layout. The public record reader
uses Zilla Slab's Latin regular/bold faces and their italics; only elements
naming that family download its files. Interface typography stays independent.
