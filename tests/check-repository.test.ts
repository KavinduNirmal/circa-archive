import { describe, expect, test } from "bun:test";
import { findMissingReadmes, repositoryPaths } from "../scripts/check-repository";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

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
    const git = (...args: string[]) => execFileSync("git", args, { cwd });
    try {
      git("init", "--quiet");
      writeFileSync(join(cwd, "README.md"), "# Root\n");
      mkdirSync(join(cwd, "module"));
      writeFileSync(join(cwd, "module/code.ts"), "export const answer = 42;\n");
      writeFileSync(join(cwd, "module/README.md"), "# Module\n");
      git("add", "README.md", "module/code.ts");
      expect(findMissingReadmes(repositoryPaths(true, cwd))).toEqual(["module/README.md"]);
      expect(findMissingReadmes(repositoryPaths(false, cwd))).toEqual([]);
      git("add", "module/README.md");
      expect(findMissingReadmes(repositoryPaths(true, cwd))).toEqual([]);
      git("rm", "--cached", "--", "module/README.md");
      expect(findMissingReadmes(repositoryPaths(true, cwd))).toEqual(["module/README.md"]);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});
