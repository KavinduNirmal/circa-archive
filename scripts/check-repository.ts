import { posix } from "node:path";
import { execFileSync } from "node:child_process";

const generatedDirectories = new Set([
  ".git", "node_modules", ".next", "dist", "out", "coverage", "bin", "obj", "TestResults",
]);

/**
 * `.github/README.md` is the repository README as far as GitHub is concerned:
 * it takes precedence over the root file and hides the project introduction.
 * The folder documents itself in `.github/ABOUT.md` instead.
 */
const readmeExemptDirectories = new Set([".github"]);

export function findShadowingRepositoryReadme(paths: string[]): string[] {
  return paths.filter((path) => path === ".github/README.md");
}

export function findMissingReadmes(paths: string[]): string[] {
  const authored = paths.filter((path) =>
    !path.startsWith(".husky/_/") &&
    !path.split("/").some((part) => generatedDirectories.has(part))
  );
  const files = new Set(authored);
  const required = new Set<string>();
  for (const path of authored) {
    let directory = posix.dirname(path);
    while (true) {
      required.add(directory === "." ? "README.md" : `${directory}/README.md`);
      if (directory === ".") break;
      directory = posix.dirname(directory);
    }
  }
  return [...required].filter((path) => {
    if (files.has(path)) return false;
    return !readmeExemptDirectories.has(posix.dirname(path));
  }).sort((a, b) => {
    if (a === "README.md") return -1;
    if (b === "README.md") return 1;
    return a.split("/").length - b.split("/").length || a.localeCompare(b);
  });
}

/**
 * The paths git reports for the repository at `cwd`.
 *
 * `env` is the environment git reads the index with. The command line inherits
 * its own, so a hook validating a partial commit sees that commit's index; a
 * caller building a scratch repository passes an environment with git's own
 * variables removed, so the scratch repository cannot be pointed at the index of
 * the repository under commit.
 */
export function repositoryPaths(
  staged: boolean,
  cwd = process.cwd(),
  env: NodeJS.ProcessEnv = process.env,
): string[] {
  // The index is the complete next-commit snapshot, including staged deletions.
  const args = staged
    ? ["ls-files", "--cached", "-z"]
    : ["ls-files", "--cached", "--others", "--exclude-standard", "-z"];
  return execFileSync("git", args, { cwd, env, encoding: "utf8" }).split("\0").filter(Boolean);
}

if (import.meta.main) {
  const staged = process.argv.includes("--staged");
  const root = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
  const paths = repositoryPaths(staged, root);
  const shadowing = findShadowingRepositoryReadme(paths);
  if (shadowing.length) {
    console.error(
      `Move ${shadowing.join(", ")} to .github/ABOUT.md: GitHub renders .github/README.md as the repository README.`,
    );
    process.exit(1);
  }
  const missing = findMissingReadmes(paths);
  if (missing.length) {
    console.error(`Missing folder documentation${staged ? " in the Git index" : ""}:\n${missing.join("\n")}`);
    process.exit(1);
  }
  try {
    execFileSync("git", staged ? ["diff", "--cached", "--check"] : ["diff", "--check"], {
      cwd: root, stdio: "inherit",
    });
  } catch {
    console.error("Fix the whitespace errors above before continuing.");
    process.exit(1);
  }
  console.log(`Repository checks passed (${staged ? "staged snapshot" : "tracked and unignored files"}).`);
}
