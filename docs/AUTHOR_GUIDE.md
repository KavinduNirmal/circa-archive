# Writing and contributing stories

**Platform authoring framework — v1 scope recorded, implementation in progress.** The v1 content model is recorded in [ADR 008](adr/008-v1-public-site-scope.md). The running client still uses illustrative fixtures for most archive content and keeps editor drafts in the browser; this guide describes the rules the v1 product will enforce, not features that already work. Where this guide and the running tree disagree, the tree is the current behavior and the difference is tracked as implementation work.

These are rules for authors collaborating on CIRCA Archive. For the fictional world's mechanics, read the [lore references](lore/README.md). Filing, evidence, and reader assessment are separate: a published record can be well supported without being adopted into anyone's reading order, and a reader can follow a playlist without that playlist becoming canon.

## What you can file

| Filing           | Code         | Purpose                                                                                      |
| ---------------- | ------------ | -------------------------------------------------------------------------------------------- |
| **Incident**     | `INC-000000` | The original ghost story: its theme, premise, and any constraints the author establishes.    |
| **Exploration**  | `EXP-000000` | A deliberate expedition into an Incident, written as a short story about learning its rules. |
| **Evidence**     | `EVI-000000` | A witness statement, interview, document, image, or other account filed against an Incident. |
| **Rumour**       | none         | Speculation with no narrative basis, filed to misdirect. Shown in a separate Rumours tab.    |
| **Organization** | `ORG-000000` | An in-universe body that researches, exploits, manages, or worships Incidents.               |
| **Character**    | `CHR-000000` | A reusable person or entity with an owner, history, and declared usage policy.               |
| **Recovery**     | `ITM-000000` | An item or material recovered from an Incident, with custody and documentation status.       |

A filing must make a meaningful contribution. Atmosphere, consequences, and new perspectives count; spam, targeted ridicule, and repetitions do not.

Codes use a minimum six-digit sequence. The reserved ranges are not gaps: a code in a reserved range answers `200` with **Missing Record**, because the archive reserves the number without holding a document. A `404` means the identifier exists but the archive does not hold it. The same rule applies to incidents, explorations, evidence, and recoveries.

## The incident is the hub

An Incident is the origin of a story and the address every follow-up points at. Each exploration, evidence filing, and rumour is **filed against** one incident; that relation is the record's parent. There is no separate follow-up chain, fork, branch, continuity, adoption, stewardship, or foundational-amendment mechanism in v1.

That means:

- Any signed-in author may file an exploration, evidence, or rumour against an existing incident.
- A follow-up adds an account. It does not establish the incident's truth, replace its premise, or claim the incident for an organisation.
- Contradictory accounts coexist. The archive files them side by side and the reader decides what to believe.
- Changing another author's protected premise is a conduct matter, not a platform transaction. v1 has no amendment button; if a contribution fundamentally rewrites someone else's incident, it may be moderated.

A published incident and its follow-ups are still open to further writing. Publication does not lock an incident, and it does not make any account canonical.

## Core rules and follow-ups

The incident's author establishes its creative boundaries. Before writing a follow-up, distinguish three categories:

| Category                                  | What it protects or describes                                                                      | How another author may respond                                                  |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Core Rules / Foundational Constraints** | The Incident's core identity and non-negotiable creative boundaries, including its primary actors. | Do not invalidate them. A new account can interpret them; it cannot erase them. |
| **Established Observations**              | Findings supported by exploration records. They can still be incomplete or mistaken.               | Challenge or revise them through new evidence.                                  |
| **Unverified Claims**                     | Speculation, testimony, rumors, hypotheses, and disputed conclusions.                              | Question, contradict, or reinterpret them while respecting the Core Rules.      |

Not every apparent rule discovered in an exploration becomes foundational. A narrator's certainty does not grant permission to rewrite another author's protected premise.

For example, an exploration may challenge the observation that nobody returns from a particular station. It cannot simply declare that a protected supernatural train has always been an ordinary vehicle.

## Reference other filings with wikilinks

Use a typed `[[...]]` link when a filing mentions an existing archive entity:

| Prefix | Target       | Example          |
| ------ | ------------ | ---------------- |
| `INC`  | Incident     | `[[INC-008928]]` |
| `EXP`  | Exploration  | `[[EXP-288902]]` |
| `EVI`  | Evidence     | `[[EVI-035783]]` |
| `ORG`  | Organization | `[[ORG-005429]]` |
| `CHR`  | Character    | `[[CHR-018257]]` |
| `ITM`  | Recovery     | `[[ITM-000143]]` |

Incidents, explorations, evidence, organizations, and recoveries can be referenced regardless of recognition or filing status. Characters are different: you must import a character from the editor's **Entity Registry** for this draft. Importing is a request for this document only; it does not license later documents. A character marked **Restricted** opens an acknowledgement warning; notifying its owner on submission is deferred and is not part of v1.

