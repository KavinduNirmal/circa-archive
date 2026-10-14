import { ARCHIVE_INDEX, CLASS_LABELS, STATUS_LABELS, type ArchiveClass, type ArchiveEntry } from "../browser/archive-index";

/**
 * The facts the project half of the landing page publishes, and the editorial
 * furniture around them.
 *
 * Everything checkable here is checked: `tests/site-meta.test.ts` reads the
 * manifests for versions and commands, the checkout for document and folder
 * paths, the README for the status line, and the archive index for every record
 * the page shows. The fiction lives in `terminal-copy.ts`; this file never
 * speaks in the institution's voice.
 */

export type Track = {
  /** Also the section id and the anchor the contents list points at. */
  id: "writers" | "developers";
  index: string;
  title: string;
  /** What this track is about, in three or four words. */
  kicker: string;
  lead: string;
};

export type WriterFiling = {
  id: string;
  klass: ArchiveClass;
  /** A worked example that the archive index really resolves. */
  code: string;
  title: string;
  note: string;
};

export type WriterRule = { id: string; title: string; note: string };
export type WriterStep = { index: string; title: string; note: string };
export type BuilderStep = { id: string; title: string; note: string; commands: readonly string[] };
export type StackRow = { key: string; value: string; state: "shipped" | "planned" };
export type LayoutRow = { path: string; purpose: string };
export type CommandRef = { id: string; text: string; note: string; cwd?: string };
export type DocumentRow = { id: string; path: string; decides: string };

export const PROJECT = {
  name: "CIRCA Archive",
  commission: "Commission for Incident Review and Corrective Action",
  status: "Pre-production",
  license: "MIT",
  doctrine: "CIRCA does not decide truth. It decides what's on file.",
} as const;

/** The line between the two movements, said out loud rather than implied. */
export const HINGE = {
  label: "End of archive preview",
  line: "Everything above this line belongs to the fiction. Everything below it is the project itself: what it is made of, and how to add to it.",
} as const;

export const BRIEF = {
  title: "Project brief",
  lead: "CIRCA Archive is open source and in pre-production. Two kinds of contributor are needed, and they need different things from this page, so the brief is divided in two.",
  contentsLabel: "Two tracks",
  stackLabel: "Stack",
  layoutLabel: "Where things live",
  loopLabel: "The way in",
  documentsLabel: "Documents",
} as const;

export const TRACKS: readonly Track[] = [
  {
    id: "writers",
    index: "A",
    title: "Writers",
    kicker: "Fiction and canon",
    lead: "You file the records the archive is about: incidents that should not have happened, dossiers on the bodies that file them, and continuities that carry someone else's telling forward.",
  },
  {
    id: "developers",
    index: "B",
    title: "Developers",
    kicker: "Interface and services",
    lead: "You build the machine that holds those records: the workstation at /desktop and, later, the services behind it. The interface runs today over fixture indexes. The backend does not exist yet.",
  },
];

export const WRITER_FILINGS: readonly WriterFiling[] = [
  {
    id: "incident",
    klass: "incident",
    code: "INC-00042",
    title: "Incident",
    note: "Something happened that the record cannot account for. The entry carries what was filed and nothing that was not.",
  },
  {
    id: "organization",
    klass: "organization",
    code: "ORG-C-005102",
    title: "Organization",
    note: "A body that files the phenomenon in its own language. Organizations are entities, not users: nobody owns one and nobody speaks for it.",
  },
  {
    id: "continuity",
    klass: "continuity",
    code: "ORG-C-005102/C1",
    title: "Continuity",
    note: "A second telling that keeps the earlier filings rather than replacing them. Branches are forked in the open and both stay readable.",
  },
];

