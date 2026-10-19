# Personal access

## Responsibility and structure

- `access-shell.tsx` and `auth.module.css`: a compact archive masthead, language control, and a narrow paper form or account leaf. They reuse the archive seal, palette, typography, and `ArchiveButton`; search, classification notices, and the marquee stay in the archive.
- `access-page.tsx`: server session checks, authenticated/guest redirects, account particulars, and a retryable unavailable state.
- `auth-form.tsx`: sign-up and sign-in through the existing cookie API, native localized validation, translated API errors, password visibility, and pending protection.
- `sign-out-button.tsx`: revokes the current session and returns to the archive only after successful logout.
- `session-access-link.tsx`: resolves the server session for the portal and archive. `access-link.tsx` renders Sign in, Personal access, or the neutral Access state during an outage.

## Boundaries

The API owns authentication and authorization. Cookie presence alone never grants a signed-in label. Server session lookups are memoized only within the current request, uncached across users, and skipped for visitors without an access cookie. Network failures do not clear a session or prevent public reading. Next.js rendering control signals are rethrown rather than treated as outages.

Browser code submits passwords only to the same-origin API; passwords and tokens are never persisted to browser storage. Successful form submissions and logout perform a full navigation because cookies changed outside Next.js Server Actions, so a cached guest or account render cannot survive the transition. All copy lives in the English and Korean `auth` catalogs.

## Usage and verification

The three routes are `/{lang}/sign-in`, `/{lang}/sign-up`, and `/{lang}/account`. Registration collects username/email/password; sign-in accepts username or email. The account page shows username and role. No profile editor, password recovery, verification, or workstation permissions are implemented here.

From `client/`, run `bun run test -- --maxWorkers=1 tests/auth-ui.test.tsx tests/auth-pages.test.tsx tests/auth-session.test.ts tests/landing.test.tsx tests/archive-site.test.tsx`. Browser verification uses `bun run test:e2e:auth`, which starts an isolated PostgreSQL/API and one browser worker. The suite captures English/Korean sign-in, sign-up, and account pages at 390px and 1440px under `/tmp/circa-auth-*.png`.
