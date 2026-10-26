import {
  ARCHIVE_INDEX,
  CLASS_LABELS,
  STATUS_LABELS,
  type ArchiveClass,
  type ArchiveEntry,
  type ArchiveStatus,
  type ArchiveWarningTag,
} from "../browser/archive-index";

/**
 * The archive site's view of the index.
 *
 * The index module owns what an entry is; this module owns the handful of
 * questions the public pages ask of it that the workstation never needed — how
 * many filings an organization holds and which catalog key names a class or a
 * status. It holds no React, so the pages stay views and these rules can be
 * tested from anywhere.
 */

/** The catalog key that names a class to a reader. */
export const CLASS_MESSAGE_KEY: Record<ArchiveClass, string> = {
  incident: "classIncident",
  organization: "classOrganization",
  exploration: "classExploration",
  evidence: "classEvidence",
};

/** The catalog key that names a status to a reader. */
export const STATUS_MESSAGE_KEY: Record<ArchiveStatus, string> = {
  "on-file": "statusOnFile",
  contested: "statusContested",
  sealed: "statusSealed",
  restricted: "statusRestricted",
  erased: "statusErased",
};

/** The catalog key that names a specific content warning. */
export const WARNING_MESSAGE_KEY: Record<ArchiveWarningTag, string> = {
  violence: "warningTagViolence",
  psychological: "warningTagPsychological",
  sexual: "warningTagSexual",
  selfHarm: "warningTagSelfHarm",
  death: "warningTagDeath",
};

/** The English words, for the places that need a label without a translator. */
export const CLASS_ENGLISH: Record<ArchiveClass, string> = CLASS_LABELS;
export const STATUS_ENGLISH: Record<ArchiveStatus, string> = STATUS_LABELS;

/** Every entry the index carries, in archive order. */
export const SITE_INDEX: readonly ArchiveEntry[] = ARCHIVE_INDEX;

/** The bodies entered in the directory: a class, not a claim about their nature. */
export const ORGANIZATIONS: readonly ArchiveEntry[] = ARCHIVE_INDEX.filter(
  (entry) => entry.klass === "organization",
);

/**
 * Consultations, as the reading room records them.
 *
 * There is no analytics on this site and there never will be, so this is sample
 * data in the same sense as the records: a fixed, authored count per entry. It
 * is what "most consulted" means here, and nothing about a visit to these pages
 * changes it.
 */
export const CONSULTATIONS: Readonly<Record<string, number>> = {
  "INC-00014": 2148,
  "CIRCA-S-03007": 1876,
  "INC-00042": 1502,
  "INC-00027": 1184,
  "INC-00118": 962,
  "ORG-C-005102": 731,
  "INC-00063": 604,
  "INC-00907": 588,
  "INC-00204": 431,
  "INC-00318": 398,
  "EVI-035783": 312,
  "ORG-A-020748": 287,
  "EXP-288903": 231,
  "EXP-288902": 194,
  "CIRCA-R-0438": 168,
  "EVI-035784": 142,
  "ORG-U-000011": 97,
  "EVI-035785": 88,
};

/** The most consulted entries, newest count first and archive order breaking ties. */
export function mostConsulted(
  count = 5,
): { entry: ArchiveEntry; consultations: number }[] {
  return SITE_INDEX.map((entry) => ({
    entry,
    consultations: CONSULTATIONS[entry.code] ?? 0,
  }))
    .sort((a, b) => b.consultations - a.consultations)
    .slice(0, count);
}

/** A record the reader has not chosen. The route that uses it redirects to the page. */
export function randomRecordCode(random: () => number = Math.random): string {
  const at = Math.min(
    SITE_INDEX.length - 1,
    Math.floor(random() * SITE_INDEX.length),
  );
  return SITE_INDEX[Math.max(0, at)].code;
}

/** How many filings an organization holds, counted from the index rather than asserted. */
export function filingsFor(code: string): number {
  return ARCHIVE_INDEX.filter((entry) => entry.organization === code).length;
}
