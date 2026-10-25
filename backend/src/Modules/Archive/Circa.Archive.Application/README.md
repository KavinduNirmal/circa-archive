# Circa.Archive.Application

## Responsibility

Owns transport-independent archive search contracts, validation, display vocabulary,
archive code parsing, and plain-text snippet/highlight helpers.

## Structure

- `SearchRequest.cs`: normalized request, validation outcome, and query validator.
- `SearchResponse.cs`: five-entity response, facets, applied filters, and metadata.
- `SearchCode.cs`: canonical/legacy display code parsing and reserved ranges.
- `SearchVocabulary.cs`: exact English/Korean labels and canonical tokens.
- `SearchText.cs`: bounded plain-text excerpts and UTF-16 highlight offsets.
- `Circa.Archive.Application.csproj`: dependency-free .NET application project.

## Boundaries

Accepts decoded query values as a dictionary of arrays, preserving repeated keys.
It trims input, validates canonical tokens, orders and deduplicates facet values,
and accepts comma-separated facet values. Distinct facets will combine with AND
in the reader; values within a facet combine with OR. Excluded warning tags take
precedence over included tags, matching the existing client contract.

`language` overrides the legacy `lang` alias; English remains the default.
Scalar duplicates are rejected. Invalid requests return field errors and no
executable request. Visibility, SQL, HTTP binding, total URL length enforcement,
and ProblemDetails translation belong to infrastructure. Unknown keys are
ignored for forward compatibility and never become SQL fragments.

## Usage and verification

Call `SearchRequestValidator.Parse` with decoded query parameters. Only pass a
non-null `Request` to a reader; expose `Errors` as validation errors otherwise.

```sh
dotnet test backend/tests/Circa.Modules.Archive.Tests --filter FullyQualifiedName~SearchRequestTests
```

These tests need no database. Persistence tests in the same suite require Docker.