export const WRITER_RULES: readonly WriterRule[] = [
  {
    id: "original",
    title: "Original work only",
    note: "Do not copy reference fiction, artwork, or assets into the archive. The setting is its own, and it borrows no one else's vocabulary.",
  },
  {
    id: "vocabulary",
    title: "Keep the vocabulary",
    note: "Incidents, records, organizations, continuities, and tombstones are the fixed terms. Codes are stable and are displayed as written.",
  },
  {
    id: "entities",
    title: "Organizations are entities",
    note: "No accounts, no handlers, no gatekeeping. An organization is the aggregate of what has been written about it, which is why a single incident reads differently under each lens.",
  },
  {
    id: "erased",
    title: "Erased is not deleted",
    note: "A rejected organization loses its code and keeps its records. They stay readable as rumors, and the entries written while it was erased stay linked to it.",
  },
  {
    id: "coherence",
    title: "Coherence is the only authority",
    note: "Votes are advisory signals. What decides a submission is whether the brief is consistent, the voice is distinct, and the seed contradicts nothing already on file.",
  },
];

export const WRITER_STEPS: readonly WriterStep[] = [
  {
    index: "1",
    title: "Read the source of truth",
    note: "The project context holds the direction, the mechanics, and the open questions. Write inside it, or argue with it in the open before writing around it.",
  },
  {
    index: "2",
    title: "Propose before you plant",
    note: "A new organization needs a brief, a short sample in its voice, and a seed incident. Anything that changes a mechanic needs a proposal first, so the shape settles before the prose does.",
  },
  {
    index: "3",
    title: "File the record",
    note: "Settings and canon land in the lore folder; the records themselves are written in the workstation and rendered as paper. An entry is filed once and is not rewritten afterwards.",
  },
];

export const BUILDER_STEPS: readonly BuilderStep[] = [
  {
    id: "install",
    title: "Install the toolchain",
    note: "Bun 1.3.14 drives the root tooling and the interface, and they keep separate dependency trees. Use the frozen lockfile so the versions you test are the versions everyone else gets.",
    commands: ["install", "client-install", "prepare"],
  },
  {
    id: "serve",
    title: "Serve the workstation",
    note: "The interface runs on port 3001 with nothing behind it. Every screen reads from the fixture index it ships with, which is why an empty state here means a missing fixture and not a failed request.",
    commands: ["dev"],
  },
  {
    id: "branch",
    title: "Work one change at a time",
    note: "Fork, then cut one focused branch. A pull request that does one coherent thing is reviewed faster, and it can be reverted on its own.",
    commands: ["branch"],
  },
  {
    id: "test",
    title: "Write the test first",
    note: "Behaviour changes start as a failing test: red, then green, then refactor. Prioritise authorization, lifecycle transitions, vote uniqueness, and visibility, because those are the rules a plausible-looking change can still break.",
    commands: ["test", "client-test"],
  },
  {
    id: "verify",
    title: "Run the checks you claim to have run",
    note: "The hooks validate staged folder READMEs, whitespace, the tooling tests, and the interface checks. Report exactly what you verified and name anything that could not run.",
    commands: ["check", "precommit"],
  },
  {
    id: "document",
    title: "Document the folder you touched",
    note: "Every authored folder carries a README describing its responsibility, structure, boundaries, and usage, staged with the code that needs it. Generated folders are excluded.",
    commands: [],
  },
];

export const STACK: readonly StackRow[] = [
  { key: "Interface", value: "Next.js 16.4.0, React 19.3.1, Tailwind 4", state: "shipped" },
  { key: "Runtimes", value: "Bun 1.3.14, Node 20.9.0 or newer", state: "shipped" },
  { key: "Records", value: "Markdown rendered as paper, never as files", state: "shipped" },
  { key: "Checks", value: "Vitest 5 with Testing Library, Playwright smoke", state: "shipped" },
  { key: "Services", value: ".NET 10 Minimal APIs", state: "planned" },
  { key: "Data", value: "PostgreSQL through EF Core", state: "planned" },
  { key: "Live updates", value: "SignalR", state: "planned" },
  { key: "Evidence", value: "S3-compatible object storage", state: "planned" },
];

