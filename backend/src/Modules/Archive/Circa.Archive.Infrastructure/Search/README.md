# Archive search

## Responsibility

Implements the global archive read model and anonymous `GET /api/v1/search`.
The client defaults to fixtures and exercises real destination pages in API integration.

## Structure

- `SearchEndpoints.cs`: HTTP binding, ProblemDetails, private cache headers,
  pagination links, and query-hash logging.
- `SearchReader.cs`: executes one snapshot-consistent SQL statement, maps safe
  excerpts/highlights, and returns the application response contract.
- `SearchSqlBuilder.cs`: parameterized five-entity UNION, visibility, relevance,
  registry-driven relationship/author/tag/custody filters, keyset cursors, exact totals,
  and common-filtered facet aggregation.
- `SearchRateLimiting.cs`: process-local guest IP and authenticated-user budgets,
  60/120 requests per minute by default; configure `Search:PermitLimit` and
  `Search:AuthenticatedPermitLimit` to change them. Rejections include `Retry-After`.

## Boundaries and decisions

Application owns vocabulary, validation, code interpretation, and plain-text
helpers. Persistence owns DDL. The search reader is read-only; the destination service adds only sealed-record access requests.
The host supplies a viewer resolver using Auth's live-session requirement, keeping
archive code independent of Auth implementations. Invalid/revoked sessions become
guests on this public route. Roles and authorship never bypass sealed access.

Restricted, erased, and tombstoned rows are excluded before matching and counting.
Records whose parent incident is hidden are also omitted, avoiding parent-title
and code disclosure. Sealed incidents always use title-only text. Sealed records
use title-only text unless a matching approved access request has `decided_at`.
Bodies and body-derived vectors never enter a redacted result or ranking branch.

Holder matching is literal case-insensitive prefix matching against printed codes,
with no organization/affiliation/custody lookup. `mention` searches authored display text
in normalized `org_mentions`; `org` resolves those rows to organization codes/names.
`character` uses public character/recovery
relationships; `tag` reads `record_tags`; `custody` applies only to recoveries. `author`
matches public display names only, never usernames, email addresses, or account IDs.
Included warning tags use OR; excluded tags override inclusion.
Organization `code` stays canonical; `displayCode` preserves a stored legacy alias.

English uses FTS and trigram matching; Korean uses trigram matching. The transaction
sets a 3-second PostgreSQL statement timeout and 0.2 similarity threshold locally,
so pooled connections retain no search-specific settings. Snippets are bounded
plain text; highlight offsets use UTF-16. Date bounds use UTC filing days.

Facet counts include visible rows matching text, holder, and date filters, ignoring
selected facet groups. Warning tags are capped at 20 by count, ordered by token.
Totals remain correct beyond the last page. Cursor links use the selected sort's stable
keyset and carry one previous boundary in bounded Brotli-compressed tokens; legacy offset links stop at page 100.

Requests are bounded to 4 KiB; known scalar duplicates and invalid values return 400. Search returns `Cache-Control: private, no-store` and `Vary: Cookie`, including
429, 500, and 503 responses. Unexpected failures return generic ProblemDetails
without internal diagnostics. Logs contain a query hash, selected facet keys, count, latency,
and guest/reader kind. Keep HTTP request logging at Warning to avoid logging URLs.
The limiter is process-local; multiple instances require a gateway/shared limit.

## Usage and verification

Register with `AddArchiveModule`; call `MapSearchEndpoints` with the host's viewer
resolver. Apply the [additive schema upgrade](../Persistence/README.md) first.

```sh
dotnet test backend/tests/Circa.Modules.Archive.Tests
dotnet test backend/tests/Circa.Api.IntegrationTests --filter FullyQualifiedName~SearchEndpointTests
```

Reader and endpoint tests use disposable PostgreSQL 16 containers. The 10,000-row
benchmark measures seven representative queries after warmup and enforces a
750 ms p95 regression ceiling; the development target remains 250 ms.

### Measured development baseline

On 2026-10-25, the 10,010-visible-document fixture measured p95 over ten requests
per query after warmup: exact code 139 ms, English body 173 ms, Korean body 190 ms,
sealed-only 148 ms, combined filters 42 ms, page 1 140 ms, and page 50 183 ms.
These are local-container observations, not a production latency guarantee.

For a constrained machine, run search tests with `DOTNET_PROCESSOR_COUNT=2`,
`-m:1`, and a `FullyQualifiedName~Search` filter per test project. Run the archive
project and endpoint class sequentially. The full solution suite is not needed
for iterating on this read model.

The full .NET solution suite was omitted from local acceptance at the user’s
request because this machine cannot handle its resource usage. Focused search
tests and endpoint tests remain required; CI checks are unchanged.

## Search destinations (phase 3)

`ArchiveDestinationReader.cs` reads incident/record/organization bodies in a
repeatable-read snapshot. `ArchiveDestinationEndpoints.cs` exposes anonymous
`GET /api/v1/archive/{code}` and authenticated
`POST /api/v1/archive/{code}/access-requests`. The host supplies the live-session
resolver and write policy. Both use the search limiter and private/no-store headers.
Hidden entries and records with hidden parents return 404 for every viewer.

A sealed incident returns metadata until `acknowledge=true`; this is a deliberate
reading acknowledgment, never an approval or a search visibility change. A sealed
record returns its body only for a dated approval belonging to the live viewer.
The response contains `id`, `type`, `code`, `title`, nullable `markdown`, `access`,
nullable `requestStatus`, and visible `rumours` with stable `rumour-{number}` anchors.
Organization reads accept canonical and stored legacy codes. Character and active
recovery reads share the endpoint; erased characters and inactive recoveries return 404.

Access requests are pending on creation. A transaction-scoped PostgreSQL advisory
lock serializes duplicate requests per viewer/filing. Existing decisions are returned
without granting or rewriting them. Sealed rumours use `rumour-{number}` as the
request route key. Approval administration remains outside this phase; only the
existing stored approved/dated decision grants access. No schema change is needed.

Run focused tests with `DOTNET_PROCESSOR_COUNT=2 dotnet test
backend/tests/Circa.Modules.Archive.Tests --filter FullyQualifiedName~ArchiveDestination -m:1`
and the equivalent command for `Circa.Api.IntegrationTests`.

## Input security

All search text, holder/relationship filters, dates, cursor boundaries, and viewer
IDs are Npgsql parameters. Sort orders and SQL identifiers come from fixed code
mappings; free text is never concatenated into SQL. LIKE metacharacters are escaped
for literal matching, separately from parameter binding. The only raw schema SQL
comes from the repository-owned initialization script, never a request.
`SearchReaderTests.TreatsSqlInjectionPayloadsAsDataInEveryTextFilter` exercises SQL
payloads through each text filter against disposable PostgreSQL, checking that
visibility and stored data remain intact. Validation rejects control characters.
