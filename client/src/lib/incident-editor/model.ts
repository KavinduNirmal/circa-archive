import type { Root, Text, PhrasingContent } from "mdast";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import { unified } from "unified";
import { visit } from "unist-util-visit";

export type EntityKind = "INC" | "EXP" | "RUM" | "EVI" | "CHR" | "ORG" | "ITM";
export type RegistryEntity = {
  code: string;
  kind: EntityKind;
  name: string;
  usage?: "open" | "restricted";
  status?: string;
  href?: string;
};
export type DraftEntity = RegistryEntity & {
  assetId?: string;
  caption?: string;
};
export type DraftAsset = { id: string; blob: Blob; name: string };
/**
 * The disclosure the author has made. A record with specific warnings checked
 * is `provided`; the two explicit negative states stay distinct because
 * "No Warnings Apply" is a confirmation and "Warnings Not Provided" is not.
 */
export type WarningState = "unspecified" | "noWarningsApply" | "provided";

export type IncidentDraft = {
  version: 1;
  id: string;
  markdown: string;
  form: {
    designation: string;
    severity: string;
    affiliation: string;
    claimant: string;
    access: "public" | "sealed";
    warning: WarningState;
    warningTags: string[];
    clearance: string;
    tags: string;
  };
  imports: string[];
  acknowledgements: string[];
  entities: DraftEntity[];
  assets: DraftAsset[];
  nextTemporary: Partial<Record<EntityKind, number>>;
  updatedAt: string;
};

export const ENTITY_KINDS: EntityKind[] = [
  "INC",
  "EXP",
  "RUM",
  "EVI",
  "CHR",
  "ORG",
  "ITM",
];
export const SEVERITIES = ["U", "E", "D", "C", "B", "A", "S", "O"] as const;
export const WARNING_TAGS = [
  "violence",
  "psychological",
  "sexual",
  "selfHarm",
  "death",
] as const;
export const FONT_KEY = "circa.incident-editor.font";
export const EDITOR_FONTS = ["mono", "sans", "serif"] as const;
export type EditorFont = (typeof EDITOR_FONTS)[number];
export function editorFont(value: string | null): EditorFont {
  return EDITOR_FONTS.includes(value as EditorFont)
    ? (value as EditorFont)
    : "mono";
}

export function createDraft(): IncidentDraft {
  return {
    version: 1,
    id: crypto.randomUUID(),
    markdown: "",
    form: {
      designation: "",
      severity: "U",
      affiliation: "CIRCA",
      claimant: "CIRCA",
      access: "public",
      warning: "unspecified",
      warningTags: [],
      clearance: "3",
      tags: "",
    },
    imports: [],
    acknowledgements: [],
    entities: [],
    assets: [],
    nextTemporary: {},
    updatedAt: new Date().toISOString(),
  };
}

const referencePattern = () =>
  /\[\[\s*((?:TEMP-)?(?:INC|EXP|RUM|EVI|CHR|ORG|ITM)-\d+)\s*\]\]/g;
export const ENTITY_LINK_PREFIX = "#circa-entity-";

/** Only prose nodes participate: code, YAML, image alt text, and existing links are excluded. */
export function referenceNodes(
  tree: Root,
  accept: (node: Text, codes: RegExpMatchArray[]) => void,
) {
  visit(tree, (node, index, parent) => {
    if (node.type === "link" || node.type === "linkReference") return "skip";
    if (node.type !== "text" || !parent || index === undefined) return;
    const matches = [...node.value.matchAll(referencePattern())];
    if (matches.length) accept(node, matches);
  });
}

function referenceTree(markdown: string) {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkFrontmatter)
    .parse(markdown);
}

export function attachmentReferences(markdown: string): string[] {
  const codes = new Set<string>();
  visit(referenceTree(markdown), "image", (node) => {
    if (/^TEMP-EVI-\d+$/.test(node.url)) codes.add(node.url);
  });
  return [...codes];
}

export function references(markdown: string): string[] {
  const tree = referenceTree(markdown);
  const codes = new Set<string>();
  referenceNodes(tree, (_, matches) =>
    matches.forEach((match) => codes.add(match[1])),
  );
  return [...codes];
}

