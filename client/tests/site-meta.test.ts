import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ARCHIVE_INDEX } from "@/components/browser/archive-index";
import {
  COMMANDS,
  DOCUMENTS,
  LAYOUT,
  PROJECT,
  ROLES,
  SECTIONS,
  SPECIMEN,
  STACK,
  STEPS,
  commandById,
} from "@/components/site/site-meta";

/**
 * The landing page is a claim about a real repository, so every fact on it is
 * checked against the thing it describes: the manifests, the files on disk, and
 * the same archive index the browser files. A landing page that drifts from the
 * repository is the one kind of copy that cannot be kept honest by review alone.
 */
const repoRoot = resolve(process.cwd(), "..");

function manifest(relative: string) {
  return JSON.parse(readFileSync(join(repoRoot, relative), "utf8")) as {
    scripts?: Record<string, string>;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
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

describe("site metadata", () => {
  it("reports the status the README states and the doctrine the archive runs on", () => {
    const readme = readFileSync(join(repoRoot, "README.md"), "utf8");
    const status = /^\*\*([A-Za-z -]+)\.\*\*/m.exec(readme);
    expect(status?.[1]).toBe(PROJECT.status);
    const context = readFileSync(join(repoRoot, ".agents/brain/PROJECT_CONTEXT.md"), "utf8");
    // The docket quotes the source of truth word for word, apostrophe included.
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
    }
    for (const role of ROLES) {
      expect(existsSync(join(repoRoot, role.path)), `${role.path} is missing`).toBe(true);
    }
  });

  it("numbers the sections in reading order with unique anchors", () => {
    const ids = SECTIONS.map((section) => section.id);
    expect(new Set(ids).size).toBe(ids.length);
    SECTIONS.forEach((section, position) => {
      expect(section.index).toBe(String(position + 1).padStart(2, "0"));
      expect(section.standfirst.length).toBeGreaterThan(0);
    });
  });

  it("gives every contribution step real commands and an order", () => {
    // Not every step is a command, but the ones that are must resolve.
    expect(STEPS.some((step) => step.commands.length > 0)).toBe(true);
    STEPS.forEach((step, position) => {
      expect(step.index).toBe(String(position + 1).padStart(2, "0"));
      expect(step.title.length).toBeGreaterThan(0);
      expect(step.body.length).toBeGreaterThan(0);
      for (const id of step.commands) {
        expect(commandById(id), `step ${step.id} cites an unknown command`).toBeDefined();
      }
    });
  });

  it("draws the specimen record from the browser's own index", () => {
    const filed = ARCHIVE_INDEX.find((entry) => entry.code === SPECIMEN.code);
    expect(filed).toBeDefined();
    expect(SPECIMEN.designation).toBe(filed?.designation);
    expect(SPECIMEN.abstract).toBe(filed?.abstract);
    expect(SPECIMEN.filed).toBe(filed?.filed);
  });
});
