# Personal access

## Responsibility and structure

- `access-shell.tsx` and `auth.module.css`: an archive masthead, language control, and a two-column registry document with a reading-room note and a ruled paper form or account leaf. Mobile keeps a short registry heading above the form. They reuse the archive seal, palette, typography, and `ArchiveButton`; search, classification notices, and the marquee stay in the archive.
- `access-page.tsx`: server session checks, authenticated/guest redirects, account particulars, and a retryable unavailable state.
- `account-record.tsx` and `account.module.css`: the authenticated account register, with a left section index and anchored archive identity, account particulars, and session access. It displays the API profile, including the stable account UUID and UTC registration date. Navigation reflows above the details on mobile.
- `auth-form.tsx`: sign-up and sign-in through the existing cookie API, native localized username/password validation, translated API errors, password visibility, and pending protection. Registration fetches a generated analyst name from `/display-name`, supports rerolls, and submits the selected name with credentials. Preview failures preserve the last selection; without one, registration delegates name assignment to the API.
- `sign-out-button.tsx`: revokes the current session and returns to the archive only after successful logout.
- `session-access-link.tsx`: resolves the server session for the portal and archive. `access-link.tsx` renders Sign in, Personal access, or the neutral Access state during an outage.

## Boundaries

The API owns authentication and authorization. Cookie presence alone never grants a signed-in label. Server session lookups are memoized only within the current request, uncached across users, and skipped for visitors without an access cookie. Network failures do not clear a session or prevent public reading. Next.js rendering control signals are rethrown rather than treated as outages.

Browser code submits passwords only to the same-origin API; passwords and tokens are never persisted to browser storage. Successful form submissions and logout perform a full navigation because cookies changed outside Next.js Server Actions, so a cached guest or account render cannot survive the transition. All copy lives in the English and Korean `auth` catalogs.

## Usage and verification

The three routes are `/{lang}/sign-in`, `/{lang}/sign-up`, and `/{lang}/account`. Registration collects username/email/password and a generated analyst name; sign-in accepts username or email. The account page displays the public `/me` profile: analyst name, nine-digit registry number, display-only archive address, adopted organization UUID (or the default `my.circa.archive`), username, role, registration date, and account UUID. Organization names require the future organization directory; no client-side organization identity is invented. No profile editor, password recovery, verification, or workstation permissions are implemented here.

From `client/`, run `bun run test -- --maxWorkers=1 tests/auth-ui.test.tsx tests/auth-pages.test.tsx tests/auth-session.test.ts tests/landing.test.tsx tests/archive-site.test.tsx`. Browser verification uses `bun run test:e2e:auth`, which starts an isolated PostgreSQL/API and one browser worker. The suite captures English/Korean sign-in, sign-up, and account pages at 390px and 1440px under `/tmp/circa-auth-*.png`.

## Redesign decisions

The public archive reading face remains the visual reference: existing seal,
steel masthead, cool paper, hard edges, bevel controls, mono filing labels, and
serif institutional statements. Registration is one form with numbered credential
and archive-identity sections, with no extra registration step. The API remains
the source of generated names, uniqueness, reserved-name moderation, and account
permissions. The client mirrors the 3–20 ASCII username rule and password
complexity rules for immediate native feedback; it never claims availability
before the API accepts registration. Profile fields follow the public HTTP
contract rather than exposing every property of the backend domain entity.
