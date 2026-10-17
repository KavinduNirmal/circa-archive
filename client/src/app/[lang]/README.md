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
- `desktop/`: the workstation route and its [design decisions](desktop/README.md).

## Boundaries

This folder composes; it does not hold copy or layout. The portal itself is in
`../../components/site/`, the workstation in `../../components/`, and every
translated string in `../../../../messages/`.

The segment is named `lang` rather than `locale` because that is the name the
product asked for. next-intl does not care: it resolves the locale from the
pathname prefix through the proxy, not by looking for a particular segment name.

Bare paths are not routes here. `/` and `/desktop` have no page; `src/proxy.ts`
redirects them to the reader's language, which is why each document answers at
exactly one address.

## Usage and verification

`generateStaticParams` builds both languages ahead of time, and `setRequestLocale`
tells next-intl which one a build is for. Both routes therefore prerender — check
`bun run build` and read the route table it prints for `/en`, `/ko`, `/en/desktop`,
and `/ko/desktop`.

To see the resolution rules rather than the pages, run `bun run test` and read
`tests/i18n-routing.test.ts`, which drives the proxy directly: an explicit prefix
wins, then the `NEXT_LOCALE` cookie, then `Accept-Language`, then English.
