import { describe, expect, it } from "vitest";
import {
  addTemporary,
  attachmentError,
  checkDraft,
  createDraft,
  importCharacter,
  references,
  type RegistryEntity,
} from "@/lib/incident-editor/model";

const character: RegistryEntity = {
  code: "CHR-018257",
  name: "Mara Vale",
  kind: "CHR",
  usage: "restricted",
};

describe("local incident draft", () => {
  it("starts empty with independent draft identities and conservative form defaults", () => {
    const draft = createDraft();
    expect(draft.markdown).toBe("");
    expect(draft.id).not.toBe(createDraft().id);
    expect(draft.form).toMatchObject({
      designation: "",
      severity: "U",
      affiliation: "CIRCA",
      claimant: "CIRCA",
      access: "public",
      clearance: "3",
      warning: "unspecified",
    });
  });

  it("finds distinct canonical and temporary references, excluding code, links, images, and frontmatter", () => {
    const source =
      '---\nnote: "[[CHR-999999]]"\n---\n[[INC-08127]] [[ ORG-005429 ]] [[INC-08127]] [[TEMP-ITM-01]]\n`[[CHR-111111]]`\n\n```md\n[[EXP-000111]]\n```\n\n[ [[RUM-000001]] ](/x) ![ [[EVI-000001]] ](/image)';
    expect(references(source)).toEqual([
      "INC-08127",
      "ORG-005429",
      "TEMP-ITM-01",
    ]);
  });

  it("requires restricted-character acknowledgement per draft and deduplicates imports", () => {
    const draft = createDraft();
    expect(importCharacter(draft, character).imports).toEqual([]);
    const imported = importCharacter(draft, character, true);
    expect(imported.imports).toEqual([character.code]);
    expect(imported.acknowledgements).toEqual([character.code]);
    expect(importCharacter(imported, character, true).imports).toEqual([
      character.code,
    ]);
    expect(
      importCharacter(createDraft(), { ...character, usage: "open" }).imports,
    ).toEqual([character.code]);
    expect(createDraft().imports).toEqual([]);
  });

  it("allocates monotonically increasing temporary numbers per kind without reusing removed codes", () => {
    const first = addTemporary(createDraft(), "CHR", "A witness");
    const removed = { ...first, entities: [] };
    const second = addTemporary(removed, "CHR", "Another witness");
    expect(second.entities[0].code).toBe("TEMP-CHR-02");
    expect(addTemporary(second, "ORG", "An office").entities[1].code).toBe(
      "TEMP-ORG-01",
    );
    expect(addTemporary(second, "ITM", "  ").entities).toHaveLength(1);
  });

  it("reports a removed image reference without deleting its Markdown", () => {
    const draft = createDraft();
    draft.form.designation = "A door";
    draft.markdown = "![full|The door](TEMP-EVI-01)";
    expect(checkDraft(draft, [])).toContain("missingAsset");
    expect(draft.markdown).toBe("![full|The door](TEMP-EVI-01)");
  });

  it("validates image formats and both size limits", () => {
    expect(attachmentError({ type: "image/svg+xml", size: 100 }, [])).toBe(
      "imageType",
    );
    expect(
      attachmentError({ type: "image/png", size: 10 * 1024 ** 2 + 1 }, []),
    ).toBe("imageSize");
    const assets = [
      { id: "asset", name: "old", blob: { size: 45 * 1024 ** 2 } as Blob },
    ];
    expect(
      attachmentError({ type: "image/webp", size: 6 * 1024 ** 2 }, assets),
    ).toBe("draftSize");
    expect(
      attachmentError({ type: "image/jpeg", size: 10 * 1024 ** 2 }, []),
    ).toBeNull();
  });

  it("flags missing imports, unresolved references, body limits, and distinct warning states", () => {
    const draft = createDraft();
    draft.form.designation = "An incident";
    draft.markdown = `[[${character.code}]] [[TEMP-ITM-09]]`;
    expect(checkDraft(draft, [character])).toEqual(
      expect.arrayContaining(["missingImport", "unresolved"]),
    );
    draft.markdown = "a".repeat(15001);
    expect(checkDraft(draft, [])).toContain("characterLimit");
    draft.markdown = "a ".repeat(2501);
    expect(checkDraft(draft, [])).toContain("wordLimit");
    draft.markdown = "A witness account.";
    draft.form.warning = "noWarningsApply";
    expect(checkDraft(draft, [])).not.toContain("warningsUnspecified");
    draft.form.warning = "unspecified";
    expect(checkDraft(draft, [])).toContain("warningsUnspecified");
  });
});
