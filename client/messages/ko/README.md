# Korean catalog

## Responsibility

One file per namespace: the Korean catalog, for the Commission's correspondents in the Republic of Korea. The namespaces are described in [../README.md](../README.md).

## Structure

- `metadata.json`: page titles, descriptions, the registry's own names.
- `switcher.json`: the language control and each language's endonym.
- `boot.json`: the workstation post screen.
- `shell.json`: workstation chrome — shortcuts, Start, taskbar, Settings, window titles.
- `landing.json`: the public portal, rendered on the server.
- `site.json`: the public archive — search, index, record tools, notes, and the reading guide, rendered on the server.
- `meta.json`: the project page outside the fiction, rendered on the server.
- `browser.json`, `mail.json`, `files.json`, `word.json`, `reader.json`: the interior of each application window.

## Boundaries

Each file is a flat map of camelCase keys to strings; keys never contain dots, because next-intl reads a dot as a nested path. Interface chrome is translated and filed content is not — see [../README.md](../README.md) for that boundary and for the strings that stay Latin in both languages.

## Usage

`src/i18n/request.ts` imports these files; components never do. Edit every locale in the same change, then run `bun run test` for the parity check.

`editor.json` contains Korean incident editor controls and messages, matching the English catalog keys and placeholders.
