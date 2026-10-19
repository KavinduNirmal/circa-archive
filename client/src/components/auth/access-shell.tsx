import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "../language-switcher";
import { ArchiveButton } from "../archive-site/archive-button";
import archive from "../archive-site/archive-site.module.css";
import styles from "./auth.module.css";

export function AccessShell({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  const t = useTranslations("auth");
  const site = useTranslations("site");
  return <div className={archive.shell}>
    <a href="#access-content" className={archive.skip}>{t("skip")}</a>
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href="/site" className={archive.brand}>
          <span className={archive.brandMark} aria-hidden="true" />
          <span className={archive.brandText}><strong>{site("brandName")}</strong></span>
        </Link>
        <div className={styles.tools}>
          <LanguageSwitcher short />
          <ArchiveButton href="/site">{t("returnArchive")}</ArchiveButton>
        </div>
      </div>
    </header>
    <main id="access-content" tabIndex={-1} className={styles.sheet}>
      <p className={styles.kicker}>{t("registry")}</p>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.intro}>{intro}</p>
      {children}
    </main>
    <footer className={styles.footer}>{t("footer")}</footer>
  </div>;
}
