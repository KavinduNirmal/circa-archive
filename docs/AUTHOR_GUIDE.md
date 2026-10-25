# Writing and contributing stories

**Platform authoring framework — pre-release.** This guide describes how contributions should be handled. The current client uses illustrative fixtures; these permissions, review processes, and adoption workflows are not yet implemented.

These are rules for authors collaborating on CIRCA Archive. For the fictional world's mechanics, read the [lore references](lore/README.md). Filing, evidence, and continuity remain separate: a published record can be credible without being adopted, and an adopted record can contain an unreliable account.

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

## Start with the Incident's boundaries

The **Founding Author**, called the **Originator** in archival language, creates the original Incident record and identifies its core creative boundaries. That record may establish or hint at rules. Its narrator need not understand what the author has defined.

Before writing a follow-up, distinguish three categories:

| Category                                  | What it protects or describes                                                                      | How another author may respond                                                                       |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Core Rules / Foundational Constraints** | The Incident's core identity and non-negotiable creative boundaries, including its primary actors. | Do not invalidate them without an authorized Foundational Amendment. A branch is not an exemption.   |
| **Established Observations**              | Findings supported by exploration records. They can still be incomplete or mistaken.               | Challenge or revise them through new evidence.                                                       |
| **Unverified Claims**                     | Speculation, testimony, rumors, hypotheses, and disputed conclusions.                              | Question, contradict, or reinterpret them while respecting Core Rules and collaboration permissions. |

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

Incidents, explorations, evidence, organizations, and recoveries can be referenced regardless of recognition or filing status. Characters are different: you must import a character from the editor's **Entity Registry** for this draft. Importing is a request for this document only; it does not license later documents. A character marked **Restricted** opens an acknowledgement warning and notifies its owner when you submit.

For a new organization, character, recovery, or evidence image that does not exist in the archive yet, create it in the Entity Registry. It receives a temporary code such as `TEMP-CHR-01`, tied to your draft. On submission the archive validates every link, creates the permanent entities, replaces the temporary codes, and files the record. If anything fails, the whole submission fails and the draft stays intact. Nothing is left half-created.

A link is navigation, not ownership. Referencing an entity does not let you control its established characterization or claim its Incident.

## Filing and adoption

Any eligible author may submit an Exploration Record to an existing Incident, subject to content rules and the permissions in this guide. Publication does not require adoption into its principal continuity.

The intended sequence is:

1. A compliant Exploration Record is published as an independent filing.
2. Readers discuss it, endorse the writing, and examine its evidence.
3. The Originator or an authorized Continuity Steward may adopt it into the principal continuity.
4. If it is not adopted, it remains available as an independent record and can support further writing or an explicitly established branch.

Votes and comments inform these decisions. They do not automatically amend Core Rules, establish truth, or adopt a record. Declining adoption does not remove a compliant record from the archive.

Use **Filed**, **Independent**, **Adopted**, and **Divergent** rather than declaring one account universally canonical. A principal continuity is one curated sequence; readers can follow others.

## Keep three kinds of status separate

| Question        | Examples                                                                         | What it does not decide                                              |
| --------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Publication** | Draft or published.                                                              | Whether claims are supported or a continuity has adopted the record. |
| **Evidence**    | Unverified, corroborated, or disputed.                                           | Who may change Core Rules or whether a record belongs to a timeline. |
| **Continuity**  | Independent, adopted into a named continuity, or part of a divergent continuity. | Whether every interpretation in the record is true.                  |

A published, corroborated, independent record has evidence but has not been adopted. A published, disputed, adopted record can belong to a timeline while its interpretation remains contested.

These are conceptual distinctions, not implemented status controls. Withdrawal and deletion workflows remain unresolved. Tombstones concern content moderation; non-adoption is not a tombstone.

## Amendments, stewards, and succession

A **Foundational Amendment** changes a Core Rule with the Founding Author's approval, or approval from someone expressly delegated that authority. Adoption alone does not silently amend a protected constraint.

Record what changed and when the amendment became effective. Preserve older records and the constraints under which they were valid rather than retroactively treating them as violations.

The Founding Author may designate **Continuity Stewards** to adopt records and maintain timelines within a stated scope. Stewardship does not automatically include foundational amendment authority, ownership of an organization, or control of unrelated branches.

Authors should be able to configure stewardship and succession in advance. The intended fallback for an inactive Incident without succession arrangements is an orphaned-Incident pool. Inactivity thresholds, pool administration, and the powers of a future steward remain to be defined. Until resolved, inactivity is not blanket permission to rewrite Core Rules; independent filing and branching remain available.

## Independent records and branches

An independent record is not automatically a branch. A **divergent continuity** explicitly links an alternative sequence to its source, with attribution and a visible divergence point. Contributors can write sequels to compliant independent records without erasing the principal timeline.

Two authors may file contradictory expedition outcomes. Both remain available independently unless and until adopted into particular continuities. Choosing one sequence does not invalidate the existence of the other.

A record fork preserves its source lineage. Creating a branch additionally identifies the timeline being followed; the two actions should not be treated as identical.

## Characters and consent

| Declared permission      | What another author may do                                                                                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Open**                 | Use and develop the character within the declared scope and general platform rules. A death may be written in a divergent continuity without ending the character in other timelines. |
| **Restricted — default** | Reference the character, but preserve established characterization, history, relationships, and narrative agency. The owner is notified on submission and may request a review.       |