/** Editor previews share the record pipeline; this plugin adds only entity references. */
export function remarkEntityLinks() {
  return (tree: Root) => {
    visit(tree, (node, index, parent) => {
      if (node.type === "link" || node.type === "linkReference") return "skip";
      if (node.type !== "text" || !parent || index === undefined) return;
      const matches = [...node.value.matchAll(referencePattern())];
      if (!matches.length) return;
      const children: PhrasingContent[] = [];
      let offset = 0;
      for (const match of matches) {
        const start = match.index!;
        if (start > offset)
          children.push({
            type: "text",
            value: node.value.slice(offset, start),
          });
        children.push({
          type: "link",
          url: `${ENTITY_LINK_PREFIX}${match[1]}`,
          children: [{ type: "text", value: match[1] }],
        });
        offset = start + match[0].length;
      }
      if (offset < node.value.length)
        children.push({ type: "text", value: node.value.slice(offset) });
      parent.children.splice(index, 1, ...children);
      return index + children.length;
    });
  };
}

export function importCharacter(
  draft: IncidentDraft,
  entity: RegistryEntity,
  acknowledged = false,
): IncidentDraft {
  if (entity.kind !== "CHR" || draft.imports.includes(entity.code))
    return draft;
  if (entity.usage === "restricted" && !acknowledged) return draft;
  return {
    ...draft,
    imports: [...draft.imports, entity.code],
    acknowledgements:
      entity.usage === "restricted"
        ? [...draft.acknowledgements, entity.code]
        : draft.acknowledgements,
  };
}

export function addTemporary(
  draft: IncidentDraft,
  kind: "CHR" | "ORG" | "ITM" | "EVI",
  name: string,
): IncidentDraft {
  if (!name.trim()) return draft;
  const number = (draft.nextTemporary[kind] ?? 0) + 1;
  const code = `TEMP-${kind}-${String(number).padStart(2, "0")}`;
  return {
    ...draft,
    nextTemporary: { ...draft.nextTemporary, [kind]: number },
    entities: [
      ...draft.entities,
      {
        code,
        kind,
        name: name.trim(),
        ...(kind === "CHR" ? { usage: "open" as const } : {}),
      },
    ],
    imports: kind === "CHR" ? [...draft.imports, code] : draft.imports,
  };
}

export function attachmentError(
  file: Pick<File, "type" | "size">,
  assets: DraftAsset[],
): string | null {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
    return "imageType";
  if (!file.size || file.size > 10 * 1024 ** 2) return "imageSize";
  if (
    assets.reduce((sum, asset) => sum + asset.blob.size, 0) + file.size >
    50 * 1024 ** 2
  )
    return "draftSize";
  return null;
}

export function wordCount(markdown: string): number {
  return markdown.trim() ? markdown.trim().split(/\s+/u).length : 0;
}

export function checkDraft(
  draft: IncidentDraft,
  registry: RegistryEntity[],
): string[] {
  const issues = new Set<string>();
  if (!draft.form.designation.trim()) issues.add("designationRequired");
  if (draft.form.designation.length > 256) issues.add("designationLimit");
  if (!draft.markdown.trim()) issues.add("contentRequired");
  if (draft.markdown.length > 15000) issues.add("characterLimit");
  if (wordCount(draft.markdown) > 2500) issues.add("wordLimit");
  if (draft.form.warning === "unspecified") issues.add("warningsUnspecified");
  if (!draft.form.affiliation.trim() || !draft.form.claimant.trim())
    issues.add("organizationRequired");
  const all = [...registry, ...draft.entities];
  for (const code of references(draft.markdown)) {
    const entity = all.find((entity) => entity.code === code);
    if (!entity) issues.add("unresolved");
    else if (
      entity.kind === "CHR" &&
      (!draft.imports.includes(code) ||
        (entity.usage === "restricted" &&
          !draft.acknowledgements.includes(code)))
    )
      issues.add("missingImport");
  }
  for (const code of attachmentReferences(draft.markdown)) {
    const entity = draft.entities.find((entity) => entity.code === code);
    if (
      !entity?.assetId ||
      !draft.assets.some((asset) => asset.id === entity.assetId)
    )
      issues.add("missingAsset");
  }
  for (const entity of draft.entities) {
    if (
      entity.assetId &&
      !draft.assets.some((asset) => asset.id === entity.assetId)
    )
      issues.add("missingAsset");
  }
  return [...issues];
}
