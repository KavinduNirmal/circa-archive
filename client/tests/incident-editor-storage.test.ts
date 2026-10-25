import "fake-indexeddb/auto";
import { Blob as NodeBlob } from "node:buffer";
import { vi } from "vitest";

// IndexedDB uses Node structuredClone in this runner; use its cloneable Blob.
vi.stubGlobal("Blob", NodeBlob);
import { beforeEach, describe, expect, it } from "vitest";
import { createDraft } from "@/lib/incident-editor/model";
import {
  browserDraftStorage,
  DATABASE_NAME,
} from "@/lib/incident-editor/storage";

beforeEach(
  () =>
    new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DATABASE_NAME);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    }),
);

describe("browser draft persistence", () => {
  it("restores draft identity, metadata, imports, and image blobs atomically", async () => {
    expect(await browserDraftStorage.load()).toBeNull();
    const draft = createDraft();
    draft.form.designation = "A local filing";
    draft.markdown = "![full|Door](TEMP-EVI-01)";
    draft.imports = ["CHR-018257"];
    draft.acknowledgements = [...draft.imports];
    draft.assets = [
      {
        id: "image",
        name: "door.png",
        blob: new Blob(["image bytes"], { type: "image/png" }),
      },
    ];
    await browserDraftStorage.save(draft);
    const restored = await browserDraftStorage.load();
    expect(restored).toMatchObject({
      id: draft.id,
      form: draft.form,
      markdown: draft.markdown,
      imports: draft.imports,
      acknowledgements: draft.acknowledgements,
    });
    expect(restored?.assets[0].blob.size).toBe(draft.assets[0].blob.size);
    expect(restored?.assets[0].blob.type).toBe("image/png");
    await browserDraftStorage.save({ ...draft, markdown: "Revised" });
    expect((await browserDraftStorage.load())?.markdown).toBe("Revised");
  });

  it("rejects unavailable storage instead of reporting a save", async () => {
    const original = globalThis.indexedDB;
    Object.defineProperty(globalThis, "indexedDB", {
      configurable: true,
      value: undefined,
    });
    try {
      await expect(browserDraftStorage.save(createDraft())).rejects.toThrow();
    } finally {
      Object.defineProperty(globalThis, "indexedDB", {
        configurable: true,
        value: original,
      });
    }
  });
});
