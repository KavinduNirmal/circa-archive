/**
 * The CIRCA/OS virtual filesystem.
 *
 * One flat node table keyed by id, with the hierarchy expressed as a `parent`
 * pointer. A folder therefore never owns its contents, which is what lets two
 * locations show the same filed document (a draft in My Documents, the same
 * draft in My Work) without a second copy that could drift from the first.
 *
 * Everything here is pure: the explorer component reads this table and never
 * writes to it, so the whole filesystem is testable without a renderer.
 */

/** The three listing layouts the View menu offers. */
export type FileView = "icons" | "list" | "details";

/** The four columns the details view can be sorted by. */
export type FileSortKey = "name" | "type" | "size" | "modified";

export type SortDirection = "ascending" | "descending";

/**
 * The translator shape the display helpers take.
 *
 * `files-index.ts` stays free of React and next-intl on purpose: the words the
 * helpers print are handed in by the component that owns the catalog hook, so a
 * listing can be sorted, described, and counted without a renderer or a
 * language. The filed content they read (names, stamps, sizes, extensions) is
 * never translated.
 */
export type FileTranslate = (
  key: string,
  values?: Record<string, string | number>,
) => string;

/** A registered extension. Anything else is an unregistered file. */
export type FileExt =
  | "pdf"
  | "eml"
  | "txt"
  | "jpg"
  | "png"
  | "wav"
  | "lnk"
  | "com"
  | "bat"
  | "sys"
  | "hlp"
  | "spl"
  | "key"
  | "bin";

type FileFields = {
  /** Stable lowercase id, unique across the whole tree. */
  id: string;
  /** Display name, exactly as the listing prints it. */
  name: string;
  /** Containing folder, or null for a root. */
  parent: string | null;
  /** Kept classification, shown in the tree pane's gutter when set. */
  clearance?: string;
};

export type FileFolder = FileFields & {
  kind: "folder";
  /** Stamp for the Modified column, since a folder has no size of its own. */
  opened: string;
  /** One line of folder description for the status bar. */
  note?: string;
};

export type FileDocument = FileFields & {
  kind: "file";
  ext: FileExt;
  /** Size in bytes; the listing prints whole kilobytes. */
  size: number;
  modified: string;
};

export type FileNode = FileFolder | FileDocument;

/** A folder with a file document's shape, so one icon-or-node call can serve both. */
export type IconTarget =
  FileNode | { kind: "folder"; ext?: FileExt; size?: number };

export function isFolder(node: IconTarget): node is FileFolder {
  return node.kind === "folder";
}

/**
 * A location the explorer can be rooted at. Two scopes may share a root (My
 * Documents and My Work are the same folder under two filters), and a scope may
 * carry its own summary line for an empty view such as _EXPUNGED.
 */
export type FileScope = {
  id: string;
  /** Catalog key for the titlebar text, in the workstation's casing. */
  titleKey: string;
  rootId: string;
  /** Catalog key for the status-bar line printed instead of an item count. */
  summaryKey?: string;
  /** The registry keys the policy notices quote. */
  reference?: string;
};

/* ------------------------------------------------------------------------- */
/* Node table                                                                 */
/* ------------------------------------------------------------------------- */

function makeFolder(
  parent: string | null,
  id: string,
  name: string,
  opened: string,
  extra: Partial<FileFolder> = {},
): FileFolder {
  return { id, name, kind: "folder", parent, opened, ...extra };
}

function makeFile(
  parent: string,
  id: string,
  name: string,
  ext: FileExt,
  size: number,
  modified: string,
  extra: Partial<FileDocument> = {},
): FileDocument {
  return { id, name, kind: "file", parent, ext, size, modified, ...extra };
}

/*
 * The workstation's own tree. My PC is the root; everything the desktop offers
 * is a folder inside it, so a shortcut and a place in the tree are the same
 * thing rather than two ideas that have to be kept in step by hand.
 */
