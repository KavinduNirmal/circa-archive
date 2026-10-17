import { useLocale, useTranslations } from "next-intl";
import styles from "./archive-site.module.css";

/**
 * The archive's search, as a plain GET form.
 *
 * It is a form and not a client widget: submitting it loads the index with the
 * query in the address, which is what makes the search work without JavaScript,
 * survive a bookmark, and stay cheap on a slow connection. The same component
 * is the compact box in the masthead and the large one on the home and index
 * pages.
 */
export function SiteSearch({ value = "", large = false }: { value?: string; large?: boolean }) {
  const t = useTranslations("site");
  const locale = useLocale();

  return (
    <form
      className={large ? `${styles.search} ${styles.searchLarge}` : styles.search}
      action={`/${locale}/site/records`}
      method="get"
      role="search"
      aria-label={t("searchLabel")}
    >
      <div className={styles.searchField}>
        <input
          name="q"
          type="search"
          defaultValue={value}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchLabel")}
          autoComplete="off"
        />
        <button type="submit" className={styles.searchButton}>{t("searchButton")}</button>
      </div>
      {large ? <p className={styles.searchHint}>{t("searchHint")}</p> : null}
    </form>
  );
}
