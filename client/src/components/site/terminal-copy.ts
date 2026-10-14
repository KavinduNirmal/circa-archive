/**
 * Everything the archive half of the landing page says.
 *
 * This is the fiction's own copy, kept apart from `site-meta.ts` so the
 * institution speaks with one voice and the real project facts never leak into
 * it. The terminal is written as CIRCA would write it: numbered clauses, short
 * declaratives, no marketing, and no mention of repositories, licences, or
 * frameworks. `tests/site-meta.test.ts` checks that separation rather than
 * trusting it.
 *
 * Counts, codes, and records are not written here. They are read from the same
 * fixtures the workstation files, so the terminal cannot describe an archive
 * that is not on the machine.
 */

export type TerminalScene = { index: string; rail: string; heading: string; note: string };

export const TERMINAL = {
  wordmark: "C.I.R.C.A.",
  system: "CIRCA/OS 4.12",
  node: "Public access terminal, node 04",
  address: "archive.circa.local/index.htm",
  clearance: "Level 3 access",
  monitoring: "Use of this terminal is recorded.",
  cue: "Begin reading: what the Commission does",
  notice: {
    label: "Public access notice",
    body: "The Commission reviews incidents that should not have happened and files a record of each one. This terminal publishes the index of those records. Reading is unrestricted at your clearance.",
  },
  /** The three clauses are the archive's own statement of what it is for. */
  clauses: [
    {
      index: "1.1",
      title: "The Commission reviews",
      body: "An incident is opened when something happens that the record cannot account for. Review is a reading, not an investigation: the file is assembled from what was filed, and nothing is added to it afterwards.",
    },
    {
      index: "1.2",
      title: "The Commission files",
      body: "Every review ends in an entry with a code, a designation, a class, and a clearance. An entry is issued once and is never reissued, so a code that has been withheld stays listed rather than being handed on.",
    },
    {
      index: "1.3",
      title: "The Commission does not decide",
      body: "The archive holds no opinion about whether an incident happened. It records what was filed, by whom, and under which institution's language, and it keeps the disagreement visible.",
    },
  ],
  /** Scene labels, so the § rail reads the same on every scene that uses it. */
  scenes: {
    clauses: {
      index: "§ 1",
      rail: "Duties",
      heading: "What the Commission does",
      note: "Three clauses, and nothing else. The archive is not a court, and it does not hold one.",
    },
    ledger: {
      index: "§ 2",
      rail: "Index",
      heading: "Entries on the index",
      note: "Six entries, exactly as the index returns them. The full listing runs at the workstation.",
    },
    filing: {
      index: "§ 3",
      rail: "A filing",
      heading: "What an entry carries",
      note: "This is the whole of an entry. Nothing is filed that cannot be read at its clearance.",
    },
    organizations: {
      index: "§ 4",
      rail: "Bodies",
      heading: "One incident, several languages",
      note: "Bodies the archive files under. Each names the phenomenon in its own vocabulary, and an entry keeps the name its filer used.",
    },
  },
  ledger: {
    label: "On file",
    withheld: "Withheld",
    columns: { code: "Code", designation: "Designation", klass: "Class", filed: "Filed", status: "Status" },
  },
  filing: {
    fields: [
      { key: "Code", note: "Issued at filing, in the format of the class." },
      { key: "Designation", note: "A short name for the incident, or withheld." },
      { key: "Class", note: "Incident, organization, continuity, or memo." },
      { key: "Filed", note: "The day the entry was accepted." },
      { key: "Organization", note: "The lens it was filed under, CIRCA or another body." },
      { key: "Clearance", note: "The level required to read it in full." },
      { key: "Abstract", note: "What was recorded, in the filer's own words." },
    ],
  },
  organizations: {
    label: "Organizations",
    columns: { code: "Code", designation: "Designation", filed: "Filed", status: "Standing" },
    vocabularyLabel: "Calls it",
    /** The term each body files the phenomenon under, as the archive has it. */
    vocabulary: {
      "ORG-U-000011": "Omens",
      "ORG-A-020748": "Recognitions",
      "ORG-C-005102": "Intervals",
      "CIRCA-R-0438": "Unfiled",
    } as Record<string, string>,
  },
  entry: {
    label: "Access",
    heading: "The index is kept on the workstation",
    note: "The public listing ends here. Reading the entries themselves, and filing new ones, is done from the terminal workstation.",
    cta: "Enter the workstation",
    path: "/desktop",
  },
  footer: "For official use only. The archive does not decide truth.",
} as const;