const NODES: readonly FileNode[] = [
  // My PC.
  makeFolder(null, "pc-root", "My Computer", "2003-02-11 08:02", {
    note: "This workstation.",
  }),
  makeFolder("pc-root", "pc-drive", "C: [SYSTEM]", "2003-02-11 08:02", {
    note: "Local fixed disk, 2.1 GB.",
  }),

  // C: [SYSTEM].
  makeFolder("pc-drive", "dir-documents", "My Documents", "2003-02-11 08:40"),
  makeFolder("pc-drive", "dir-archive", "Archive", "2003-02-11 07:55"),
  makeFolder(
    "pc-drive",
    "dir-organizations",
    "Organizations",
    "2003-02-10 17:20",
  ),
  makeFolder("pc-drive", "dir-system", "System Files", "2003-01-01 00:00"),
  makeFolder("pc-drive", "dir-recycle", "Recycle Bin", "2003-02-09 11:30", {
    note: "Deleted drafts and records.",
  }),
  makeFolder("pc-drive", "dir-expunged", "_EXPUNGED", "2003-02-11 00:00", {
    note: "The archive of removed things.",
  }),
  makeFile(
    "pc-drive",
    "sys-command",
    "COMMAND.COM",
    "com",
    93_212,
    "1998-06-19 10:00",
  ),
  makeFile(
    "pc-drive",
    "sys-autoexec",
    "AUTOEXEC.BAT",
    "bat",
    412,
    "1998-06-19 10:00",
  ),
  makeFile(
    "pc-drive",
    "sys-config",
    "CONFIG.SYS",
    "sys",
    188,
    "1998-06-19 10:00",
  ),
  makeFile(
    "pc-drive",
    "sys-dos",
    "MSDOS.SYS",
    "sys",
    1_684,
    "1998-06-19 10:00",
  ),

  // System: lore files, help, and the corrupted corner of the disk.
  makeFolder("dir-system", "dir-system-help", "Help", "1999-04-02 09:00"),
  makeFolder(
    "dir-system",
    "dir-system-corrupt",
    "Corrupt",
    "2001-11-14 03:31",
    { note: "Unreadable sectors." },
  ),
  makeFile(
    "dir-system",
    "sys-splash",
    "CIRCA_OS.SPL",
    "spl",
    12,
    "1999-04-02 09:00",
  ),
  makeFile(
    "dir-system",
    "sys-kernel",
    "KERNEL.SYS",
    "sys",
    484_352,
    "1999-04-02 09:00",
  ),
  makeFile(
    "dir-system",
    "sys-manual",
    "CIRCA_OS_MANUAL.pdf",
    "pdf",
    214_016,
    "1999-04-02 09:00",
  ),
  makeFile(
    "dir-system",
    "sys-keys",
    "TERMINAL_KEY.KEY",
    "key",
    128,
    "1999-04-02 09:00",
  ),
  makeFile(
    "dir-system",
    "sys-lore",
    "ARCHIVE_PROTOCOL.txt",
    "txt",
    8_412,
    "2000-03-11 14:20",
  ),
  makeFile(
    "dir-system-help",
    "sys-help-index",
    "HELP_INDEX.HLP",
    "hlp",
    65_536,
    "1999-04-02 09:00",
  ),
  makeFile(
    "dir-system-help",
    "sys-help-manual",
    "WORKSTATION_MANUAL.txt",
    "txt",
    22_518,
    "1999-04-02 09:00",
  ),
  makeFile(
    "dir-system-help",
    "sys-help-keys",
    "CLEARANCE_KEYS.pdf",
    "pdf",
    41_984,
    "1999-04-02 09:00",
  ),
  makeFile(
    "dir-system-corrupt",
    "sys-corrupt-1",
    "SECTOR_0x1F.txt",
    "txt",
    512,
    "2001-11-14 03:31",
  ),
  makeFile(
    "dir-system-corrupt",
    "sys-corrupt-2",
    "SECTOR_0x2A.txt",
    "txt",
    512,
    "2001-11-14 03:31",
  ),
  makeFile(
    "dir-system-corrupt",
    "sys-corrupt-3",
    "ORPHAN_0x07.bin",
    "bin",
    1_048_576,
    "2001-11-14 03:31",
  ),

  // My Documents: the operator's own drafts plus exports from older terminals.
  makeFile(
    "dir-documents",
    "doc-brief",
    "CASE_BRIEF.pdf",
    "pdf",
    182_400,
    "2003-02-09 09:41",
  ),
  makeFile(
    "dir-documents",
    "doc-draft-1",
    "DRAFT-04_northbound.txt",
    "txt",
    2_118,
    "2003-02-10 14:05",
  ),
  makeFile(
    "dir-documents",
    "doc-draft-2",
    "DRAFT-05_tide_gauge.txt",
    "txt",
    1_774,
    "2003-02-10 16:32",
  ),
  makeFile(
    "dir-documents",
    "doc-work-copy",
    "LOG-002_ORG-B.eml",
    "eml",
    9_216,
    "2001-04-11 15:14",
  ),
  makeFile(
    "dir-documents",
    "doc-export-1",
    "STATION_REPORT_1997.pdf",
    "pdf",
    96_256,
    "1997-09-02 08:00",
  ),
  makeFile(
    "dir-documents",
    "doc-export-2",
    "SITE_PHOTOGRAPH_14.jpg",
    "jpg",
    314_572,
    "1996-05-20 11:15",
  ),
  makeFile(
    "dir-documents",
    "doc-note",
    "READ_ME_FIRST.txt",
    "txt",
    604,
    "2003-01-04 09:12",
  ),
  makeFolder("dir-documents", "dir-work", "My Work", "2003-02-11 08:40", {
    note: "Records and drafts being reviewed.",
  }),
  makeFile(
    "dir-work",
    "wrk-brief",
    "CASE_BRIEF.pdf",
    "pdf",
    182_400,
    "2003-02-09 09:41",
  ),
  makeFile(
    "dir-work",
    "wrk-working",
    "LOG-002_ORG-B.eml",
    "eml",
    9_216,
    "2003-02-11 08:40",
  ),
  makeFile(
    "dir-work",
    "wrk-note",
    "REVIEW_NOTES.txt",
    "txt",
    3_018,
    "2003-02-11 08:12",
  ),

  // Archive: one folder per filed case, each holding its records and evidence.
  makeFolder(
    "dir-archive",
    "case-1283y19",
    "CIRCA-S-1283y19",
    "2003-02-11 07:55",
    { clearance: "LEVEL 4" },
  ),
  makeFolder("dir-archive", "case-00014", "CIRCA-S-00014", "1998-06-02 12:00", {
    clearance: "LEVEL 4",
  }),
  makeFolder("dir-archive", "case-00907", "CIRCA-S-00907", "2007-05-16 09:30", {
    clearance: "LEVEL 4",
  }),
  makeFolder(
    "dir-archive",
    "case-c005102",
    "CIRCA-O-005102",
    "1988-07-04 00:00",
    { clearance: "LEVEL 4" },
  ),
  makeFolder(
    "dir-archive",
    "case-evi035783",
    "EVI-035783",
    "2002-03-15 00:00",
    {
      clearance: "LEVEL 5",
    },
  ),
  makeFolder("dir-archive", "case-d0004", "CIRCA-S-00004", "2003-01-09 15:20", {
    clearance: "LEVEL 3",
  }),

  // CIRCA-S-1283y19, The Black Dog.
  makeFile(
    "case-1283y19",
    "arc-1283-brief",
    "CASE_BRIEF.pdf",
    "pdf",
    128_000,
    "2003-01-09 15:20",
  ),
  makeFile(
    "case-1283y19",
    "arc-1283-00",
    "00_INITIAL_DISCOVERY.pdf",
    "pdf",
    96_256,
    "2003-01-09 15:24",
  ),
  makeFolder(
    "case-1283y19",
    "case-1283-records",
    "Records",
    "2003-01-12 09:00",
  ),
  makeFolder(
    "case-1283y19",
    "case-1283-rumours",
    "Rumours",
    "2003-01-14 10:40",
  ),
  makeFile(
    "case-1283y19",
    "arc-1283-ev1",
    "EVIDENCE_01.jpg",
    "jpg",
    402_944,
    "2003-01-10 13:05",
  ),
  makeFile(
    "case-1283y19",
    "arc-1283-ev2",
    "EVIDENCE_02.png",
    "png",
    288_358,
    "2003-01-10 13:06",
  ),
  makeFile(
    "case-1283y19",
    "arc-1283-fork",
    "FORK_TREE.pdf",
    "pdf",
    54_272,
    "2003-01-15 08:15",
  ),
  makeFile(
    "case-1283-records",
    "arc-1283-log1",
    "LOG-001_ORG-A.pdf",
    "pdf",
    61_440,
    "2003-01-11 09:30",
  ),
  makeFile(
    "case-1283-records",
    "arc-1283-log2",
    "LOG-002_ORG-B.eml",
    "eml",
    9_216,
    "2003-01-11 09:41",
  ),
  makeFile(
    "case-1283-records",
    "arc-1283-log3",
    "LOG-003_ORG-A.pdf",
    "pdf",
    58_368,
    "2003-01-11 10:02",
  ),
  makeFile(
    "case-1283-records",
    "arc-1283-log1f1",
    "LOG-001_ORG-A_F1.pdf",
    "pdf",
    63_488,
    "2003-01-13 11:26",
  ),
  makeFile(
    "case-1283-rumours",
    "arc-1283-rum1",
    "RUM-001.txt",
    "txt",
    1_204,
    "2003-01-14 10:40",
  ),
  makeFile(
    "case-1283-rumours",
    "arc-1283-rum2",
    "RUM-002.txt",
    "txt",
    988,
    "2003-01-14 11:02",
  ),

  // The remaining cases, filed flat: at most two levels inside a case.
  makeFile(
    "case-00014",
    "arc-00014-brief",
    "CASE_BRIEF.pdf",
    "pdf",
    88_064,
    "1998-06-02 12:00",
  ),
  makeFile(
    "case-00014",
    "arc-00014-01",
    "00_INITIAL_DISCOVERY.pdf",
    "pdf",
    74_752,
    "1998-06-02 12:10",
  ),
  makeFile(
    "case-00014",
    "arc-00014-waybill",
    "WAYBILL_COPY_11.pdf",
    "pdf",
    42_496,
    "1998-06-03 08:44",
  ),
  makeFile(
    "case-00014",
    "arc-00014-ev",
    "EVIDENCE_01.jpg",
    "jpg",
    268_288,
    "1998-06-04 16:20",
  ),

  makeFile(
    "case-00907",
    "arc-00907-brief",
    "CASE_BRIEF.pdf",
    "pdf",
    92_160,
    "2007-05-16 09:30",
  ),
  makeFile(
    "case-00907",
    "arc-00907-01",
    "00_INITIAL_DISCOVERY.pdf",
    "pdf",
    81_920,
    "2007-05-16 09:35",
  ),
  makeFile(
    "case-00907",
    "arc-00907-gauge",
    "TIDE_GAUGE_READINGS.pdf",
    "pdf",
    37_888,
    "2007-05-17 07:50",
  ),
  makeFile(
    "case-00907",
    "arc-00907-rum",
    "RUM-004.txt",
    "txt",
    1_442,
    "2007-05-18 19:04",
  ),

  makeFile(
    "case-c005102",
    "arc-c005102-brief",
    "CASE_BRIEF.pdf",
    "pdf",
    64_512,
    "1988-07-04 00:00",
  ),
  makeFile(
    "case-c005102",
    "arc-c005102-file",
    "ORG_DOSSIER.pdf",
    "pdf",
    154_624,
    "1988-07-04 00:00",
  ),
  makeFile(
    "case-c005102",
    "arc-c005102-cont",
    "HOLDINGS_NOTES.txt",
    "txt",
    6_144,
    "1994-02-19 13:00",
  ),

  makeFile(
    "case-evi035783",
    "arc-m0002-brief",
    "CASE_BRIEF.pdf",
    "pdf",
    71_680,
    "2002-03-15 00:00",
  ),
  makeFile(
    "case-evi035783",
    "arc-m0002-trans",
    "AUGUR_LEDGER_FRAGMENT.pdf",
    "pdf",
    112_640,
    "2002-03-15 00:00",
  ),
  makeFile(
    "case-evi035783",
    "arc-m0002-note",
    "COLD_STORAGE_NOTE.txt",
    "txt",
    1_088,
    "2002-03-15 00:00",
  ),

  makeFile(
    "case-d0004",
    "arc-d0004-brief",
    "CASE_BRIEF.pdf",
    "pdf",
    83_968,
    "2003-01-09 15:20",
  ),
  makeFile(
    "case-d0004",
    "arc-d0004-log",
    "LOG-004_ORG-C.pdf",
    "pdf",
    49_152,
    "2003-01-09 15:44",
  ),
  makeFile(
    "case-d0004",
    "arc-d0004-wav",
    "EVIDENCE_03.wav",
    "wav",
    2_097_152,
    "2003-01-10 08:02",
  ),
  makeFile(
    "case-d0004",
    "arc-d0004-lnk",
    "CASE_SHORTCUT.lnk",
    "lnk",
    1_024,
    "2003-01-10 08:30",
  ),

  // Organizations: dossiers, explorations, and superseded revisions.
  makeFolder(
    "dir-organizations",
    "org-c005102",
    "ORG-C-005102",
    "1988-07-04 00:00",
    { clearance: "LEVEL 4" },
  ),
  makeFolder(
    "dir-organizations",
    "org-a001044",
    "ORG-A-001044",
    "1996-02-08 00:00",
    { clearance: "LEVEL 3" },
  ),
  makeFolder(
    "dir-organizations",
    "org-b007331",
    "ORG-B-007331",
    "2001-11-02 00:00",
    { clearance: "LEVEL 3" },
  ),
  makeFolder(
    "dir-organizations",
    "org-c005108",
    "ORG-C-005108",
    "1997-06-30 00:00",
    { clearance: "LEVEL 3" },
  ),
  makeFolder(
    "dir-organizations",
    "org-u000001",
    "ORG-U-000001",
    "1974-01-01 00:00",
    { clearance: "LEVEL 5" },
  ),
  makeFile(
    "org-c005102",
    "org-c005102-dossier",
    "DOSSIER.pdf",
    "pdf",
    154_624,
    "1988-07-04 00:00",
  ),
  makeFile(
    "org-c005102",
    "org-c005102-prov",
    "PROVENANCE.txt",
    "txt",
    4_096,
    "1988-07-04 00:00",
  ),
  makeFile(
    "org-c005102",
    "org-c005102-1994",
    "EXPLORATION_1994.pdf",
    "pdf",
    88_064,
    "1994-02-19 13:00",
  ),
  makeFile(
    "org-c005102",
    "org-c005102-2002",
    "EXPLORATION_2002.pdf",
    "pdf",
    91_136,
    "2002-08-30 10:15",
  ),
  makeFile(
    "org-a001044",
    "org-a001044-dossier",
    "DOSSIER.pdf",
    "pdf",
    138_240,
    "1996-02-08 00:00",
  ),
  makeFile(
    "org-a001044",
    "org-a001044-cont",
    "EXPLORATION_2001.pdf",
    "pdf",
    76_800,
    "2001-03-14 09:00",
  ),
  makeFile(
    "org-b007331",
    "org-b007331-dossier",
    "DOSSIER.pdf",
    "pdf",
    112_640,
    "2001-11-02 00:00",
  ),
  makeFile(
    "org-b007331",
    "org-b007331-cont",
    "EXPLORATION_2002.pdf",
    "pdf",
    68_608,
    "2002-12-04 16:45",
  ),
  makeFile(
    "org-c005108",
    "org-c005108-dossier",
    "DOSSIER.pdf",
    "pdf",
    121_856,
    "1997-06-30 00:00",
  ),
  makeFile(
    "org-c005108",
    "org-c005108-superseded",
    "DOSSIER_1996_SUPERSEDED.pdf",
    "pdf",
    118_784,
    "1996-04-02 00:00",
  ),
  makeFile(
    "org-u000001",
    "org-u000001-dossier",
    "DOSSIER_SEALED.pdf",
    "pdf",
    24_576,
    "1974-01-01 00:00",
  ),

  // Recycle Bin: recoverable for thirty days, not yet disposed of.
  makeFile(
    "dir-recycle",
    "rec-draft-3",
    "DRAFT-03_freight_car.txt",
    "txt",
    1_530,
    "2003-02-02 11:20",
  ),
  makeFile(
    "dir-recycle",
    "rec-scan",
    "SCAN_ATTEMPT_04.jpg",
    "jpg",
    196_608,
    "2003-02-05 09:15",
  ),
  makeFile(
    "dir-recycle",
    "rec-log",
    "LOG-009_ORG-D.pdf",
    "pdf",
    44_032,
    "2003-02-07 17:48",
  ),
  makeFile(
    "dir-recycle",
    "rec-note",
    "SCRAP_NOTE.txt",
    "txt",
    256,
    "2003-02-09 11:30",
  ),
];