For a new organization, character, recovery, or evidence image that does not exist in the archive yet, create it in the Entity Registry. It receives a temporary code such as `TEMP-CHR-01`, tied to your draft. On submission the archive validates every link, creates the permanent entities, replaces the temporary codes, and files the record. If anything fails, the whole submission fails and the draft stays intact. Nothing is left half-created.

A link is navigation, not ownership. Referencing an entity does not let you control its established characterization, claim its Incident, or adopt it into a reading order.

## Drafts, publication, and persistence

Writing happens in a server-persisted draft. A signed-in author can keep several drafts, autosave them, and resume one on another device. Browser storage may hold an offline cache, but it is not the source of truth and losing it must not lose the draft.

Publishing is one transaction: the server validates the Markdown, links, permissions, and per-type length limits; promotes temporary entities; allocates permanent codes; rewrites tokens; computes the content hash; writes the filing; and writes revision 1. Any failure rolls back and leaves the draft editable. A published filing is visible according to its access policy, and the author is shown on the record.

The per-type limits are:

| Type        | Words | Characters |
| ----------- | ----- | ---------- |
| Incident    | 2,500 | 15,000     |
| Exploration | 5,000 | 25,000     |
| Evidence    | 2,000 | 10,000     |
| Rumour      | 1,000 | 10,000     |

Signed-out visitors can read but cannot start a draft, publish, comment, assess, or edit a playlist. Those surfaces show a sign-in action instead of failing silently.

## Editing and revisions

An author may edit their own filing, and only their own. Each substantive edit appends a revision with a revision number, editor, date, and reason; the current filing is the latest revision and material history stays visible. v1 has no delete, withdraw, or erase action for authors. Tombstoning is a moderation action, not an author action.

Do not silently rewrite a contribution other authors have already responded to. A revision is the archive's record of what changed.

## Comments

Comments are discussion, not filings. They have no archive code, do not appear in search results, do not consume a number, and never change canon, evidence, or lifecycle. A comment attaches to one incident or one record.

- **One reply level.** A root comment may receive replies; replies cannot be replied to.
- **Guests read, signed-in authors write.** The author identity comes from the account, never from a free-text name field.
- **One thread per target.** Record pages and incident pages both carry comments.
- **Authors edit and delete their own comments.** Deleting a root comment hides or tombstones its replies consistently.
- **Length and rate limits apply.** Coordinated flooding is prohibited.

## Assessment: Corroborate and Contest

Readers may **Corroborate** or **Contest** a filing — an exploration, evidence filing, or rumour. Incidents are not assessed in v1. Assessment is not a truth claim, not a rating of the story's quality, and not adoption.

- One assessment per account per filing, removable at any time.
- An author cannot assess their own filing, and their assessment does not count.
- Counts are visible in front of the filing, so readers can judge for themselves.
- A filing with at least ten assessments and at least 70% Contest carries the **Disputed** advisory above its body. The advisory is text only: it is not a stored status, it does not change default ordering, and it does not determine factual status.
- The default filing order is chronological. A reader may explicitly choose a top-score sort.
- Coordinated voting or suppression is prohibited.

## Playlists

A playlist is an author's curated reading order for one incident, not a claim about canon. In v1 every playlist is public.

- Any signed-in author may create a playlist for an incident, rename it, describe it, add and remove filings, reorder them, and delete it.
- The incident author's playlist is pinned first. It is not privileged as truth.
- A record lists the playlists it appears in.
- Playlist membership does not change publication, evidence, lifecycle, or assessment counts.
- Private and unlisted playlists are post-v1.

## Characters and consent

Characters have an owner and a declared usage policy. V1 has two policies:

| Declared permission      | What another author may do                                                                                                                                                                   |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Open**                 | Reference and develop the character within the declared scope and the platform rules, including changes to characterization, history, and relationships.                                     |
| **Restricted — default** | Reference the character, but preserve established characterization, history, relationships, and narrative agency. The character may appear; the citing record may not redefine who they are. |

The policy changes what content a record may establish, not whether the character may be cited. Referencing a Restricted character does not require approval, and it does not license a redefinition.

Every import is scoped to one draft. Importing a character in one filing does not grant permission for the next. Declare permissions and any narrower scope clearly. Creating an original investigator remains an option when another character is unavailable for substantial use.

Using a Restricted character requires acknowledging the warning: characterization, history, relationships, and narrative agency remain subject to the Character Usage Guidelines, and confirmed violations may lead to review, moderation, or a content strike. Notifying the owner on submission is post-v1; the guide will be updated when that surface exists.