export const LAYOUT: readonly LayoutRow[] = [
  { path: "client/", purpose: "The workstation: every screen a record is read or written in." },
  { path: "backend/", purpose: "Reserved for the API, persistence, and live updates." },
  { path: "admin/", purpose: "Reserved for administration tooling." },
  { path: "docs/lore/", purpose: "Reserved for setting documentation and organization canon." },
  { path: ".agents/", purpose: "Product context, the design specification, and agent policy." },
  { path: "scripts/", purpose: "Repository checks, including the README coverage rule." },
  { path: "tests/", purpose: "The Bun tests that cover the repository tooling." },
  { path: ".github/", purpose: "Issue templates and the pull request template." },
  { path: ".husky/", purpose: "The pre-commit checks that run before every commit." },
];

export const COMMANDS: readonly CommandRef[] = [
  { id: "install", text: "bun install --frozen-lockfile", note: "Root tooling, once per checkout." },
  {
    id: "client-install",
    text: "bun install --frozen-lockfile",
    cwd: "client/",
    note: "The interface keeps its own dependency tree.",
  },
  { id: "prepare", text: "bun run prepare", note: "Installs the Git hooks." },
  { id: "dev", text: "bun run --cwd=client dev", note: "Serves the workstation on port 3001." },
  { id: "branch", text: "git switch -c feat/record-editor", note: "One coherent change per branch." },
  { id: "test", text: "bun run test", note: "The repository tooling tests." },
  { id: "client-test", text: "bun run --cwd=client test", note: "The interface tests, once, in jsdom." },
  { id: "check", text: "bun run check", note: "Confirms every authored folder has its README." },
  { id: "precommit", text: "bun run precommit", note: "Everything the hooks run, on demand." },
];

export function commandById(id: string): CommandRef | undefined {
  return COMMANDS.find((command) => command.id === id);
}

export const DOCUMENTS: readonly DocumentRow[] = [
  { id: "readme", path: "README.md", decides: "Scope, status, and the principles the archive runs on." },
  { id: "contributing", path: "CONTRIBUTING.md", decides: "Local workflow, verification, and review expectations." },
  { id: "conduct", path: "CODE_OF_CONDUCT.md", decides: "How contributors are expected to treat each other." },
  { id: "security", path: "SECURITY.md", decides: "Where to report a vulnerability, privately." },
  { id: "architecture", path: "ARCHITECTURE.md", decides: "Draft services, schema, and API contracts." },
  { id: "agents", path: "AGENTS.md", decides: "Repository rules for agent-assisted work." },
  {
    id: "context",
    path: ".agents/brain/PROJECT_CONTEXT.md",
    decides: "Product direction, story mechanics, and open questions.",
  },
  { id: "design", path: ".agents/brain/DESIGN.md", decides: "The CIRCA/OS visual language and interface rules." },
  { id: "rules", path: ".agents/rules/README.md", decides: "Engineering, testing, and documentation policy." },
  {
    id: "publishing",
    path: "docs/OPEN_SOURCE_CHECKLIST.md",
    decides: "Preparation required before the repository is published.",
  },
  { id: "license", path: "LICENSE", decides: "MIT terms for the code and the documentation." },
  { id: "client", path: "client/README.md", decides: "Interface setup, commands, and the screen inventory." },
];

/**
 * The terminal shows the index rather than a description of it, so every record
 * on the page is a real entry from the same fixture the browser files. A code
 * that stops resolving fails the metadata test instead of quietly disappearing.
 */
const FILING_CODES = ["INC-00014", "INC-00042", "INC-00118", "INC-00204", "ORG-A-020748", "CIRCA-M-0002"] as const;

function resolveFiling(code: string): ArchiveEntry {
  const entry = ARCHIVE_INDEX.find((item) => item.code === code);
  if (!entry) throw new Error(`the archive index no longer files ${code}`);
  return entry;
}

export const FILINGS: readonly ArchiveEntry[] = FILING_CODES.map(resolveFiling);

/** Bodies the index files under, in archive order. */
export const ORGANIZATIONS: readonly ArchiveEntry[] = ARCHIVE_INDEX.filter(
  (entry) => entry.klass === "organization",
);

export const SPECIMEN = resolveFiling("INC-00042");

export function classLabel(entry: ArchiveEntry): string {
  return CLASS_LABELS[entry.klass];
}

export function statusLabel(entry: ArchiveEntry): string {
  return STATUS_LABELS[entry.status];
}