export const FILE_TREE: readonly FileNode[] = NODES;

/**
 * Extension table: catalog key for the type name, and the artwork.
 *
 * The key rather than the word: the Type column and the status bar print these
 * in the reader's language, and the index is not allowed to know what language
 * that is. A file whose extension has no entry falls back to `typeUnregisteredFile`.
 */
export const FILE_TYPES: Record<string, { key: string; icon: string }> = {
  pdf: { key: "typeRecordDocument", icon: "document-0" },
  eml: { key: "typeFiledEmail", icon: "message_envelope_open-0" },
  txt: { key: "typeTextNote", icon: "file_lines-0" },
  jpg: { key: "typeEvidencePhotograph", icon: "image_old_jpeg-0" },
  png: { key: "typeEvidencePhotograph", icon: "image_old_jpeg-0" },
  wav: { key: "typeAudioEvidence", icon: "media_player_file-0" },
  lnk: { key: "typeShortcut", icon: "search_directory-0" },
  com: { key: "typeCommandProgram", icon: "console_prompt-0" },
  bat: { key: "typeBatchFile", icon: "file_gears-0" },
  sys: { key: "typeSystemFile", icon: "file_gears-0" },
  hlp: { key: "typeHelpFile", icon: "help_book_big-0" },
  spl: { key: "typeSystemSplash", icon: "file_gears-0" },
  key: { key: "typeKeyMaterial", icon: "file_padlock" },
  bin: { key: "typeUnreadableBinary", icon: "file_question" },
};

