# Routes and editions

Every document answers at one address, in one language, on one of three surfaces.

## Route map

The routes below are the public surface the tree serves today. Every one of them is under a language segment.

| Route                                      | Renders                                                              |
| ------------------------------------------ | -------------------------------------------------------------------- |
| `/[lang]`                                  | the public portal, in the Commission's voice.                        |
| `/[lang]/site`                             | the reading edition's front page.                                    |
| `/[lang]/site/about`                       | the reading guide, class key, and edition counts.                    |
| `/[lang]/site/records`                     | the record index; search and filters are read on the server.         |
| `/[lang]/site/records/incidents`           | the incident class index.                                            |
| `/[lang]/site/records/explorations`        | the exploration class index.                                         |
| `/[lang]/site/records/evidence`            | the evidence class index.                                            |
| `/[lang]/site/records/rumours`             | the reserved rumour index, pending a real `class=rumour` query.      |
| `/[lang]/site/records/playlists`           | the reserved playlist index, pending the v1 playlist routes.         |
| `/[lang]/site/records/[code]`              | one record or incident, from the fixture index or the API.           |
| `/[lang]/site/records/[code]/download`     | Markdown and plain-text copies; 404 when the filing is held.         |
| `/[lang]/site/records/[code]/explorations` | the exploration list filed against one record.                       |
| `/[lang]/site/organizations`               | the organizations directory (fixture by default, API with the flag). |
| `/[lang]/site/characters`                  | the reserved character directory.                                    |
| `/[lang]/site/characters/[code]`           | an API-backed character dossier.                                     |
| `/[lang]/site/recoveries/[code]`           | an API-backed recovery dossier.                                      |
| `/[lang]/site/random`                      | a redirect to a randomly chosen record.                              |
| `/[lang]/site/write`                       | the author landing and browser-local draft.                          |
| `/[lang]/site/write/editor`                | the browser-local incident editor.                                   |
| `/[lang]/desktop`                          | the CIRCA/OS workstation preview.                                    |
| `/[lang]/desktop/[destination]`            | a focused workstation destination.                                   |
| `/[lang]/desktop/record/[code]`            | a record opened inside the workstation.                              |
| `/[lang]/account`                          | the signed-in account and session summary.                           |
| `/[lang]/sign-in`, `/[lang]/sign-up`       | personal access forms.                                               |
| `/[lang]/meta`                             | the project landing page.                                            |
| `/[lang]/meta/about`                       | the dossier outside the fiction.                                     |
| `/[lang]/meta/documentation`               | this documentation.                                                  |
| `/[lang]/meta/documentation/[slug]`        | one documentation page.                                              |

### V1 target routes not served yet

[ADR 008](../../adr/008-v1-public-site-scope.md) fixes the public-site scope. These routes are part of the v1 contract but do not exist in the tree yet:

- `/[lang]/site/records/[code]/filings` — the paginated filings filed against an incident, with class, author, date, assessment counts, and comment count.
- `/[lang]/site/records/[code]/playlists` — the incident's public playlists, with the incident author's playlist pinned first.
- `/[lang]/site/playlists/[id]` — one playlist's ordered filings.
- `/[lang]/site/recoveries` — the recovery directory.
- Canonical dossier routes for every organisation, character, and recovery; organisation dossiers currently use a filtered directory query.
- Draft, publish, edit, and revision-history routes behind `/[lang]/site/write`.

The class pages for rumours and playlists are reserved shells until those indexes are API-backed. The site also still reads fixtures by default; [ADR 004](../../adr/004-fixture-backed-client.md) is superseded for `/site` by ADR 008, but read parity is a separate implementation milestone.

## Language is in the path

routing.ts is the only file that lists the languages. The proxy resolves an explicit prefix first, then the NEXT_LOCALE cookie, then Accept-Language, then English.

The language layout validates the segment, sets the document language, loads the fonts, and mounts the message provider with only the namespaces client components read.

> [!NOTE]
> Adding a language
>
> Add it to routing.ts, add a catalog directory under messages/, and translate every key. The catalog test compares key sets, placeholders, and rich-text tags across locales.

## Two front ends

The reading edition is server-first: search is a GET form, downloads are route handlers, and the only client islands are navigation disclosures, the notes composer, and the author landing. The route map above is the full reading-edition surface; a record's class pages and related lists are filters over the same index.

The workstation is a client shell: stateful windows over local archive fixtures. Account routes use the .NET authentication service; search, destination reads, and the organisation directory can use the API behind `SEARCH_SOURCE=api`. Neither edition owns content, and the v1 target makes the API the only runtime source for the reading edition.

## Adding a route

A route under the language segment has four jobs: resolve the language, set the request locale, build metadata from the metadata namespace, and render a component.

```tsx
export default async function Page({ params }: Props) {
  const { lang } = await params;
  setRequestLocale(lang);
  return <SomeSurface />;
}
```

Layouts belong to the surface, copy belongs to the catalog, and metadata belongs to the page. Link with the locale-aware Link from the i18n navigation module, never next/link.