Do not retroactively erase someone else's established character outcome without consent. A new interpretation of an apparent death can be a story development; declaring the preceding contribution never happened is a different action. Arbitrarily invalidating an established survival is prohibited.

Reader preference about character continuities does not override these permissions. Character creation and editing are author-only in v1; there is no second-editor or appointed-moderator role.

## Organisations and recoveries

Organisations and recoveries are archive entities, not accounts.

- An author may create an organisation or recovery and edit the one they created. No organisation moderator role exists in v1.
- Organisation dossiers carry name, recognition state, established and recognised years, affiliation, description, holdings, references, and an optional logo. Recognition state is display-only in v1; recognition voting and governance are post-v1.
- Recovery dossiers carry name, aliases, category, description, origin incident, first documented record, documentation status, custody, and references.
- Both have directories and stable canonical URLs. A dossier is a record of what is known, not a claim of ownership.

Images for evidence, logos, and galleries upload to archive media storage. S3-compatible storage is the production target, with a local adapter for development. Uploaded assets are tied to a draft until publication, when they become stable references; a browser blob is never the source of truth.

## Content warnings, access, and classification

Choose a warning tier when filing:

| Tier       | Meaning                                              |
| ---------- | ---------------------------------------------------- |
| **Red**    | Explicit graphic death, gore, or violence.           |
| **Yellow** | Some mentions of death, gore, violence, or swearing. |
| **Green**  | No mentions of death, gore, violence, or swearing.   |
| **None**   | You chose not to include warnings.                   |

Specific tags such as `Graphic Violence`, `Psychological Horror`, `Sexual Violence`, `Self-Harm`, and `Major Character Death` may accompany the tier. **No Warnings Apply** means you confirm the listed warnings are not applicable. **Warnings Not Provided** means you have not decided. These are different from **None**; do not present them as equivalent.

Access policy is separate from warnings:

- `public` reads normally.
- `sealed` hides the body behind a cosmetic overlay that any reader can dismiss with a button. It is presentation, not a security boundary: do not put content behind it that must never be shown.
- `restricted` returns `401` with the diegetic clearance notice. This is a platform denial, not a reader choice.

Classification (`LEVEL 3`–`LEVEL 6`) is cosmetic and grants no access. A restricted filing must not render its body; a sealed filing may show a title and metadata before the overlay is dismissed.

## Search, language, and identity

Search reads the public archive and never returns comments, restricted bodies, or hidden records. `/ko` preselects Korean in the search language field; the reader can still switch languages, and filed content stays in the language it was filed in.

A record shows its author as `displayName <displayId>`. Comments show the account identity. There is no free-text correspondent field.

## Conduct and appeals

Humor and satire are allowed. Targeted ridicule of another author's Incident, spam, harassment, doxxing, and attempts to seize narrative control are not. Report violations instead of retaliating.

Enforcement may include filing restrictions, content removal, warnings, suspension, or exclusion, weighed by nature, severity, intent, and frequency. You may appeal through the established review process except where legal, safety, or abuse-prevention constraints require otherwise.

## Licensing and attribution

Published original creative content is offered under **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)**. You retain copyright in your contributions. Others may share and adapt the work with attribution, for non-commercial purposes, under the same license. The source code and documentation are licensed separately under MIT; the licence for a part of the repository depends on what it contains.

Do not publish third-party characters, settings, organizations, storylines, or other protected expression without permission. Attribution alone does not grant that permission. Adapting previously published CIRCA material is allowed under its license, but publication here still follows the narrative and conduct rules.

## Before submitting

Identify the Incident you are filing against, the records you build on, the Core Rules you must preserve, and any character import the draft needs. Distinguish a new observation from an unverified explanation. Keep credit and source references visible.

Check that the draft is yours to publish, that every wikilink resolves, that any temporary entity is intended, and that the access policy and warnings match the content. If you are editing an existing filing, add a revision reason that tells the next reader what changed.

## Decisions recorded and still open

The v1 decisions are recorded in [ADR 008](adr/008-v1-public-site-scope.md) and supersede the earlier adoption, branching, stewardship, succession, foundational-amendment, primary-claim, and organisation-governance descriptions. In particular: comments are not records; assessments apply to filings only; self-assessment is excluded; playlists are public only; reserved codes return `200 Missing Record`; sealed records are cosmetic; restricted records return `401`; and entity editing is author-only.

Still open after v1 scoping include the rumour link token, recovery and character number ranges, author deletion and withdrawal, revision visibility, moderation-console design, organisation recognition thresholds, holder-code grammar, and the exact seeded names and codes. The [lore references](lore/README.md) describe the fiction; this guide describes the platform. Existing [content and conduct rules](../CODE_OF_CONDUCT.md) still apply.