/** Folder artwork: closed, open, and the two special cases the archive needs. */
export const FOLDER_ICONS = {
  closed: "directory_closed-0",
  open: "directory_open_cool-0",
  archive: "directory_open_cabinet_fc-2",
  drive: "hard_disk_drive-2",
  recycle: "recycle_bin_empty-4",
  expunged: "erase_file-0",
  system: "console_prompt-0",
  work: "notepad-2",
} as const;

/**
 * The scopes the desktop can open. My Documents and My Work share a root but
 * differ in root: My Work is the working set, rooted one level deeper, so the
 * same component serves a container and a filtered view of the same store.
 */
export const SCOPES: readonly FileScope[] = [
  /*
   * My Computer opens at the volume rather than at the root above it. A root
   * whose only child is a closed drive is a shortcut, not a machine, and opening
   * one level down means the pane and the listing always agree about where the
   * window is instead of the pane showing a folder the listing is not.
   */
  {
    id: "my-pc",
    titleKey: "placeMyComputer",
    rootId: "pc-drive",
    summaryKey: "summaryMyComputer",
    reference: "CIRCA-OS 4.12",
  },
  { id: "records", titleKey: "placeMyDocuments", rootId: "dir-documents" },
  { id: "my-work", titleKey: "placeMyWork", rootId: "dir-work" },
  {
    id: "archive",
    titleKey: "placeArchive",
    rootId: "dir-archive",
    reference: "LN-POLICY-12",
  },
  {
    id: "organizations",
    titleKey: "placeOrganizations",
    rootId: "dir-organizations",
    reference: "LN-POLICY-12",
  },
  {
    id: "system",
    titleKey: "placeSystemFiles",
    rootId: "dir-system",
    reference: "CIRCA-OS 4.12",
  },
  {
    id: "recycle",
    titleKey: "placeRecycleBin",
    rootId: "dir-recycle",
    reference: "LN-POLICY-19",
  },
  {
    id: "expunged",
    titleKey: "placeExpunged",
    rootId: "dir-expunged",
    summaryKey: "summaryExpunged",
    reference: "LN-POLICY-22",
  },
];

