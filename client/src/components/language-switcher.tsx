"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import "./language-switcher.css";

/**
 * The reader's own choice of language, which outranks their browser's preference.
 *
 * Detection gets a first visit right, but only the reader knows what they want to
 * read in, so this control is what writes the cookie the proxy prefers next time.
 * Each option links to the page the reader is already on in the other language
 * rather than to the site root, so changing language never loses their place.
 *
 * It is deliberately colourless, inheriting the surrounding text colour: the same
 * control sits on the landing page's dark utility bar and in the workstation's
 * taskbar, and neither context should have to style it.
 */
export function LanguageSwitcher({
  className,
  short,
}: {
  className?: string;
  short?: boolean;
}) {
  const active = useLocale();
  /*
   * The router can be absent — a unit test renders this outside the App Router,
   * and a component can mount before the router is ready. Falling back to the
   * root keeps the control working: it still changes the language, it just
   * cannot promise to return the reader to the page they were on.
   */
  const pathname = (usePathname() as string | null) ?? "/";
  const t = useTranslations("switcher");

  return (
    <nav
      className={className ? `circa-language ${className}` : "circa-language"}
      aria-label={t("label")}
    >
      {routing.locales.map((locale) => (
        <Link
          key={locale}
          href={pathname}
          locale={locale}
          hrefLang={locale}
          className="circa-language-option"
          data-active={locale === active ? "true" : undefined}
          aria-current={locale === active ? "true" : undefined}
        >
          {short ? locale.toUpperCase() : t(locale)}
        </Link>
      ))}
    </nav>
  );
}
