"use client";

import { useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import {
  ArrowRight,
  BookOpen,
  FileText,
  Paperclip,
  UserRound,
  Building2,
  MessageSquare,
  FolderOpen,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { IncidentDraft } from "@/lib/incident-editor/model";
import {
  browserDraftStorage,
  type DraftStorage,
} from "@/lib/incident-editor/storage";
import styles from "./archive-write.module.css";

const actions = [
  { key: "Incident", code: "INC", icon: FileText },
  { key: "Evidence", code: "EVI", icon: Paperclip },
  { key: "Character", code: "CHR", icon: UserRound },
  { key: "Organization", code: "ORG", icon: Building2 },
  { key: "Rumour", code: "RUM", icon: MessageSquare },
] as const;

export function ArchiveWrite({
  storage = browserDraftStorage,
}: {
  storage?: DraftStorage;
}) {
  const t = useTranslations("site");
  const format = useFormatter();
  const [draft, setDraft] = useState<IncidentDraft | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  useEffect(() => {
    let active = true;
    storage
      .load()
      .then((saved) => {
        if (active) {
          setDraft(saved);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [storage]);
  const savedDate = draft ? new Date(draft.updatedAt) : null;
  return (
    <main id="site-content" tabIndex={-1} className={styles.page}>
      <Link
        href="/meta/documentation/author-guide"
        className={styles.guidelines}
      >
        <BookOpen size={22} aria-hidden="true" />
        <span>
          <strong>{t("writeGuidelines")}</strong>
          <span className={styles.detail}>{t("writeGuidelinesDetail")}</span>
        </span>
        <ArrowRight size={20} aria-hidden="true" />
      </Link>
      <header className={styles.heading}>
        <p className={styles.kicker}>{t("writeKicker")}</p>
        <h1>{t("writeTitle")}</h1>
        <p>{t("writeIntro")}</p>
      </header>
      <div className={styles.actions}>
        {actions.map(({ key, code, icon: Icon }) => {
          const content = (
            <>
              <span className={styles.cardHead}>
                <span className={styles.symbol}>
                  <Icon size={22} strokeWidth={1.5} aria-hidden="true" />
                  <span aria-hidden="true">{code}</span>
                </span>
                <span className={styles.actionLabel}>
                  {key === "Incident" ? t("writeOpen") : t("writeSoon")}
                  {key === "Incident" && (
                    <ArrowRight size={18} aria-hidden="true" />
                  )}
                </span>
              </span>
              <span className={styles.copy}>
                <strong>{t(`write${key}`)}</strong>
                <span className={styles.detail}>{t(`write${key}Detail`)}</span>
              </span>
            </>
          );
          return key === "Incident" ? (
            <Link
              key={key}
              href="/site/write/editor"
              className={`${styles.card} ${styles.available}`}
            >
              {content}
            </Link>
          ) : (
            <button key={key} type="button" disabled className={styles.card}>
              {content}
            </button>
          );
        })}
      </div>
      <section className={styles.drafts} aria-labelledby="drafts-title">
        <div className={styles.draftHeading}>
          <h2 id="drafts-title">{t("writeDrafts")}</h2>
          <FolderOpen size={20} aria-hidden="true" />
        </div>
        <p className={styles.note}>{t("writeDraftNote")}</p>
        {status === "loading" && (
          <p role="status" className={styles.empty}>
            {t("writeLoading")}
          </p>
        )}
        {status === "error" && (
          <p role="status" className={styles.empty}>
            {t("writeError")}
          </p>
        )}
        {status === "ready" &&
          (draft ? (
            <ul className={styles.draftList}>
              <li>
                <Link href="/site/write/editor" className={styles.draftRow}>
                  <FileText size={22} aria-hidden="true" />
                  <span className={styles.copy}>
                    <strong>
                      {draft.form.designation.trim() || t("writeUntitled")}
                    </strong>
                    {savedDate && !Number.isNaN(savedDate.getTime()) && (
                      <span className={styles.detail}>
                        {t("writeSaved", {
                          date: format.dateTime(savedDate, {
                            dateStyle: "medium",
                            timeZone: "UTC",
                          }),
                        })}
                      </span>
                    )}
                  </span>
                  <span className={styles.actionLabel}>
                    {t("writeResume")}
                    <ArrowRight size={18} aria-hidden="true" />
                  </span>
                </Link>
              </li>
            </ul>
          ) : (
            <div className={styles.empty}>
              <strong>{t("writeEmpty")}</strong>
              <p>{t("writeEmptyDetail")}</p>
            </div>
          ))}
      </section>
    </main>
  );
}
