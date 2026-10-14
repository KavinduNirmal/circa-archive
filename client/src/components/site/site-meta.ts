import { ARCHIVE_INDEX, CLASS_LABELS, STATUS_LABELS } from "../browser/archive-index";

/**
 * The facts the public landing page publishes about this repository.
 *
 * Every value here is checkable against something that already exists: a
 * manifest, a file in the checkout, the README's own status line, or the archive
 * index the browser files. `tests/site-meta.test.ts` does that checking, so the
 * landing page cannot quietly drift into advertising a project that is not there.
 */

export type SiteSection = {
  id: string;
  /** Zero-padded reading order, drawn beside the title as an index. */
  index: string;
  title: string;
  /** Shorter label for the top navigation. */
  nav: string;
  standfirst: string;
};

export type CommunityRole = {
  id: string;
  index: string;
  title: string;
  discipline: string;
  work: string;
  /** The place in the checkout where this work lands. */
  path: string;
};

export type StackRow = {
  key: string;
  value: string;
  /** `planned` means nothing exists yet, and the page must say so. */
  state: "shipped" | "planned";
};

export type LayoutRow = { path: string; purpose: string };

export type CommandRef = {
  id: string;
  text: string;
  note: string;
  /** Set when the command has to run inside a subdirectory. */
  cwd?: string;
};

export type ContributionStep = {
  id: string;
  index: string;
  title: string;
  body: string;
  commands: readonly string[];
};

export type DocumentRow = {
  id: string;
  path: string;
  decides: string;
};

export type ProjectFigure = { key: string; value: string };

export const PROJECT = {
  name: "CIRCA Archive",
  commission: "Commission for Incident Review and Corrective Action",
  system: "CIRCA/OS 4.12",
  terminal: "Public intake terminal",
  status: "Pre-production",
  license: "MIT",
  summary: "A collaborative ghost-story archive presented as a fictional desktop workstation.",
  thesis:
    "Anyone can file an incident, an organization dossier, or a continuity. The archive keeps them in one shared universe, renders every record as paper, and lets a fictional workstation be the only way in. The code that builds that workstation is open, and the specification is still being argued over.",
  doctrine: "CIRCA does not decide truth. It decides what's on file.",
  access: "No account required",
} as const;

/** The public docket, drawn beside the wordmark. */
export const FIGURES: readonly ProjectFigure[] = [
  { key: "Status", value: PROJECT.status },
  { key: "Build", value: PROJECT.system },
  { key: "Interface", value: "Next.js 16.4" },
  { key: "Runtimes", value: "Bun 1.3.14" },
  { key: "Licence", value: PROJECT.license },
  { key: "Access", value: PROJECT.access },
];

export const SECTIONS: readonly SiteSection[] = [
  {
    id: "community",
    index: "01",
    title: "Community",
    nav: "Community",
    standfirst: "Who keeps the archive, and where each kind of work lands.",
  },
  {
    id: "record",
    index: "02",
    title: "The record",
    nav: "The record",
    standfirst: "What a contribution is made of, and what the archive does with it.",
  },
  {
    id: "project",
    index: "03",
    title: "Project record",
    nav: "Meta",
    standfirst: "Status, stack, and repository layout, as they stand today.",
  },
  {
    id: "contribute",
    index: "04",
    title: "Contributing",
    nav: "Contribute",
    standfirst: "From an empty checkout to a merged pull request.",
  },
  {
    id: "documents",
    index: "05",
    title: "Documents",
    nav: "Documents",
    standfirst: "The papers that decide how this project works.",
  },
];

/**
 * Six ways in, ordered by how much of the project already exists for them. The
 * last two keep the first four honest, which is why they are not extras.
 */
