import { useLocale, useTranslations } from "next-intl";
import type { SearchOutcome } from "@/lib/search/api";
import type { ArchiveDestination } from "@/lib/search/destination";
import { Link } from "@/i18n/navigation";
import { ArchiveChrome } from "./archive-chrome";
import { ArchiveButton } from "./archive-button";
import { RecordProse } from "./record-prose";
import styles from "./archive-site.module.css";

export function ArchiveApiOrganizations({
  query,
  outcome,
  destination,
}: {
  query: string;
  outcome: SearchOutcome;
  destination?: ArchiveDestination;
}) {
  const t = useTranslations("site");
  const locale = useLocale();
  return (
    <ArchiveChrome
      active="organizations"
      trail={[{ label: t("trailOrganizations") }]}
    >
      <main id="site-content" tabIndex={-1} className={styles.page}>
        <header className={styles.pageHead}>
          <h1 className={styles.title}>{t("orgTitle")}</h1>
          <p className={styles.lede}>{t("orgLede")}</p>
        </header>
        <form
          role="search"
          aria-label={t("orgSearchLabel")}
          action={`/${locale}/site/organizations`}
          method="get"
          className={styles.searchPage}
        >
          <div className={styles.searchField}>
            <input
              id="organization-query"
              aria-label={t("orgSearchLabel")}
              placeholder={t("orgSearchPlaceholder")}
              type="search"
              name="q"
              defaultValue={query}
              maxLength={200}
            />
            <ArchiveButton type="submit">{t("searchButton")}</ArchiveButton>
          </div>
        </form>
        {outcome.status !== "success" ? (
          <p role="alert">{t("searchErrorBody")}</p>
        ) : (
          <>
            {outcome.response.items.length === 0 && (
              <p>{t("searchNoMatchesHelp")}</p>
            )}
            {outcome.response.items.map((item) => (
              <article key={item.id} className={styles.sheet}>
                <h2>
                  <Link
                    href={`/site/organizations?q=${encodeURIComponent(item.code ?? item.displayCode)}`}
                  >
                    {item.title}
                  </Link>
                </h2>
                <p className="circa-mono">{item.displayCode}</p>
                {destination?.id === item.id &&
                destination.markdown !== null ? (
                  <RecordProse
                    source={destination.markdown}
                    redactionLabel={t("recordRedaction")}
                    imageNotHeld={t("figureNotHeld")}
                  />
                ) : (
                  <p>{item.excerpt}</p>
                )}
              </article>
            ))}
          </>
        )}
      </main>
    </ArchiveChrome>
  );
}
