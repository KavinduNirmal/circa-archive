"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  createDraft,
  editorFont,
  FONT_KEY,
  type EditorFont,
  type IncidentDraft,
} from "@/lib/incident-editor/model";
import {
  browserDraftStorage,
  type DraftStorage,
} from "@/lib/incident-editor/storage";
import { IncidentEditorWorkspace } from "./workspace";
import { EDITOR_REGISTRY } from "./registry-fixtures";
import styles from "./editor.module.css";

// A route remount (including a locale change) must wait for the previous host's flush.
const pendingWrites = new WeakMap<DraftStorage, Promise<void>>();
function saveDraft(storage: DraftStorage, draft: IncidentDraft): Promise<void> {
  const previous = pendingWrites.get(storage);
  const write = previous
    ? previous.catch(() => {}).then(() => storage.save(draft))
    : storage.save(draft);
  pendingWrites.set(storage, write);
  return write;
}
async function restoreDraft(storage: DraftStorage) {
  await pendingWrites.get(storage)?.catch(() => {});
  return storage.load();
}

/** The site host owns browser persistence; the workspace can be embedded without it. */
export function SiteIncidentEditor({
  storage = browserDraftStorage,
}: {
  storage?: DraftStorage;
}) {
  const t = useTranslations("editor");
  const [draft, setDraft] = useState<IncidentDraft | null>(null);
  const [font, setFont] = useState<EditorFont>("mono");
  const [fontError, setFontError] = useState(false);
  const [status, setStatus] = useState("loading");
  const [restoreFailed, setRestoreFailed] = useState(false);
  const generation = useRef(0);
  const flush = useRef<() => void>(() => {});
  const edited = useRef(false);

  useEffect(() => {
    let active = true;
    restoreDraft(storage)
      .then((saved) => {
        if (!active) return;
        setDraft(saved ?? createDraft());
        setStatus(saved ? "saved" : "saving");
      })
      .catch(() => {
        if (!active) return;
        setRestoreFailed(true);
        setDraft(createDraft());
        setStatus("restoreError");
      });
    Promise.resolve().then(() => {
      if (!active) return;
      try {
        setFont(editorFont(localStorage.getItem(FONT_KEY)));
      } catch {
        setFontError(true);
      }
    });
    return () => {
      active = false;
    };
  }, [storage]);

  useEffect(() => {
    if (!draft || restoreFailed) return;
    const version = ++generation.current;
    let flushed = false;
    const save = () => {
      if (flushed) return;
      flushed = true;
      // Serialize writes so a slower old save can never replace the latest draft.
      saveDraft(storage, draft)
        .then(() => {
          if (generation.current === version) setStatus("saved");
        })
        .catch(() => {
          if (generation.current === version) setStatus("saveError");
        });
    };
    flush.current = save;
    const timer = setTimeout(save, 400);
    const visibility = () => {
      if (document.visibilityState === "hidden") save();
    };
    window.addEventListener("pagehide", save);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pagehide", save);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [draft, restoreFailed, storage]);

  useEffect(() => () => flush.current(), [storage]);

  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      if (!edited.current || status === "saved") return;
      flush.current();
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [status]);

  const update = useCallback(
    (next: IncidentDraft) => {
      edited.current = true;
      generation.current += 1;
      setDraft({ ...next, updatedAt: new Date().toISOString() });
      setStatus(restoreFailed ? "restoreError" : "saving");
    },
    [restoreFailed],
  );
  const assets = draft?.assets;
  const [assetUrls, setAssetUrls] = useState<Record<string, string>>({});
  useEffect(() => {
    const urls: Record<string, string> = {};
    for (const asset of assets ?? [])
      urls[asset.id] = URL.createObjectURL(asset.blob);
    // Object URLs live only in memory and are revoked when attachments change.
    Promise.resolve().then(() => setAssetUrls(urls));
    return () => Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
  }, [assets]);
  const resolveAsset = useMemo(
    () => (code: string) => {
      const entity = draft?.entities.find((entity) => entity.code === code);
      return entity?.assetId ? assetUrls[entity.assetId] : undefined;
    },
    [draft?.entities, assetUrls],
  );
  if (!draft)
    return (
      <p className={styles.saveStatus} role="status">
        {t("loading")}
      </p>
    );
  return (
    <>
      <p
        className={
          status === "saveError" || status === "restoreError"
            ? styles.notice
            : styles.saveStatus
        }
        role="status"
      >
        {t(status)}
      </p>
      {fontError && (
        <p className={styles.notice} role="status">
          {t("fontError")}
        </p>
      )}
      <IncidentEditorWorkspace
        draft={draft}
        onChange={update}
        registry={EDITOR_REGISTRY}
        font={font}
        resolveAsset={resolveAsset}
        onFontChange={(value) => {
          setFont(value);
          try {
            localStorage.setItem(FONT_KEY, value);
            setFontError(false);
          } catch {
            setFontError(true);
          }
        }}
      />
    </>
  );
}