export const ROLES: readonly CommunityRole[] = [
  {
    id: "writers",
    index: "01",
    title: "Record writers",
    discipline: "Fiction",
    work:
      "File incidents, organization dossiers, and continuities in your own voice. Original work only: the archive has its own language, and it does not borrow anyone else's.",
    path: "docs/lore/",
  },
  {
    id: "engineers",
    index: "02",
    title: "Interface engineers",
    discipline: "Frontend",
    work:
      "Build the workstation screens: the archive browser, the mail client, the file browser, and the record editor. Each one is a window in the same machine.",
    path: "client/",
  },
  {
    id: "services",
    index: "03",
    title: "Service engineers",
    discipline: "Backend",
    work:
      "Bring the planned API, persistence, and live updates to life. Nothing here is running yet, so the contracts in the architecture draft are still open to challenge.",
    path: "backend/",
  },
  {
    id: "design",
    index: "04",
    title: "Interface designers",
    discipline: "Design",
    work:
      "Extend the CIRCA/OS visual language: bevels, phosphor, and paper. The specification is written down, and every deviation has to earn its place in it.",
    path: ".agents/brain/DESIGN.md",
  },
  {
    id: "review",
    index: "05",
    title: "Reviewers",
    discipline: "Coherence",
    work:
      "Check a filing against established canon, and check the code against the lifecycle, visibility, and authorization rules that keep the archive consistent.",
    path: ".agents/rules/README.md",
  },
  {
    id: "docs",
    index: "06",
    title: "Documentarians",
    discipline: "Documentation",
    work:
      "Keep the specifications, the folder READMEs, and the contributor guidance true to the code as it changes. Documentation is reviewed like code here.",
    path: "CONTRIBUTING.md",
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
    note: "The frontend keeps its own dependency tree and lockfile.",
  },
  { id: "prepare", text: "bun run prepare", note: "Installs the Git hooks." },
  { id: "dev", text: "bun run --cwd=client dev", note: "Serves the workstation on port 3001." },
  { id: "branch", text: "git switch -c feat/record-editor", note: "One coherent change per branch." },
  { id: "check", text: "bun run check", note: "Confirms every authored folder has its README." },
  { id: "test", text: "bun run test", note: "The repository tooling tests." },
  { id: "client-test", text: "bun run --cwd=client test", note: "The interface tests, once, in jsdom." },
  { id: "client-checks", text: "bun run check:client", note: "Frontend lint, typecheck, and tests together." },
  { id: "precommit", text: "bun run precommit", note: "Everything the hooks run, on demand." },
];

export function commandById(id: string): CommandRef | undefined {
  return COMMANDS.find((command) => command.id === id);
}

export const STEPS: readonly ContributionStep[] = [
  {
    id: "read",
    index: "01",
    title: "Read the record first",
    body:
      "The project direction, the design specification, and the architecture draft are all written down. Read the ones your change touches before you plan it, then say which of them your change obeys or overturns.",
    commands: [],
  },
  {
    id: "propose",
    index: "02",
    title: "Say what you intend",
    body:
      "Open an issue for architecture, dependency, or story-mechanic changes and let the shape settle before you build it. Spelling corrections and small documentation fixes can go straight to a pull request.",
    commands: [],
  },
  {
    id: "branch",
    index: "03",
    title: "Branch from a fork",
    body:
      "Fork the repository, then cut one focused branch. A pull request that does one coherent thing is reviewed faster than one that does five, and it can be reverted on its own.",
    commands: ["branch"],
  },
  {
    id: "install",
    index: "04",
    title: "Install the toolchain",
    body:
      "Bun 1.3.14 drives both the root tooling and the frontend. Use the frozen lockfile so the versions you test are the versions everyone else gets.",
    commands: ["install", "client-install", "prepare"],
  },
  {
    id: "test-first",
    index: "05",
    title: "Write the test first",
    body:
      "Behaviour changes start with a failing test: red, then green, then refactor. Prioritise authorization, lifecycle transitions, vote uniqueness, and visibility, because those are the rules a plausible-looking change can still break.",
    commands: ["test", "client-test"],
  },
  {
    id: "verify",
    index: "06",
    title: "Run the checks you claim to have run",
    body:
      "The hooks validate staged folder READMEs, whitespace, the tooling tests, and the frontend checks. Run them yourself before you push, and report exactly what you verified rather than asserting that it passes.",
    commands: ["check", "client-checks", "precommit"],
  },
  {
    id: "document",
    index: "07",
    title: "Document the folder you touched",
    body:
      "Every authored folder carries a README that explains its responsibility, structure, boundaries, and usage. Stage it with the code in the same commit. Generated folders are excluded.",
    commands: [],
  },
  {
    id: "file",
    index: "08",
    title: "File the pull request",
    body:
      "Complete the template: the problem, the resulting behaviour, the related issue or specification, and your verification. Interface changes need screenshots, and migration or configuration changes need their notes.",
    commands: [],
  },
];

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
  { id: "client", path: "client/README.md", decides: "Frontend setup, commands, and the screen inventory." },
];

/**
 * The specimen on the landing page is the archive browser's own filing, so the
 * example a visitor reads is the same one the workstation returns for that code.
 */
const specimenCode = "INC-00042";

function findSpecimen() {
  const entry = ARCHIVE_INDEX.find((item) => item.code === specimenCode);
  if (!entry) throw new Error(`the archive index no longer files ${specimenCode}`);
  return entry;
}

const specimen = findSpecimen();

export const SPECIMEN = {
  code: specimen.code,
  designation: specimen.designation,
  abstract: specimen.abstract,
  filed: specimen.filed,
  organization: specimen.organization,
  clearance: specimen.clearance,
  classLabel: CLASS_LABELS[specimen.klass],
  statusLabel: STATUS_LABELS[specimen.status],
  status: specimen.status,
} as const;
