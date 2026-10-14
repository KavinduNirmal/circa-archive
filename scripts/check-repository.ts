import { posix } from "node:path";
import { execFileSync } from "node:child_process";

const generatedDirectories = new Set([
  ".git", "node_modules", ".next", "dist", "out", "coverage", "bin", "obj", "TestResults",
]);

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
  return [...required].filter((path) => !files.has(path)).sort((a, b) => {
    if (a === "README.md") return -1;
    if (b === "README.md") return 1;
    return a.split("/").length - b.split("/").length || a.localeCompare(b);
  });
}

export function repositoryPaths(staged: boolean, cwd = process.cwd()): string[] {
  // The index is the complete next-commit snapshot, including staged deletions.
  const args = staged
    ? ["ls-files", "--cached", "-z"]
    : ["ls-files", "--cached", "--others", "--exclude-standard", "-z"];
  return execFileSync("git", args, { cwd, encoding: "utf8" }).split("\0").filter(Boolean);
}

if (import.meta.main) {
  const staged = process.argv.includes("--staged");
  const root = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
  const missing = findMissingReadmes(repositoryPaths(staged, root));
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