export function scopeById(id: string): FileScope | undefined {
  return SCOPES.find((scope) => scope.id === id);
}

/** The scope's destination name in the reader's language. */
export function scopeTitle(scope: FileScope, t: FileTranslate): string {
  return t(scope.titleKey);
}

/** The scope's own status line, or undefined when it counts its contents instead. */
export function scopeSummary(
  scope: FileScope,
  t: FileTranslate,
): string | undefined {
  return scope.summaryKey ? t(scope.summaryKey) : undefined;
}

/* ------------------------------------------------------------------------- */
/* Lookups                                                                    */
/* ------------------------------------------------------------------------- */

export function nodeById(
  id: string,
  tree: readonly FileNode[] = FILE_TREE,
): FileNode | undefined {
  return tree.find((node) => node.id === id);
}

/** Direct contents, in stored order. Ordering is the caller's decision. */
export function childrenOf(
  id: string,
  tree: readonly FileNode[] = FILE_TREE,
): FileNode[] {
  return tree.filter((node) => node.parent === id);
}

export function folderCounts(
  id: string,
  tree: readonly FileNode[] = FILE_TREE,
): { folders: number; files: number } {
  const children = childrenOf(id, tree);
  return {
    folders: children.filter(isFolder).length,
    files: children.filter((node) => !isFolder(node)).length,
  };
}

