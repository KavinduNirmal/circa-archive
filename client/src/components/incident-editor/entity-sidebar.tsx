"use client";
import { Tabs } from "radix-ui";
import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import {
  addTemporary,
  attachmentError,
  attachmentReferences,
  ENTITY_KINDS,
  references,
  type IncidentDraft,
  type RegistryEntity,
} from "@/lib/incident-editor/model";
import { ArchiveButton } from "../archive-site/archive-button";
import styles from "./editor.module.css";

export type SidebarProps = {
  draft: IncidentDraft;
  registry: RegistryEntity[];
  onChange: (draft: IncidentDraft) => void;
  onImport: (entity: RegistryEntity) => void;
  onInsert: (text: string) => void;
  onDetails: (code: string) => void;
};

export function EntitySidebar({
  draft,
  registry,
  onChange,
  onImport,
  onInsert,
  onDetails,
}: SidebarProps) {
  const t = useTranslations("editor");
  const uid = useId();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"CHR" | "ORG" | "ITM">("CHR");
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const mentioned = [
    ...new Set([
      ...references(draft.markdown),
      ...attachmentReferences(draft.markdown),
    ]),
  ];
  const allEntities = [...registry, ...draft.entities];
  const results = registry.filter((entity) =>
    `${entity.code} ${entity.name}`.toLowerCase().includes(query.toLowerCase()),
  );
  function remove(code: string) {
    const entity = draft.entities.find((entity) => entity.code === code);
    onChange({
      ...draft,
      imports: draft.imports.filter((value) => value !== code),
      acknowledgements: draft.acknowledgements.filter(
        (value) => value !== code,
      ),
      entities: draft.entities.filter((value) => value.code !== code),
      assets: draft.assets.filter((value) => value.id !== entity?.assetId),
    });
  }
  function attach() {
    if (!file) return;
    const issue =
      attachmentError(file, draft.assets) ??
      (!caption.trim() ? "captionRequired" : null);
    if (issue) {
      setError(issue);
      return;
    }
    const assetId = crypto.randomUUID();
    const next = addTemporary(draft, "EVI", caption);
    next.entities[next.entities.length - 1] = {
      ...next.entities[next.entities.length - 1],
      assetId,
      caption: caption.trim(),
    };
    next.assets = [
      ...draft.assets,
      { id: assetId, blob: file, name: file.name },
    ];
    onChange(next);
    setCaption("");
    setFile(null);
    setError(null);
  }
  function card(entity: RegistryEntity, temporary = false) {
    const imported = draft.imports.includes(entity.code);
    const evidence = draft.entities.find(
      (value) => value.code === entity.code && value.assetId,
    );
    return (
      <li key={entity.code} className={styles.entityCard}>
        <button
          className={styles.entityHeading}
          onClick={() => onDetails(entity.code)}
        >
          <code>{entity.code}</code>
          <strong>{entity.name}</strong>
        </button>
        {entity.kind === "CHR" && (
          <span className={styles.entityStatus}>
            {imported
              ? t("imported")
              : entity.usage === "restricted"
                ? t("restrictedUsage")
                : t("openUsage")}
          </span>
        )}
        <div className={styles.entityActions}>
          {entity.kind === "CHR" && !imported ? (
            <ArchiveButton tone="paper" onClick={() => onImport(entity)}>
              {t("import")}
            </ArchiveButton>
          ) : (
            <ArchiveButton
              tone="paper"
              onClick={() => onInsert(`[[${entity.code}]]`)}
            >
              {t("insert")}
            </ArchiveButton>
          )}
          {evidence && (
            <ArchiveButton
              tone="paper"
              onClick={() => {
                const safeCaption = (evidence.caption ?? evidence.name).replace(
                  /[\[\]\\\r\n|]/g,
                  " ",
                );
                onInsert(`\n\n![full|${safeCaption}](${entity.code})\n\n`);
              }}
            >
              {t("insertImage")}
            </ArchiveButton>
          )}
          {(temporary || imported) && (
            <ArchiveButton tone="paper" onClick={() => remove(entity.code)}>
              {t("remove")}
            </ArchiveButton>
          )}
        </div>
      </li>
    );
  }
  return (
    <Tabs.Root defaultValue="links" className={styles.sidebarTabs}>
      <Tabs.List className={styles.sidebarTabList} aria-label={t("sidebar")}>
        <Tabs.Trigger value="links">{t("linksTab")}</Tabs.Trigger>
        <Tabs.Trigger value="imports">{t("importsTab")}</Tabs.Trigger>
        <Tabs.Trigger value="info">{t("infoTab")}</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="links" className={styles.sidebarPanel}>
        <h3>{t("outgoing")}</h3>
        {!mentioned.length && (
          <p className={styles.empty}>{t("noReferences")}</p>
        )}
        {ENTITY_KINDS.map((kind) => {
          const codes = mentioned.filter((code) =>
            code.replace(/^TEMP-/, "").startsWith(`${kind}-`),
          );
          if (!codes.length) return null;
          return (
            <section key={kind} className={styles.referenceGroup}>
              <h4>
                {t(`kind${kind}`)} <span>{codes.length}</span>
              </h4>
              <ul>
                {codes.map((code) => {
                  const entity = allEntities.find(
                    (entity) => entity.code === code,
                  );
                  const missing =
                    entity?.kind === "CHR" && !draft.imports.includes(code);
                  return (
                    <li key={code}>
                      <button
                        className={styles.entityHeading}
                        onClick={() => onDetails(code)}
                      >
                        <code>{code}</code>
                        {entity && <span>{entity.name}</span>}
                      </button>
                      {(!entity || missing) && (
                        <small className={styles.warning}>
                          {t(missing ? "needsImport" : "unresolvedLabel")}
                        </small>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
        <section className={styles.referenceGroup}>
          <h3>{t("backlinks")}</h3>
          <p>{t("noBacklinks")}</p>
        </section>
        <section className={styles.referenceGroup}>
          <h3>{t("kindCHR")}</h3>
          <ul>
            {draft.imports
              .map((code) => allEntities.find((entity) => entity.code === code))
              .filter((entity): entity is RegistryEntity => !!entity)
              .map((entity) => card(entity, entity.code.startsWith("TEMP-")))}
          </ul>
        </section>
      </Tabs.Content>
      <Tabs.Content value="imports" className={styles.sidebarPanel}>
        <p className={styles.fixtureNote}>{t("fixtureNote")}</p>
        <div className={styles.field}>
          <label htmlFor={`${uid}-search`}>{t("search")}</label>
          <input
            id={`${uid}-search`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            type="search"
          />
        </div>
        <ul className={styles.registryResults}>
          {results.map((entity) => card(entity))}
        </ul>
        {!results.length && <p>{t("noResults")}</p>}
        <section className={styles.referenceGroup}>
          <h3>{t("newEntity")}</h3>
          <p>{t("temporaryHint")}</p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              onChange(addTemporary(draft, kind, name));
              setName("");
            }}
          >
            <div className={styles.field}>
              <label htmlFor={`${uid}-kind`}>{t("entityType")}</label>
              <select
                id={`${uid}-kind`}
                value={kind}
                onChange={(event) => setKind(event.target.value as typeof kind)}
              >
                {(["CHR", "ORG", "ITM"] as const).map((value) => (
                  <option key={value} value={value}>
                    {t(`kind${value}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor={`${uid}-name`}>{t("entityName")}</label>
              <input
                required
                maxLength={120}
                id={`${uid}-name`}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <ArchiveButton tone="paper" type="submit" disabled={!name.trim()}>
              {t("create")}
            </ArchiveButton>
          </form>
        </section>
        <section className={styles.referenceGroup}>
          <h3>{t("imageTitle")}</h3>
          <p>{t("imageHint")}</p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              attach();
            }}
          >
            <div className={styles.field}>
              <label htmlFor={`${uid}-file`}>{t("imageFile")}</label>
              <input
                key={draft.assets.length}
                id={`${uid}-file`}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null);
                  setError(null);
                }}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor={`${uid}-caption`}>{t("caption")}</label>
              <input
                id={`${uid}-caption`}
                value={caption}
                maxLength={500}
                onChange={(event) => setCaption(event.target.value)}
              />
            </div>
            {error && (
              <p className={styles.warning} role="alert">
                {t(error)}
              </p>
            )}
            <ArchiveButton tone="paper" type="submit" disabled={!file}>
              {t("attach")}
            </ArchiveButton>
          </form>
        </section>
        <section className={styles.referenceGroup}>
          <h3>{t("temporaryEntities")}</h3>
          <ul>{draft.entities.map((entity) => card(entity, true))}</ul>
          {!draft.entities.length && <p>{t("noTemporary")}</p>}
        </section>
      </Tabs.Content>
      <Tabs.Content value="info" className={styles.sidebarPanel}>
        <h3>{t("infoTab")}</h3>
        <p className={styles.fixtureNote}>{t("localOnly")}</p>
        <dl className={styles.draftInfo}>
          <dt>{t("draftId")}</dt>
          <dd>
            <code>{draft.id}</code>
          </dd>
          {["referenceId", "holderCode", "filedBy", "filedAt"].map((key) => (
            <div key={key}>
              <dt>{t(key)}</dt>
              <dd>{t("assignedLater")}</dd>
            </div>
          ))}
        </dl>
      </Tabs.Content>
    </Tabs.Root>
  );
}
