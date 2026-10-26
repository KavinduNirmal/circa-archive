import { useTranslations } from "next-intl";
import { ArchiveButton } from "./archive-button";
import {
  ArchiveChrome,
  type ArchiveCrumb,
  type ArchiveSection,
} from "./archive-chrome";
import styles from "./archive-site.module.css";

/**
 * A reserved section of the reading edition.
 *
 * Some parts of the archive are named in the navigation before their indexes are
 * served here: the playlists a record appears in and the character directory.
 * The address still exists, so a reader who follows a link meets the archive's
 * own explanation and a way back to the index rather than a 404.
 */
export function ArchiveReserved({
  active,
  trail,
  title,
  lede,
  note,
  backHref = "/site/records",
  backLabel,
}: {
  active: ArchiveSection;
  trail: readonly ArchiveCrumb[];
  title: string;
  lede: string;
  note: string;
  backHref?: string;
  backLabel: string;
}) {
  const t = useTranslations("site");
  return (
    <ArchiveChrome active={active} trail={trail}>
      <main id="site-content" tabIndex={-1} className={styles.page}>
        <header className={styles.pageHead}>
          <p className={styles.kicker}>{t("crumbRegistry")}</p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.lede}>{lede}</p>
        </header>

        <div className={styles.emptyState} role="status">
          <p className={styles.emptyTitle}>{note}</p>
          <ArchiveButton tone="paper" href={backHref}>
            {backLabel}
          </ArchiveButton>
        </div>
      </main>
    </ArchiveChrome>
  );
}