/** Ancestors from the root down; does not include the node itself. */
export function pathOf(
  id: string,
  tree: readonly FileNode[] = FILE_TREE,
): string[] {
  const path: string[] = [];
  let current = nodeById(id, tree);
  while (current?.parent) {
    path.unshift(current.parent);
    current = nodeById(current.parent, tree);
  }
  return path;
}

/** The full chain including the node, which is what the address bar prints. */
export function breadcrumbOf(
  id: string,
  tree: readonly FileNode[] = FILE_TREE,
): FileNode[] | undefined {
  const node = nodeById(id, tree);
  if (!node) return undefined;
  return [
    ...pathOf(id, tree)
      .map((parent) => nodeById(parent, tree))
      .filter((item): item is FileNode => item !== undefined),
    node,
  ];
}

/** True when `id` is `rootId` or sits anywhere beneath it. */
export function isWithin(
  id: string,
  rootId: string,
  tree: readonly FileNode[] = FILE_TREE,
): boolean {
  if (id === rootId) return true;
  const path = pathOf(id, tree);
  return path.includes(rootId);
}

/** The address bar's text: backslash-joined names, the way a 1998 field showed a path. */
export function addressOf(
  id: string,
  tree: readonly FileNode[] = FILE_TREE,
): string {
  return (breadcrumbOf(id, tree) ?? []).map((node) => node.name).join("\\");
}

