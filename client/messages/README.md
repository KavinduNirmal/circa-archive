# Message catalogs

## Responsibility

Every string the interface renders, in every language. These are the only files
that need translating; no component carries copy.

## Structure

One file per namespace per language:

```
messages/en/<namespace>.json   the source catalog
messages/ko/<namespace>.json   Korean
```

`en` is the reference: its key set is what every other language is compared
against, so a key is added there first.

| Namespace | Owner |
| --- | --- |
| `auth` | sign-up, sign-in, personal access, session links, and authentication errors |
| `metadata` | page titles, descriptions, and the registry's own names |
| `switcher` | the language control, including each language's endonym |
| `boot` | the workstation post screen |
| `shell` | workstation chrome — shortcuts, Start, taskbar, Settings, window titles |
| `landing` | the whole public portal |
| `site` | the public archive: chrome, index, records, tools, notes, and guide |
| `meta` | the project page outside the fiction |
| `files` | the file browser window |
| `mail` | the mail client window |
| `word` | the record editor window |
| `browser` | the archive browser window |
| `reader` | the record reader window |

Each file is a flat map of camelCase keys to strings. `src/i18n/request.ts` imports
them one by one and assembles the catalog for the resolved locale; the imports are
written out rather than looped because a bundler must see each path statically.

## Boundaries

**Interface chrome is translated; filed content is not.** This is the line that
matters here, and it is a deliberate product decision rather than a shortcut.

What is translated: menus, menu items, buttons, field labels, column headers,
status-bar segments, tooltips, notices, About and refusal boxes, empty states, and
aria-labels — everything the workstation says *about* the records.

What is not: the records themselves. The archive index, the incident titles, the
record corpus, the mail subjects and bodies, the correspondence, and the file tree
are the fiction's filed documents. An archive does not translate a document that was
filed in English, and the fiction already makes this point in its own words — an
organization is described by "a short sample record in the organization's own
language". Those live in the `*-index.ts`, `*-sources.ts`, `*-correspondence.ts`,
and `ghost-story.ts` modules and stay byte-identical in both languages; one of them
is asserted byte-identical to `public/Ghost_story.md`.

What is neither: brand and product names (`CIRCA`, `CIRCA/OS`, `CIRCA Explorer`,
`CIRCA Word`, `CIRCA Reader`, `Titan Browser`, `Titan Mail`) are proper nouns in both
languages, and identifiers — archive codes, document numbers, dates, times, room
numbers, versions — must survive translation intact because they are how a record is
cited. The seal monogram `IR / CA` on the portal's masthead is a graphic device, so
it stays in the component.

## Usage

`src/i18n/request.ts` loads the catalogs; components never import these files. Add a
key to every locale in the same change.

`tests/i18n-messages.test.ts` enforces the contract across the whole catalog tree:
the same namespace files in both languages, identical key sets, no empty values, and
the same ICU `{placeholders}` and rich-text tags. Run it with `bun run test`.

A Korean webfont has not been added, so Hangul falls back to the reader's own Korean
face; bundling a Korean webfont remains an open interface decision.
