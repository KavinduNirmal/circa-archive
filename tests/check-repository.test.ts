import { describe, expect, test } from "bun:test";
import { findMissingReadmes, repositoryPaths } from "../scripts/check-repository";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * The environment a scratch repository gets: git's own variables removed.
 *
 * A partial commit (`git commit -- <path>`) exports an absolute `GIT_INDEX_FILE`
 * to the hooks it runs, and `execFileSync` would hand it straight on. A scratch
 * repository that inherited it stages its own fixtures into the index of the
 * repository being committed, against blobs its object store is about to lose,
 * and that commit then fails to build its tree.
 *
 * The environment arrives as an argument rather than being read from
 * `process.env`, because Bun copies the environment when it spawns a child: a
 * variable set here at runtime would never reach the child, and a test that set
 * one would pass without testing anything.
 */
function scratchEnvironment(inherited: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  return Object.fromEntries(Object.entries(inherited).filter(([key]) => !key.startsWith("GIT_")));
}

function scratchGit(cwd: string, inherited: NodeJS.ProcessEnv = process.env): (...args: string[]) => void {
  const env = scratchEnvironment(inherited);
  return (...args) => { execFileSync("git", args, { cwd, env }); };
}

describe("folder README policy", () => {
  test("requires a README at the root and every ancestor folder", () => {
    expect(findMissingReadmes(["client/app/page.tsx"])).toEqual([
      "README.md",
      "client/README.md",
      "client/app/README.md",
    ]);
  });

  test("accepts documented folders", () => {
    expect(findMissingReadmes([
      "README.md", "client/README.md", "client/app/README.md", "client/app/page.tsx",
    ])).toEqual([]);
  });

  test("requires documentation in authored hidden directories", () => {
    expect(findMissingReadmes(["README.md", ".agents/rules/tdd.md"])).toEqual([
      ".agents/README.md", ".agents/rules/README.md",
    ]);
  });

  test("does not require documentation for generated directories", () => {
    expect(findMissingReadmes([
      "README.md", "node_modules/example/index.js", ".husky/_/h", "backend/obj/cache.json",
    ])).toEqual([]);
  });

  test("deduplicates missing READMEs across files", () => {
    expect(findMissingReadmes(["README.md", "client/a.ts", "client/b.ts"])).toEqual([
      "client/README.md",
    ]);
  });

  test("requires the exact README.md spelling", () => {
    expect(findMissingReadmes(["README.md", "docs/readme.md"])).toEqual(["docs/README.md"]);
  });
});

describe("staged snapshot", () => {
  test("requires staged documentation and honors staged deletions", () => {
    const cwd = mkdtempSync(join(tmpdir(), "circa-index-test-"));
    const git = scratchGit(cwd);
    try {
      git("init", "--quiet");
      writeFileSync(join(cwd, "README.md"), "# Root\n");
      mkdirSync(join(cwd, "module"));
      writeFileSync(join(cwd, "module/code.ts"), "export const answer = 42;\n");
      writeFileSync(join(cwd, "module/README.md"), "# Module\n");
      git("add", "README.md", "module/code.ts");
      expect(findMissingReadmes(repositoryPaths(true, cwd, scratchEnvironment()))).toEqual(["module/README.md"]);
      expect(findMissingReadmes(repositoryPaths(false, cwd, scratchEnvironment()))).toEqual([]);
      git("add", "module/README.md");
      expect(findMissingReadmes(repositoryPaths(true, cwd, scratchEnvironment()))).toEqual([]);
      git("rm", "--cached", "--", "module/README.md");
      expect(findMissingReadmes(repositoryPaths(true, cwd, scratchEnvironment()))).toEqual(["module/README.md"]);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  test("keeps a scratch repository out of the index a partial commit exports", () => {
    const cwd = mkdtempSync(join(tmpdir(), "circa-index-export-"));
    const exported = join(cwd, "exported-index");
    // The environment a partial commit hands its hooks, spelled out, because Bun
    // would not carry one set at runtime.
    const hook = { ...process.env, GIT_INDEX_FILE: exported };
    try {
      const git = scratchGit(cwd, hook);
      git("init", "--quiet");
      mkdirSync(join(cwd, "module"));
      writeFileSync(join(cwd, "module/code.ts"), "export const answer = 42;\n");
      git("add", "module/code.ts");
      // The scratch repository's own index, not the committing repository's.
      expect(existsSync(exported)).toBe(false);
      expect(repositoryPaths(true, cwd, scratchEnvironment(hook))).toEqual(["module/code.ts"]);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});
