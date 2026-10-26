"use client";

import { useTranslations } from "next-intl";
import { ArchiveButton } from "@/components/archive-site/archive-button";
import styles from "@/components/archive-site/archive-site.module.css";

export default function RecordsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("site");
  return (
    <main id="site-content" className={styles.page}>
      <div className={styles.searchError} role="alert">
        <h1 className={styles.title}>{t("searchErrorTitle")}</h1>
        <p>{t("searchErrorBody")}</p>
        <ArchiveButton type="button" onClick={reset}>
          {t("searchErrorRetry")}
        </ArchiveButton>
      </div>
    </main>
  );
}
