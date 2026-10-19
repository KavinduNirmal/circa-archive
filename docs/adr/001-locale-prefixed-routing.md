# 001: Every page carries its language in the path

- **Status:** Accepted
- **Date:** 2026-10-18
- **Deciders:** Maintainers
- **Supersedes:** —
- **Superseded by:** —

## Context

The archive ships in English and Korean, and the interface is split in two: chrome is translated, filed content is not. A reader who chooses Korean must keep that choice across pages, and the public archive must be indexable and shareable, so one document must not answer at two addresses. The workstation has the same requirement through its own URLs.

The repository already routes on this basis: [`client/src/i18n/routing.ts`](../../client/src/i18n/routing.ts) lists `en` and `ko`, sets `localePrefix: "always"`, and is the only file that names a language. [`client/src/proxy.ts`](../../client/src/proxy.ts) resolves a bare path and redirects it.

## Decision

Every page lives under a language segment, and the segment is always present.

- The locale prefix is required; `localePrefix` is `"always"`, so no page answers at both `/{lang}/...` and `/...`.
- A bare path is redirected by the request-time proxy. Resolution order is explicit path prefix, then the `NEXT_LOCALE` cookie, then the browser's `Accept-Language` weighting, then English. There is no geolocation: an IP describes a connection, not a reader.
- The language switcher writes the cookie and links to the same page in the other language, never to the site root.
- Interface chrome is translated. Filed content — record text, archive index, mail fixture, file tree — stays in the language it was filed in. Brand names and identifiers (`CIRCA`, archive codes, dates, version strings) are never translated.
- Adding a language means editing `routing.ts` and adding a catalog directory under `client/messages/`; no component may name a language.

## Consequences

**Positive.** Every document has exactly one address, so canonical links, search indexing, and sharing are unambiguous. The cookie makes an explicit language choice survive navigation. The chrome/content split keeps the fiction coherent: an archive does not translate a document that was filed in English.

**Negative.** Every internal link must carry the locale, which is why navigation goes through the locale-aware helpers rather than raw `next/link` paths. A bare path costs a redirect. Korean readers see English record text by design, and contributing a record in Korean is not the same thing as translating the interface.

**Follow-ups.** A Korean webfont is not bundled, so Hangul falls back to the reader's own face; whether to bundle one remains open. Uppercase and letter-spacing conventions were designed for Latin text and still need a Korean decision. The archive's internal search still matches English class and status words, which is recorded as a known gap in [`client/README.md`](../../client/README.md).

## Alternatives considered

- **Cookie-only locale, no path prefix.** Simpler links, but one document answers at one address for everyone, which makes caching, canonical URLs, and sharing ambiguous, and removes the locale from the URL a reader can copy.
- **`localePrefix: "as-needed"`.** The default language would answer at bare paths and other languages at prefixed ones, producing two addresses for the same document and a canonical-tag problem the current scheme avoids.
- **Per-language domains.** More operational surface (certificates, redirects, analytics) for a two-language archive, and it splits the archive's identity.
- **Translate the corpus per language.** Rejected on product grounds: the fiction is that filed documents are the archive's artifacts, not localized UI.

## References

- [`client/src/i18n/routing.ts`](../../client/src/i18n/routing.ts) — the locale list and the always-prefix rule.
- [`client/src/proxy.ts`](../../client/src/proxy.ts) — the redirect and the Next.js 16 `middleware` → `proxy` rename.
- [`client/README.md`](../../client/README.md) — the localization boundary and known gaps.
- [`ARCHITECTURE.md`](../../ARCHITECTURE.md) §5.11 — routing, detection, override, and the chrome/content boundary.
- [`client/tests/i18n-routing.test.ts`](../../client/tests/i18n-routing.test.ts) — the route contract as tests.