export function fileTypeOf(node: IconTarget, t: FileTranslate): string {
  if (isFolder(node)) return t("typeFileFolder");
  const type = node.ext ? FILE_TYPES[node.ext] : undefined;
  return type ? t(type.key) : t("typeUnregisteredFile");
}

/** Type plus extension, as the status bar and the details type column print it. */
export function describeNode(
  node: FileNode,
  t: FileTranslate,
  tree: readonly FileNode[] = FILE_TREE,
): string {
  const label = fileTypeOf(node, t);
  if (!isFolder(node)) return `${label} (${node.ext.toUpperCase()})`;
  return childrenOf(node.id, tree).length === 0
    ? `${label} (${t("emptyLabel")})`
    : label;
}

/** The summary a folder shows in place of a size, since a folder has none. */
export function countLabel(
  id: string,
  t: FileTranslate,
  tree: readonly FileNode[] = FILE_TREE,
): string {
  const { folders, files } = folderCounts(id, tree);
  if (folders + files === 0) return t("emptyLabel");
  const parts: string[] = [];
  if (files > 0)
    parts.push(t(files === 1 ? "countFile" : "countFiles", { count: files }));
  if (folders > 0)
    parts.push(
      t(folders === 1 ? "countFolder" : "countFolders", { count: folders }),
    );
  return parts.join(", ");
}

