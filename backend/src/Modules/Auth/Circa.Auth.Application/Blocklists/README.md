# Username blocklists

## Responsibility

Supply reserved account names during Identity validation. These are username
reservations, separate from the configurable profanity substring policy. They
never scan story content, change existing accounts, or automatically issue strikes.

## Structure and provenance

- `UsernameBlocklist.cs`: loads the embedded snapshot once into an immutable,
  case-insensitive set and matches the entire username. `root` and `ROOT` are
  reserved; `rootbeer` is not reserved by this list.
- `reserved-usernames.json`: unmodified `list.json` from
  [The Big Username Blocklist](https://github.com/marteinn/The-Big-Username-Blocklist),
  commit [`c5d456f6af0285931c85e08d53ed7e1ac35d31fc`](https://github.com/marteinn/The-Big-Username-Blocklist/tree/c5d456f6af0285931c85e08d53ed7e1ac35d31fc),
  retrieved 2026-10-20. Includes all 542 entries; ordinary syntax validation also
  rejects entries containing characters that CIRCA usernames cannot contain.
- `LICENSE.The-Big-Username-Blocklist.txt`: the upstream MIT notice, retained
  with its trailing blank line removed for repository whitespace checks;
  copied into build/publish output with the application.

Snapshot SHA-256: `fe13b62a522c732065261c50734c36d45cc4f42d9c1ff320b721226aaf403565`.
License SHA-256: `12c7830f390158aa17a2f408e229703a264d8fdcb362dc2cd43dc1d63d6ec423`.

## Boundaries

`AccountValidator` applies reserved-name checks independently of
`Auth:UsernamePolicy:BlockedTerms`, which remains the existing configurable
profanity substring policy. Clearing that option does not disable reserved names.
All checks run server-side through `UserManager`; public callers cannot supply a
role to bypass them. Existing users can still sign in with reserved names.

Content flagging is deferred. The separate
[censor-text profanity list](https://github.com/censor-text/profanity-list) is a
candidate baseline for future language-aware content review; it is not vendored
or applied to content in this change. Reserved account words such as `system`
must remain usable in stories. Future content policy must assess language,
context, false positives and source licensing before using that dataset.

## Usage and verification

No package install, runtime download or configuration is needed for reserved
names. To update, select and review a specific upstream commit, replace
`list.json` and its license from that commit, update this provenance and hashes,
and review the data diff. Keep the root [NOTICE](../../../../../../NOTICE)
consistent. Do not fetch a mutable upstream branch at application startup.

Run `dotnet test backend/Circa.sln` from the repository root (Docker required for
HTTP tests). Unit tests cover case-insensitive reservations independently of
profanity settings and accept words containing reserved names. HTTP tests confirm
rejected registrations create neither accounts nor session cookies.
