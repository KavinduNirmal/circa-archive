# Global search

## Responsibility and structure

This folder owns the shared, URL-driven global search contract, fixture adapter, and API transport.

- `contract.ts`: canonical types, the option registry, defaults, and enabled public destination types.
- `query.ts`: defensive parsing, canonical URL serialization, API parameter construction, and locale-relative links.
- `fixture.ts`: public-visible fixture filtering and the response shape shared with the API adapter.
- `saved.ts`: rebuilds untrusted stored destinations as fixed locale index paths and encoded, validated query parameters.
- `result.ts`: maps entity results to destinations that exist in the public site.
- `api.ts`: server-only data-source selection, API response validation, error/rate-limit outcomes, and the API adapter. Fixtures remain the default.

## Boundaries and usage

The route owns localized label lookup; archive components own presentation. `api.ts` is the only module that uses the authenticated server transport. The fixture adapter uses the public archive fixture and deliberately excludes restricted, erased, and tombstoned rows; sealed rows have no searchable excerpt. `SEARCH_FILTER_REGISTRY` declares Phase 4 text/select controls and provides their form generation metadata.

## Verification

From `client/`, run `bun run test -- tests/search-query.test.ts tests/search-fixture.test.ts tests/search-result.test.ts` and `bun run typecheck`.

Warning exclusions use repeated `excludeWarnTag` parameters and `excludedWarningTags` state. Exclusion wins over inclusion for conflicting URLs; any excluded tag removes a result, while included tags retain OR semantics. Pagination and removable chips preserve exclusions.

## Backend contract alignment

The stage 2 API can return null warning tier/disclosure for dossier entities and
full sealed records to explicitly approved readers. `api.ts` accepts those shapes
while rejecting unredacted sealed incidents and excerpts on redacted rows.
`tests/search-api.test.ts` covers this boundary. `SEARCH_SOURCE` defaults to
fixtures; phase 3 exercises API-backed destinations in integration.

`destination.ts` is the server-only destination adapter. It validates nested body
responses, rejects unacknowledged incident bodies, forwards session cookies through
`sessionFetch`, disables caching, and distinguishes missing entries from outages.
The record and organizations routes select this path with `SEARCH_SOURCE=api`.
Registered filters include raw linked mention text separately from resolved organization.
Character and recovery results now have API-backed public destination routes. Cursor
pagination uses opaque, validated sort-bound tokens; saved searches are local named URLs
in browser storage. Typeahead is debounced and leaves the committed query unchanged until
submission.
Test with `tests/search-destination.test.ts` and `test:e2e:search`.

The parser drops reversed date ranges and trims oversized encoded query strings to
leave room for the API's 4 KiB request limit. It reports retired/invalid recognized
filters to the route. Vocabulary matching follows `language`, independently of
route labels. Fixture relationships use explicit optional public search metadata.
Saved searches always target the locale's index and remain usable in memory if
browser storage is blocked; suggestions follow the current language control.

Saved search names render as React text; their destinations are reconstructed at
the link boundary. External origins, credentials, executable schemes, unexpected
paths, and unknown query keys never become saved link destinations. Coverage is
in `search-saved.test.ts`, `search-expansion.test.tsx`, and the browser search suite.