/** Whole kilobytes under a megabyte, one decimal above it: what a 1998 listing showed. */
export function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  // A file with anything in it is never shown as 0 KB, which is what a listing
  // that printed whole kilobytes did to a 400-byte draft.
  return `${bytes === 0 ? 0 : Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function formatModified(node: FileNode): string {
  return isFolder(node) ? node.opened : node.modified;
}

/* ------------------------------------------------------------------------- */
/* Ordering and selection                                                     */
/* ------------------------------------------------------------------------- */

const SORT_KEY_LABELS: Record<FileSortKey, string> = {
  name: "Name",
  type: "Type",
  size: "Size",
  modified: "Modified",
};

export const SORT_KEYS: readonly FileSortKey[] = [
  "name",
  "type",
  "size",
  "modified",
];

export function sortKeyLabel(key: FileSortKey): string {
  return SORT_KEY_LABELS[key];
}

/**
 * Orders one level of a listing. Folders stay ahead of files in every key and
 * both directions, which is what makes a details listing read the way Explorer's
 * did; the three views without column headers keep the stored order instead.
 *
 * Sorting by type compares the printed type name, so the order follows the
 * language the reader is using rather than an English table hidden in the index.
 */
export function sortNodes(
  nodes: readonly FileNode[],
  key: FileSortKey,
  direction: SortDirection,
  view: FileView,
  t: FileTranslate,
  tree: readonly FileNode[] = FILE_TREE,
): FileNode[] {
  if (view !== "details") return [...nodes];
  const sign = direction === "ascending" ? 1 : -1;
  const byName = (a: FileNode, b: FileNode) => a.name.localeCompare(b.name);
  return [...nodes].sort((a, b) => {
    if (isFolder(a) !== isFolder(b)) return isFolder(a) ? -1 : 1;
    let result = 0;
    if (key === "name") result = byName(a, b);
    else if (key === "type")
      result = fileTypeOf(a, t).localeCompare(fileTypeOf(b, t)) || byName(a, b);
    else if (key === "size")
      result =
        (isFolder(a) ? folderCounts(a.id, tree).files : a.size) -
          (isFolder(b) ? folderCounts(b.id, tree).files : b.size) ||
        byName(a, b);
    else
      result =
        formatModified(a).localeCompare(formatModified(b)) || byName(a, b);
    return result * sign;
  });
}

/**
 * The one-level selection state the header checkbox shows. A folder is checked
 * only when every node beneath it is selected, unchecked when none is, and mixed
 * in between; a node is always checked on its own selection.
 */
export function selectionState(
  id: string,
  selected: readonly string[],
  tree: readonly FileNode[] = FILE_TREE,
): "checked" | "unchecked" | "mixed" {
  if (selected.includes(id)) return "checked";
  // The branch is what sits under the folder, not the folder itself: an empty
  // folder has an empty branch, so it reads unchecked until it is chosen.
  const below = tree.filter(
    (node) => node.id !== id && isWithin(node.id, id, tree),
  );
  // An empty folder has nothing to report on, so it is unchecked until chosen.
  if (below.length === 0) return "unchecked";
  if (below.every((node) => selected.includes(node.id))) return "checked";
  return below.some((node) => selected.includes(node.id))
    ? "mixed"
    : "unchecked";
}

/** Every node under a folder, including the folder itself. */
export function subtreeOf(
  id: string,
  tree: readonly FileNode[] = FILE_TREE,
): FileNode[] {
  return tree.filter((node) => isWithin(node.id, id, tree));
}

/** The listing's own selection labels, uppercased for the status bar. */
export function selectionSummary(
  selected: readonly string[],
  tree: readonly FileNode[] = FILE_TREE,
): string {
  const nodes = selected
    .map((id) => nodeById(id, tree))
    .filter((node): node is FileNode => node !== undefined);
  if (nodes.length === 0) return "";
  const folders = nodes.filter(isFolder).length;
  const files = nodes.length - folders;
  const parts: string[] = [];
  if (folders > 0) parts.push(`${folders} folder${folders === 1 ? "" : "s"}`);
  if (files > 0) parts.push(`${files} file${files === 1 ? "" : "s"}`);
  return `Selected: ${parts.join(", ")}`;
}
