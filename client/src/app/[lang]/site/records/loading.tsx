import { getTranslations } from "next-intl/server";
import { ArchiveChrome } from "@/components/archive-site/archive-chrome";
import { SiteSearch } from "@/components/archive-site/site-search";
import styles from "@/components/archive-site/archive-site.module.css";

export default async function RecordsLoading() {
  const t = await getTranslations("site");
  return (
    <ArchiveChrome active="records" trail={[{ label: t("trailRecords") }]}>
      <main id="site-content" className={styles.page} aria-busy="true">
        <p className={styles.kicker}>{t("crumbRegistry")}</p>
        <h1 className={styles.title}>{t("indexTitle")}</h1>
        <SiteSearch />
        <div className={styles.searchSkeleton} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <p role="status">{t("searchLoading")}</p>
      </main>
    </ArchiveChrome>
  );
}
