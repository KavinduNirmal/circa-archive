/**
 * The pre-parse repair for redactions written inside GFM table rows.
 *
 * In a table, `|` is the cell divider, so `||redacted||` is not a redaction: it
 * is two empty cells, and the row silently comes apart into twelve cells
 * instead of four. No inline syntax can rescue it, because the cell splitting
 * happens before inline tokenisation. The repair is therefore a string pass
 * over the source, run before any parser sees it.
 *
 * The only two syntaxes that survive a cell are a backslash-escaped pipe and an
 * HTML entity. This module writes the first: inside a table row, every
 * unescaped `||` becomes `\|\|`, which parses back to the literal two
 * characters and is then resolved off the tree by `remark-redactions`.
 *
 * Outside a table the function is the identity. A pipe in prose is not
 * structural, and rewriting it would change a record that was already correct.
 */

/** A `|---|:--:|` row: the line that makes the line above it a table header. */
function isDelimiterRow(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes("-")) return false;
  const cells = trimmed.replace(/^\|/, "").replace(/\|$/, "").split("|");
  return (
    cells.length > 0 && cells.every((cell) => /^\s*:?-{1,}:?\s*$/.test(cell))
  );
}

/** A row candidate: a line with a pipe that is not itself escaped. */
function hasPipe(line: string): boolean {
  for (let index = 0; index < line.length; index += 1) {
    if (line[index] === "\\") {
      index += 1;
      continue;
    }
    if (line[index] === "|") return true;
  }
  return false;
}

/** Escapes each unescaped `||` pair, leaving an already-escaped pipe alone. */
function escapePairs(line: string): string {
  let out = "";
  let index = 0;
  while (index < line.length) {
    const character = line[index];
    if (character === "\\") {
      out += character + (line[index + 1] ?? "");
      index += 2;
      continue;
    }
    if (character === "|" && line[index + 1] === "|") {
      out += "\\|\\|";
      index += 2;
      continue;
    }
    out += character;
    index += 1;
  }
  return out;
}

export function normaliseTableRedactions(source: string): string {
  const lines = source.split("\n");
  const out: string[] = [];
  let inTable = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (isDelimiterRow(line)) {
      inTable = true;
      out.push(line);
      continue;
    }
    // A header row is only recognisable by the delimiter row beneath it.
    const startsTable = hasPipe(line) && isDelimiterRow(lines[index + 1] ?? "");
    const continuesTable = inTable && hasPipe(line);
    if (startsTable || continuesTable) {
      inTable = true;
      out.push(escapePairs(line));
      continue;
    }
    inTable = false;
    out.push(line);
  }

  return out.join("\n");
}
