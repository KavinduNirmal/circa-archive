import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ARCHIVE_CLASSES, ARCHIVE_INDEX, CLASS_LABELS } from "@/components/browser/archive-index";
import { TERMINAL } from "@/components/site/terminal-copy";
import {
  BRIEF,
  BUILDER_STEPS,
  COMMANDS,
  DOCUMENTS,
  FILINGS,
  HINGE,
  LAYOUT,
  ORGANIZATIONS,
  PROJECT,
  SPECIMEN,
  STACK,
  TRACKS,
  WRITER_FILINGS,
  WRITER_RULES,
  WRITER_STEPS,
  commandById,
} from "@/components/site/site-meta";

/**
 * The page makes two kinds of claim: what the fiction says (which is the
 * author's business) and what the repository is (which is checkable). Every
 * checkable claim is checked here against the file that owns it, so the page
 * cannot drift from the project it describes. The fiction is held to one rule
 * instead: it may only name things the archive index can resolve.
 */
const repoRoot = resolve(process.cwd(), "..");

function manifest(relative: string) {
  return JSON.parse(readFileSync(join(repoRoot, relative), "utf8")) as {
    scripts?: Record<string, string>;
    dependencies?: Record<string, string>;
    engines?: Record<string, string>;
    packageManager?: string;
  };
}

const rootManifest = manifest("package.json");
const clientManifest = manifest("client/package.json");

/** Resolves a `bun run` command to the manifest that has to define it. */
function resolveScript(text: string): { manifest: typeof rootManifest; name: string } | null {
  const match = /^bun run (?:--cwd=client )?([a-z:]+)$/.exec(text);
  if (!match) return null;
  const [, name] = match;
  const target = text.includes("--cwd=client") ? clientManifest : rootManifest;
  return { manifest: target, name };
}

describe("the project half", () => {
  it("reports the status the README states and the doctrine the archive runs on", () => {
    const readme = readFileSync(join(repoRoot, "README.md"), "utf8");
    const status = /^\*\*([A-Za-z -]+)\.\*\*/m.exec(readme);
    expect(status?.[1]).toBe(PROJECT.status);
    const context = readFileSync(join(repoRoot, ".agents/brain/PROJECT_CONTEXT.md"), "utf8");
    // The terminal quotes the source of truth word for word, apostrophe included.
    expect(context).toContain(PROJECT.doctrine);
    expect(PROJECT.name).toBe("CIRCA Archive");
    expect(PROJECT.commission).toContain("Commission for Incident Review");
  });

  it("pins the versions the manifests actually declare", () => {
    const runtimes = STACK.find((row) => row.key === "Runtimes");
    expect(runtimes?.value).toContain(rootManifest.packageManager?.replace("bun@", ""));
    expect(runtimes?.value).toContain(rootManifest.engines?.node.replace(">=", "") ?? "");
    const face = STACK.find((row) => row.key === "Interface");
    expect(face?.value).toContain(clientManifest.dependencies?.next);
    expect(face?.value).toContain(clientManifest.dependencies?.react);
  });

  it("marks everything that is not built yet as planned", () => {
    const planned = STACK.filter((row) => row.state === "planned").map((row) => row.key);
    // The backend is a draft, so nothing there may read as shipped.
    expect(planned).toContain("Services");
    expect(planned).toContain("Data");
    expect(planned).toContain("Evidence");
    const shipped = STACK.filter((row) => row.state === "shipped").map((row) => row.key);
    expect(shipped).toContain("Interface");
    expect(shipped).toContain("Runtimes");
  });

  it("only offers commands a manifest defines", () => {
    for (const command of COMMANDS) {
      const resolved = resolveScript(command.text);
      if (!resolved) {
        // A shell command is allowed, but it must not look like a script call.
        expect(command.text).not.toMatch(/^bun run/);
        continue;
      }
      expect(
        resolved.manifest.scripts?.[resolved.name],
        `${command.text} is not a script in the manifest it names`,
      ).toBeDefined();
    }
  });

  it("lists only documents and paths that exist in the checkout", () => {
    for (const document of DOCUMENTS) {
      expect(existsSync(join(repoRoot, document.path)), `${document.path} is missing`).toBe(true);
    }
    for (const row of LAYOUT) {
      expect(existsSync(join(repoRoot, row.path)), `${row.path} is missing`).toBe(true);
      expect(row.purpose.length).toBeGreaterThan(0);
    }
  });

  it("divides the brief into two tracks with real content each", () => {
    expect(TRACKS.map((track) => track.id)).toEqual(["writers", "developers"]);
    expect(TRACKS.map((track) => track.index)).toEqual(["A", "B"]);
    for (const track of TRACKS) {
      expect(track.lead.length).toBeGreaterThan(0);
      expect(track.kicker.length).toBeGreaterThan(0);
    }
    expect(WRITER_FILINGS).toHaveLength(3);
    expect(WRITER_RULES.length).toBeGreaterThanOrEqual(4);
    expect(WRITER_STEPS).toHaveLength(3);
    expect(BUILDER_STEPS.length).toBeGreaterThanOrEqual(4);
    expect(HINGE.line).toMatch(/fiction/i);
    expect(BRIEF.lead.length).toBeGreaterThan(0);
  });

  it("gives the writers only filing types and codes the archive can resolve", () => {
    for (const filing of WRITER_FILINGS) {
      expect(ARCHIVE_CLASSES).toContain(filing.klass);
      // The worked example has to be a record the workstation actually returns.
      expect(
        ARCHIVE_INDEX.some((entry) => entry.code === filing.code && entry.klass === filing.klass),
        `${filing.code} is not filed as ${CLASS_LABELS[filing.klass]}`,
      ).toBe(true);
    }
    expect(WRITER_STEPS.map((step) => step.index)).toEqual(["1", "2", "3"]);
  });

  it("gives the developers steps that cite documented commands", () => {
    for (const rule of BUILDER_STEPS) {
      expect(rule.note.length).toBeGreaterThan(0);
    }
    const cited = new Set(BUILDER_STEPS.flatMap((rule) => rule.commands));
    for (const id of cited) {
      expect(commandById(id), `an unknown command is cited: ${id}`).toBeDefined();
    }
    expect(cited.size).toBeGreaterThan(0);
  });

  it("draws the ledger, the organizations, and the specimen from the browser's index", () => {
    expect(FILINGS.length).toBeGreaterThanOrEqual(5);
    for (const filing of FILINGS) {
      expect(ARCHIVE_INDEX.find((entry) => entry.code === filing.code)).toEqual(filing);
    }
    expect(ORGANIZATIONS.length).toBeGreaterThanOrEqual(3);
    for (const organization of ORGANIZATIONS) {
      expect(organization.klass).toBe("organization");
    }
    const filed = ARCHIVE_INDEX.find((entry) => entry.code === SPECIMEN.code);
    expect(filed).toBeDefined();
    expect(SPECIMEN.abstract).toBe(filed?.abstract);
    expect(FILINGS.some((filing) => filing.code === SPECIMEN.code)).toBe(true);
  });

  it("keeps the terminal copy out of the project's mouth", () => {
    // The in-universe half may not advertise the repository: that is the brief's job.
    const spoken = JSON.stringify(TERMINAL);
    for (const word of ["repository", "pull request", "MIT", "npm", "Next.js"]) {
      expect(spoken).not.toContain(word);
    }
    expect(TERMINAL.clauses).toHaveLength(3);
    expect(TERMINAL.filing.fields.length).toBeGreaterThanOrEqual(5);
  });
});
