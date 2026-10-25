# Global search

## Responsibility and structure

This folder owns the shared, URL-driven global search contract and the phase-one fixture adapter.

- `contract.ts`: canonical types, facet vocabularies, defaults, and the enabled public destination types.
- `query.ts`: defensive parsing, canonical URL serialization, API parameter construction, and locale-relative links.
- `fixture.ts`: public-visible fixture filtering and the response shape shared with the API adapter.
- `result.ts`: maps entity results to destinations that exist in the public site.
- `api.ts`: server-only data-source selection, API response validation, error/rate-limit outcomes, and the API adapter. Fixtures remain the default.

## Boundaries and usage

The route owns localized label lookup; archive components own presentation. This folder has no React. `api.ts` is the only module that uses the authenticated server transport. The fixture adapter uses the public archive fixture and deliberately excludes restricted, erased, and tombstoned rows; sealed rows have no searchable excerpt.

## Verification

From `client/`, run `bun run test -- tests/search-query.test.ts tests/search-fixture.test.ts tests/search-result.test.ts` and `bun run typecheck`.

Warning exclusions use repeated `excludeWarnTag` parameters and `excludedWarningTags` state. Exclusion wins over inclusion for conflicting URLs; any excluded tag removes a result, while included tags retain OR semantics. Pagination and removable chips preserve exclusions.
