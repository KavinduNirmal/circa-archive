import {
  ENTITY_KINDS,
  SEVERITIES,
  type IncidentDraft,
  type WarningState,
} from "./model";

export const DATABASE_NAME = "circa-incident-drafts";

const WARNING_STATES: readonly WarningState[] = [
  "unspecified",
  "noWarningsApply",
  "provided",
];
/* The first editor shipped tier values; keep those drafts restorable. */
const LEGACY_WARNING_STATES = ["none", "green", "yellow", "red"];

function normaliseWarning(value: string): WarningState {
  if (value === "green" || value === "yellow" || value === "red")
    return "provided";
  if (value === "none") return "unspecified";
  return value as WarningState;
}
export interface DraftStorage {
  load(): Promise<IncidentDraft | null>;
  save(draft: IncidentDraft): Promise<void>;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("drafts");
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Draft database blocked"));
  });
}

/** Reject incomplete/unknown payloads before the UI can overwrite a recoverable draft. */
function isDraft(value: unknown): value is IncidentDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as IncidentDraft;
  const form = draft.form;
  return (
    draft.version === 1 &&
    typeof draft.id === "string" &&
    typeof draft.markdown === "string" &&
    typeof draft.updatedAt === "string" &&
    !!form &&
    [
      form.designation,
      form.severity,
      form.affiliation,
      form.claimant,
      form.clearance,
      form.tags,
    ].every((v) => typeof v === "string") &&
    SEVERITIES.includes(form.severity as (typeof SEVERITIES)[number]) &&
    ["3", "4", "5", "6"].includes(form.clearance) &&
    ["public", "sealed"].includes(form.access) &&
    [...WARNING_STATES, ...LEGACY_WARNING_STATES].includes(form.warning) &&
    [form.warningTags, draft.imports, draft.acknowledgements].every(
      (v) => Array.isArray(v) && v.every((item) => typeof item === "string"),
    ) &&
    !!draft.nextTemporary &&
    typeof draft.nextTemporary === "object" &&
    Object.entries(draft.nextTemporary).every(
      ([kind, number]) =>
        ENTITY_KINDS.includes(kind as (typeof ENTITY_KINDS)[number]) &&
        Number.isSafeInteger(number) &&
        number >= 0,
    ) &&
    Array.isArray(draft.entities) &&
    draft.entities.every(
      (entity) =>
        entity &&
        typeof entity.code === "string" &&
        typeof entity.name === "string" &&
        ENTITY_KINDS.includes(entity.kind) &&
        (entity.assetId === undefined || typeof entity.assetId === "string"),
    ) &&
    Array.isArray(draft.assets) &&
    draft.assets.every(
      (asset) =>
        asset &&
        typeof asset.id === "string" &&
        typeof asset.name === "string" &&
        asset.blob instanceof Blob,
    )
  );
}

export const browserDraftStorage: DraftStorage = {
  async load() {
    const database = await openDatabase();
    try {
      return await new Promise<IncidentDraft | null>((resolve, reject) => {
        const transaction = database.transaction("drafts", "readonly");
        const request = transaction.objectStore("drafts").get("active");
        transaction.oncomplete = () => {
          if (request.result === undefined) resolve(null);
          else if (isDraft(request.result)) {
            const draft = request.result;
            resolve({
              ...draft,
              form: {
                ...draft.form,
                warning: normaliseWarning(draft.form.warning),
              },
            });
          } else reject(new Error("Unsupported or damaged draft"));
        };
        transaction.onerror = transaction.onabort = () =>
          reject(transaction.error ?? new Error("Draft read failed"));
      });
    } finally {
      database.close();
    }
  },
  async save(draft) {
    const database = await openDatabase();
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction("drafts", "readwrite");
        transaction.objectStore("drafts").put(draft, "active");
        transaction.oncomplete = () => resolve();
        transaction.onerror = transaction.onabort = () =>
          reject(transaction.error ?? new Error("Draft save failed"));
      });
    } finally {
      database.close();
    }
  },
};
