import type { VFile } from "vfile";
import type { RecordMetadata, RenderWarning } from "./types";

/*
 * Warnings are collected on the VFile rather than thrown, because a record
 * defect is content, not a crash: an unmatched delimiter or a header that
 * disagrees with its own body must still render. Only a corrupt YAML block
 * throws, and that happens in the frontmatter plugin.
 *
 * The bag rides the file so a plugin can warn without holding a reference to
 * the caller, which is what lets the same plugin list serve both the server
 * pipeline and the React viewer.
 */

const WARNINGS = "circaWarnings";
const METADATA = "circaMetadata";

export function warningBag(file: VFile): RenderWarning[] {
  const data = file.data as Record<string, unknown>;
  const existing = data[WARNINGS];
  if (Array.isArray(existing)) return existing as RenderWarning[];
  const created: RenderWarning[] = [];
  data[WARNINGS] = created;
  return created;
}

export function collectWarnings(file: VFile): RenderWarning[] {
  const existing = (file.data as Record<string, unknown>)[WARNINGS];
  return Array.isArray(existing) ? (existing as RenderWarning[]) : [];
}

export function setMetadata(file: VFile, metadata: RecordMetadata): void {
  (file.data as Record<string, unknown>)[METADATA] = metadata;
}

export function metadataOf(file: VFile): RecordMetadata {
  const existing = (file.data as Record<string, unknown>)[METADATA];
  return existing && typeof existing === "object" && !Array.isArray(existing) ? (existing as RecordMetadata) : {};
}

/** The 1-based line an offset sits on, so a warning can point at the source. */
export function lineOf(source: string, offset: number): number {
  let line = 1;
  for (let index = 0; index < offset && index < source.length; index += 1) {
    if (source[index] === "\n") line += 1;
  }
  return line;
}

/**
 * The header and the body disagreeing about a field.
 *
 * The test corpus is deliberately inconsistent — `status: FILED` in the YAML,
 * `Status: **OPEN**` in the body — because the fiction is about records that
 * contradict themselves. The renderer reports that rather than quietly
 * reconciling it: chrome follows the index entry, prose follows the body, and
 * the disagreement stays visible.
 */
export function disagreementWarning(markdown: string, metadata: RecordMetadata): RenderWarning | undefined {
  const declared = typeof metadata.status === "string" ? metadata.status.trim().toUpperCase() : "";
  if (!declared) return undefined;
  const printed = /\bStatus:\s*\*{0,2}([A-Za-z]+)\*{0,2}/.exec(markdown);
  if (!printed) return undefined;
  const body = printed[1].toUpperCase();
  if (body === declared) return undefined;
  return {
    code: "metadata-disagreement",
    message: `The header says status ${declared}; the body prints ${body}.`,
    line: lineOf(markdown, printed.index),
  };
}
