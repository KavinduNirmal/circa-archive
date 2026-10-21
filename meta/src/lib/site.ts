import en from "../../messages/en.json";
import ko from "../../messages/ko.json";

export const locales = ["en", "ko"] as const;
export type Locale = (typeof locales)[number];
export const catalogs: Record<Locale, Record<string, string>> = { en, ko };
export function t(locale: Locale, key: string): string {
  const value = catalogs[locale][key];
  if (value === undefined)
    throw new Error(`Missing ${locale} project message: ${key}`);
  return value;
}
export function isLocale(value: string): value is Locale {
  return locales.some((locale) => locale === value);
}
export function siteOrigin(value: string) {
  const url = new URL(value);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "Site origins must be HTTP(S) origins without paths or credentials",
    );
  }
  return url.origin;
}
export const PROJECT_ORIGIN = siteOrigin(
  process.env.PROJECT_SITE_ORIGIN ??
    import.meta.env?.PROJECT_SITE_ORIGIN ??
    "http://localhost:4321",
);
export const ARCHIVE_ORIGIN = siteOrigin(
  process.env.ARCHIVE_SITE_ORIGIN ??
    import.meta.env?.ARCHIVE_SITE_ORIGIN ??
    "http://localhost:3001",
);
export const REPOSITORY = (
  process.env.PROJECT_REPOSITORY_URL ??
  import.meta.env?.PROJECT_REPOSITORY_URL ??
  "https://github.com/KavinduNirmal/circa-archive"
).replace(/\/$/, "");
const repositoryUrl = new URL(REPOSITORY);
if (
  repositoryUrl.protocol !== "https:" ||
  repositoryUrl.hostname !== "github.com" ||
  !/^\/[^/]+\/[^/]+$/.test(repositoryUrl.pathname)
)
  throw new Error("Repository must be an HTTPS GitHub owner/repository URL");
export const SOURCE_REF =
  process.env.PROJECT_DOCUMENTATION_REF ??
  import.meta.env?.PROJECT_DOCUMENTATION_REF ??
  "develop";
export const SPONSOR =
  process.env.PROJECT_SPONSOR_URL ??
  import.meta.env?.PROJECT_SPONSOR_URL ??
  "https://github.com/sponsors/KavinduNirmal";
export const CONTACT =
  process.env.PROJECT_CONTACT_URL ??
  import.meta.env?.PROJECT_CONTACT_URL ??
  `${REPOSITORY}/issues/new`;
export const MAINTAINER = "KavinduNirmal";
export const LICENCES = {
  code: "https://opensource.org/license/mit",
  content: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};
export const projectHref = (locale: Locale, path = "") =>
  `/${locale}/${path.replace(/^\/+|\/+$/g, "")}${path.replace(/\//g, "") ? "/" : ""}`;
export const archiveHref = (locale: Locale, path = "/site") =>
  `${ARCHIVE_ORIGIN}/${locale}/${path.replace(/^\/+/, "")}`;
export const sourceUrl = (path: string, action: "blob" | "edit" = "blob") =>
  `${REPOSITORY}/${action}/${encodeURIComponent(SOURCE_REF)}/${path.split("/").map(encodeURIComponent).join("/")}`;
export const chapterLinks = (locale: Locale) => [
  {
    label: t(locale, "chapterOverview"),
    href: projectHref(locale, "documentation"),
  },
  {
    label: t(locale, "chapterLore"),
    href: projectHref(locale, "documentation/lore"),
  },
  {
    label: t(locale, "chapterContribution"),
    href: projectHref(locale, "documentation/contribution"),
  },
  {
    label: t(locale, "chapterBuilding"),
    href: projectHref(locale, "documentation/building"),
  },
];
export const aboutLinks = (locale: Locale) => [
  {
    label: t(locale, "navProject"),
    href: projectHref(locale, "about/project"),
  },
  { label: t(locale, "navTeam"), href: projectHref(locale, "about/team") },
  { label: t(locale, "navTerms"), href: projectHref(locale, "about/terms") },
];

export const COFFEE = "https://buymeacoffee.com/kavindunirmal";
export const TEAM = [
  {
    name: "Kavindu Nirmal",
    handle: MAINTAINER,
    initials: "KN",
    roleKey: "contributorsMaintainerRole",
    workKey: "contributorsMaintainerWork",
    portrait: "/portraits/kavindunirmal.jpg",
    profile: `https://github.com/${MAINTAINER}`,
  },
] as const;
