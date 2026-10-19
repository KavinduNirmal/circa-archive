# Routes and editions

Every document answers at one address, in one language, on one of three surfaces.

## Route map

The routes below are the whole public surface. Every one of them is under a language segment.

| Route | Renders |
| --- | --- |
| `/[lang]` | the public portal, in the Commission's voice. |
| `/[lang]/site` | the reading edition's front page. |
| `/[lang]/site/records` | the record index; the q parameter is filtered on the server. |
| `/[lang]/site/records/[code]` | one record, prerendered for every code in the index. |
| `/[lang]/site/records/[code]/download` | Markdown and plain-text copies; 404 when the filing is held. |
| `/[lang]/site/organizations` | the organizations directory. |
| `/[lang]/site/random` | a redirect to a randomly chosen record. |
| `/[lang]/desktop` | the CIRCA/OS workstation preview. |
| `/[lang]/meta` | the project landing page. |
| `/[lang]/meta/about` | the dossier outside the fiction. |
| `/[lang]/meta/documentation` | this documentation. |

## Language is in the path

routing.ts is the only file that lists the languages. The proxy resolves an explicit prefix first, then the NEXT_LOCALE cookie, then Accept-Language, then English.

The language layout validates the segment, sets the document language, loads the fonts, and mounts the message provider with only the namespaces client components read.

> [!NOTE]
> Adding a language
>
> Add it to routing.ts, add a catalog directory under messages/, and translate every key. The catalog test compares key sets, placeholders, and rich-text tags across locales.

## Two front ends

The reading edition is server-first: search is a GET form, downloads are route handlers, and the only client island on a record is the notes composer.

The workstation is a client shell: stateful windows over the same fixtures, with no backend. Neither edition owns content, so a change in one corpus appears in both.

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