Every import is scoped to one draft. Importing a character in one filing does not grant permission for the next. Declare permissions and any narrower scope clearly. Creating an original investigator remains an option when another character is unavailable for substantial use.

Using a Restricted character requires acknowledging the warning: characterization, history, relationships, and narrative agency remain subject to the Character Usage Guidelines; the owner will be notified when the record is submitted; and confirmed violations may lead to review, moderation, or a content strike.

Do not retroactively erase someone else's established character outcome without consent. A new interpretation of an apparent death can be a story development; declaring the preceding contribution never happened is a different action. Arbitrarily invalidating an established survival is prohibited.

Reader preference about character continuities does not override these permissions.

## Primary actors and consequential outcomes

Primary actor identity belongs to the Incident's Core Rules. Supporting entities, witnesses, temporary antagonists, and secondary actors can be introduced where compatible with those rules.

Do not replace a protected primary actor or declare that a newly invented character was secretly the true primary actor without an authorized amendment. After an actor is destroyed within a continuity, a successor can be introduced there if the constraints permit. That successor does not replace the actor in every other timeline.

Actor destruction, deaths, and permanent-clearance claims may be filed where they respect Core Rules and applicable character permissions. They do not automatically enter the principal continuity. A branch's consequences remain within its sequence unless adopted elsewhere.

The setting's ordinary [clearance and recurrence rules](lore/Narrative%20flow.md#clearance-and-recurrence) still apply. Permission to submit an outcome is not a universal supernatural method for permanently ending any Incident.

## Nested and connected Incidents

A writer may introduce a nested phenomenon compatible with the surrounding Incident's constraints. If it becomes a persistent, independently explorable system, give it its own Incident record and attribution.

A speculative report can propose a connection to another author's Incident. It does not make that connection authoritative. Establishing a relationship that changes both Incidents' protected identity requires the relevant authors' permissions or authorized amendments; adoption must be considered for each affected continuity.

No single author can use a connection to unilaterally redefine another Incident.

## Content warnings and access

Choose a warning tier when filing:

| Tier       | Meaning                                              |
| ---------- | ---------------------------------------------------- |
| **Red**    | Explicit graphic death, gore, or violence.           |
| **Yellow** | Some mentions of death, gore, violence, or swearing. |
| **Green**  | No mentions of death, gore, violence, or swearing.   |
| **None**   | You chose not to include warnings.                   |

Specific tags such as `Graphic Violence`, `Psychological Horror`, `Sexual Violence`, `Self-Harm`, and `Major Character Death` may accompany the tier. **No Warnings Apply** means you confirm the listed warnings are not applicable. **Warnings Not Provided** means you have not decided. These are different from **None**; do not present them as equivalent.

Access policy is separate from warnings: `public` reads normally, `sealed` withholds the body until access is requested, and `restricted` is a platform denial shown as a clearance notice. Classification (`LEVEL 3`–`LEVEL 6`) is cosmetic and does not grant access.

## Revisions, retractions, and redactions

Revise or retract your own filings through the available controls. Material revisions preserve the historical existence of a contribution that has become part of a collaborative narrative; do not silently rewrite what other authors responded to.

Narrative redaction is allowed for confidentiality, classification, missing information, or deliberate archival presentation. It must not conceal a policy violation or evade moderation.

## Conduct, assessment, and appeals

Assessment is a reader action: **Corroborate** or **Contest**, one per account, removable at any time. It is not a truth claim and does not adopt a record. A record may receive a `Disputed` advisory after at least ten assessments with 70% or more Contest; the advisory explicitly says it does not determine factual status. Coordinated voting or suppression is prohibited.

Humor and satire are allowed. Targeted ridicule of another author's Incident, spam, harassment, doxxing, and attempts to seize narrative control are not. Report violations instead of retaliating.

Enforcement may include filing restrictions, content removal, warnings, suspension, or exclusion, weighed by nature, severity, intent, and frequency. You may appeal through the established review process except where legal, safety, or abuse-prevention constraints require otherwise.

## Licensing and attribution

Published original creative content is offered under **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)**. You retain copyright in your contributions. Others may share and adapt the work with attribution, for non-commercial purposes, under the same license.

Do not publish third-party characters, settings, organizations, storylines, or other protected expression without permission. Attribution alone does not grant that permission. Adapting previously published CIRCA material is allowed under its license, but publication here still follows the narrative and conduct rules.

## Before submitting

Identify the Incident and records you build on, the continuity you follow or where you diverge, the Core Rules you must preserve, and any character permissions or amendments required. Distinguish a new observation from an unverified explanation.

Keep credit and source references visible. An adoption request should identify the destination continuity and any decision needed; it does not make approval automatic.

## Decisions still open

The framework does not yet settle opting an Incident out of independent contributions, curated pre-publication approval, withdrawal after others have contributed, deletion and preservation responsibilities, succession triggers, the exact recognition threshold for organizations, or the detailed collaboration dispute process.

Rumour link tokens, recovery number ranges, sealed-access decision authority, and whether a third `Reference Only` character policy returns remain open. Existing [content and conduct rules](../CODE_OF_CONDUCT.md) still apply; continuity disagreement alone is not permission to harass contributors or erase their work.
