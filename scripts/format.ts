import { execFileSync, spawnSync } from "node:child_process";

// Use Git's inventory, including per-clone exclusions, so a repository-wide
// formatting pass never traverses local browser profiles or private notes.
const paths = [
  ...new Set(
    execFileSync(
      "git",
      ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
      { encoding: "utf8" },
    )
      .split("\0")
      .filter(Boolean),
  ),
];
const mode = process.argv.includes("--check") ? "--check" : "--write";
for (let offset = 0; offset < paths.length; offset += 100) {
  const result = spawnSync(
    "bunx",
    [
      "--no-install",
      "prettier",
      mode,
      "--ignore-unknown",
      "--",
      ...paths.slice(offset, offset + 100),
    ],
    { stdio: "inherit" },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
