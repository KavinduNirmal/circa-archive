# Documentation

How the archive is built, how a record is written, and how to change either without breaking the other. Nine pages, in the order a contributor needs them.

## What this project is

CIRCA Archive is two things at once. In fiction it is the public face of the Commission for Incident Review and Corrective Action: a continuity that files reports on incidents that should not have happened. In code it is a Next.js application that renders that invented archive in English and Korean, with a server-rendered reading edition and an interactive workstation preview.

The records are invented. The interface, the renderer, the tests, and this documentation are real work. The site currently operates over local fixtures while backend integration is in progress; nothing you type is stored.

```brand-callout
This is code documentation

It describes the repository, not the fiction. The archive's own reading guide is at the public archive, under About the archive.
```

```brand list
- [Getting started](getting-started.md) — Install both toolchains, run the site, and know which command proves a change.
- [Write a record](records.md) — The header fields, the section rules, redactions, figures, and where the corpus lives.
- [Contribute](contributing.md) — One coherent change, the checks that prove it, and a pull request that says what you verified.
```


## The two editions

One corpus, three surfaces. A change to a record or an index entry appears wherever that record is read.

- **Reading edition —** server-rendered pages under /site, readable without JavaScript, with one client island for notes.
- **Workstation —** a client-side shell under /desktop with draggable windows, five applications, and illustrative fixtures.
- **Project pages —** the landing page, this documentation, and the dossier under /meta, written outside the fiction.

Both editions read the same index entries and the same Markdown sources. Neither owns content.

## What is built

The reading edition and the workstation preview work end to end over fixtures. The boundary between what exists and what is planned is part of the interface's honesty.

- **==Built== —** the public portal, the reading edition and record downloads, the workstation and its five applications, the Markdown pipeline, the project pages, this documentation, and the scaffolded .NET 10 backend modular monolith solution (`backend/Circa.sln`).
- **==In progress== —** domain module handlers, live database persistence, authentication handlers, saved annotations, moderation, and API client integration.
- **==Planned== —** the full .NET 10, EF Core, and SignalR platform described in ARCHITECTURE.md.

> [!WARNING]
> ARCHITECTURE.md is a draft
>
> It describes a platform whose API and schema do not exist. The running code is the source of truth for what the interface does today, and these pages document the running code.

## Reading this documentation

The interface is translated into English and Korean; code identifiers, routes, commands, and archive codes are not. This documentation follows the default branch, with no version switcher: the project is pre-production and the tree moves.

Every page ends with the previous and next topic, and every section has an anchor. The sidebar filters as you type; the right rail lists the sections on the page you are reading.

If a page disagrees with the tree, the tree is right and the page is a bug. [Report it in the repository](contributing.md)

Search covers the titles and Markdown of all nine documents in your language. Press Ctrl+K or Cmd+K from any project page to focus it. Use Edit documentation to propose a GitHub change, or Copy Markdown to copy the exact source. The live source is `develop`, refreshed every five minutes; unavailable documents show a retry and source link.

Open in ChatGPT copies the source and its URL as context, then opens ChatGPT. Paste the context and add your question; no message is sent automatically. The article footer links to the GitHub editor and shows the last verified file commit date when available.
