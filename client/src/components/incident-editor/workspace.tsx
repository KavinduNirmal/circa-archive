"use client";
import { Tabs } from "radix-ui";
import { useRef, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { FileText, ListChecks, PanelRightOpen } from "lucide-react";
import {
  checkDraft,
  EDITOR_FONTS,
  importCharacter,
  wordCount,
  type EditorFont,
  type IncidentDraft,
  type RegistryEntity,
} from "@/lib/incident-editor/model";
import { ArchiveButton } from "../archive-site/archive-button";
import { IncidentForm } from "./incident-form";
import { IncidentPreview } from "./preview";
import { EntitySidebar } from "./entity-sidebar";
import { EditorModal } from "./modal";
import { SourceEditor, type SourceEditorHandle } from "./source-editor";
import styles from "./editor.module.css";

export type WorkspaceProps = {
  draft: IncidentDraft;
  onChange: (draft: IncidentDraft) => void;
  registry: RegistryEntity[];
  font: EditorFont;
  onFontChange: (font: EditorFont) => void;
  resolveAsset: (code: string) => string | undefined;
};
const mobileQuery = "(max-width: 900px)";
const subscribeMobile = (notify: () => void) => {
  const query = window.matchMedia(mobileQuery);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};
const isMobile = () => window.matchMedia(mobileQuery).matches;

/** Controlled document UI; the host supplies storage, preferences, registry and asset resolution. */
export function IncidentEditorWorkspace({
  draft,
  onChange,
  registry,
  font,
  onFontChange,
  resolveAsset,
}: WorkspaceProps) {
  const t = useTranslations("editor");
  const [tab, setTab] = useState("form");
  const [contentTab, setContentTab] = useState("editor");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [restricted, setRestricted] = useState<RegistryEntity | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [details, setDetails] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const source = useRef<SourceEditorHandle>(null);
  const mobile = useSyncExternalStore(subscribeMobile, isMobile, () => false);
  const resolveEntity = (code: string) =>
    [...registry, ...draft.entities].find((entity) => entity.code === code);
  const entity = details ? resolveEntity(details) : undefined;
  function insert(text: string) {
    setTab("content");
    setContentTab("editor");
    setSidebarOpen(false);
    requestAnimationFrame(() => source.current?.insert(text));
  }
  const sidebar = (
    <EntitySidebar
      draft={draft}
      registry={registry}
      onChange={onChange}
      onInsert={insert}
      onDetails={setDetails}
      onImport={(entity) => {
        if (entity.usage === "restricted") {
          setAcknowledged(false);
          setRestricted(entity);
        } else onChange(importCharacter(draft, entity));
      }}
    />
  );
  return (
    <>
      <div className={styles.workspaceHeader}>
        <div>
          <span className={styles.eyebrow}>INC / {t("localDraft")}</span>
          <h1>{t("title")}</h1>
          <p>{t("intro")}</p>
        </div>
        <ArchiveButton
          tone="paper"
          className={styles.mobileRegistry}
          icon={<PanelRightOpen size={16} aria-hidden="true" />}
          onClick={() => setSidebarOpen(true)}
        >
          {t("openSidebar")}
        </ArchiveButton>
      </div>
      <Tabs.Root
        value={tab}
        onValueChange={setTab}
        orientation="horizontal"
        className={styles.workspace}
      >
        <Tabs.List className={styles.primaryTabs} aria-label={t("title")}>
          <Tabs.Trigger value="form" aria-label={t("formTab")}>
            <ListChecks size={20} aria-hidden="true" />
            <span>{t("formTab")}</span>
            <small>01</small>
          </Tabs.Trigger>
          <Tabs.Trigger value="content" aria-label={t("contentTab")}>
            <FileText size={20} aria-hidden="true" />
            <span>{t("contentTab")}</span>
            <small>02</small>
          </Tabs.Trigger>
          <span className={styles.railStamp}>{t("notFiled")}</span>
        </Tabs.List>
        <div className={styles.mainPanel}>
          <Tabs.Content value="form">
            <IncidentForm
              draft={draft}
              onChange={onChange}
              onContinue={() => setTab("content")}
            />
          </Tabs.Content>
          <Tabs.Content value="content" forceMount hidden={tab !== "content"}>
            <Tabs.Root value={contentTab} onValueChange={setContentTab}>
              <div className={styles.contentControls}>
                <Tabs.List
                  className={styles.contentTabs}
                  aria-label={t("contentTab")}
                >
                  <Tabs.Trigger value="editor">{t("editorTab")}</Tabs.Trigger>
                  <Tabs.Trigger value="preview">{t("previewTab")}</Tabs.Trigger>
                </Tabs.List>
                <label className={styles.fontControl}>
                  {t("font")}
                  <select
                    aria-label={t("font")}
                    value={font}
                    onChange={(event) =>
                      onFontChange(event.target.value as EditorFont)
                    }
                  >
                    {EDITOR_FONTS.map((value) => (
                      <option key={value} value={value}>
                        {t(`font${value}`)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <Tabs.Content
                value="editor"
                forceMount
                hidden={contentTab !== "editor"}
                className={styles.editorPanel}
                data-font={font}
              >
                <p className={styles.markdownHint}>{t("markdownHint")}</p>
                <SourceEditor
                  ref={source}
                  value={draft.markdown}
                  onChange={(markdown) => onChange({ ...draft, markdown })}
                />
              </Tabs.Content>
              <Tabs.Content value="preview">
                <IncidentPreview
                  source={draft.markdown}
                  resolveEntity={resolveEntity}
                  resolveAsset={resolveAsset}
                  onDetails={setDetails}
                />
              </Tabs.Content>
            </Tabs.Root>
            <div className={styles.documentStatus}>
              <span
                className={
                  draft.markdown.length > 15000 ? styles.warning : undefined
                }
              >
                {t("characters", { count: draft.markdown.length })}
              </span>
              <span
                className={
                  wordCount(draft.markdown) > 2500 ? styles.warning : undefined
                }
              >
                {t("words", { count: wordCount(draft.markdown) })}
              </span>
              <span>Markdown</span>
            </div>
          </Tabs.Content>
          <div className={styles.actions}>
            <ArchiveButton tone="paper" onClick={() => setChecked(true)}>
              {t("check")}
            </ArchiveButton>
            <div>
              <ArchiveButton
                tone="paper"
                disabled
                aria-describedby="editor-submit-note"
              >
                {t("submit")}
              </ArchiveButton>
              <small id="editor-submit-note">
                {t("submissionUnavailable")}
              </small>
            </div>
          </div>
          {checked && (
            <section className={styles.validation} aria-live="polite">
              <h3>{t("checkTitle")}</h3>
              {checkDraft(draft, registry).length ? (
                <ul>
                  {checkDraft(draft, registry).map((issue) => (
                    <li key={issue}>{t(issue)}</li>
                  ))}
                </ul>
              ) : (
                <p>{t("checkClear")}</p>
              )}
            </section>
          )}
        </div>
        {!mobile && (
          <aside className={styles.sidebar} aria-label={t("sidebar")}>
            {sidebar}
          </aside>
        )}
      </Tabs.Root>
      {mobile && (
        <EditorModal
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          title={t("sidebar")}
          drawer
        >
          {sidebar}
        </EditorModal>
      )}
      <EditorModal
        open={!!restricted}
        onClose={() => setRestricted(null)}
        title={t("restrictedTitle")}
      >
        <p className={styles.noticeText}>{t("restrictedNotice")}</p>
        <label className={styles.acknowledgement}>
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
          />
          {t("acknowledge")}
        </label>
        <ArchiveButton
          tone="paper"
          disabled={!acknowledged}
          onClick={() => {
            if (restricted) onChange(importCharacter(draft, restricted, true));
            setRestricted(null);
          }}
        >
          {t("confirmImport")}
        </ArchiveButton>
      </EditorModal>
      <EditorModal
        open={!!details}
        onClose={() => setDetails(null)}
        title={t("details")}
      >
        <div className={styles.detailBody}>
          <code>{details}</code>
          <h3>{entity?.name ?? t("unresolvedLabel")}</h3>
          {entity?.usage && (
            <p>
              {t(
                entity.usage === "restricted" ? "restrictedUsage" : "openUsage",
              )}
            </p>
          )}
          {entity && <p>{t(`kind${entity.kind}`)}</p>}
        </div>
      </EditorModal>
    </>
  );
}
