# Internationalization

## Responsibility

Owns how a request becomes one language's page. Everything that names a language,
a locale prefix, or a message catalog lives here, so no component has to know
which languages exist.

## Structure

- `routing.ts`: `defineRouting` for the supported locales, the default, and the
  `localePrefix` policy. It is the only file that lists languages, so adding one
  is a change here plus a catalog in `../../messages/`.
- `request.ts`: the request configuration. It resolves the locale for a render and
  imports that locale's catalog. This is the module next-intl's `next-intl/config`
  alias points at, wired in `../../next.config.ts`.
- `navigation.ts`: the locale-aware `Link`, `redirect`, `usePathname`, and
  `useRouter`. Components import `Link` from here rather than from `next/link`,
  because a raw link drops the language prefix and sends the reader through a
  redirect.

## Boundaries

Locale detection itself is not here: it is the request-time `proxy.ts` at the
client root, which is the only place a request is inspected before rendering.
This folder holds what is shared after that decision — the locale list, the
catalog loading, and the navigation helpers.

Catalog content is not here either; the translated strings live in
`../../messages/`, and this folder only decides which one to load. A component
never imports a catalog directly.

## Usage

Read copy in a component with `useTranslations` from `next-intl`, naming the
namespace rather than a whole key path. Code that is not a component — the post
screen's line builder, for instance — takes a translator as an argument so it can
be called with any language.

To add a language: append it to `locales` in `routing.ts`, add
`../../messages/<locale>.json` with the same keys, and run `bun run test`. Two
tests hold the contract: the routing test checks what the proxy resolves, and the
message test fails on a missing key, a dropped `{placeholder}`, or an unbalanced
`<strong>` tag.
