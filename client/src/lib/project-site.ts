import { locales } from "../i18n/routing";

function projectOrigin() {
  const url = new URL(
    process.env.PROJECT_SITE_ORIGIN ?? "http://localhost:4321",
  );
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "PROJECT_SITE_ORIGIN must be an HTTP(S) origin without a path or credentials",
    );
  }
  return url.origin;
}

/** External project link: do not send it through the archive's locale router. */
export function projectSiteHref(locale: string) {
  if (!locales.some((candidate) => candidate === locale))
    throw new Error("Unsupported project locale");
  return `${projectOrigin()}/${locale}/`;
}

/** Next also redirects when running directly, without the Nginx ingress. */
export function projectSiteRedirects() {
  return locales.flatMap((locale) => {
    const home = projectSiteHref(locale);
    return [
      { source: `/${locale}/meta`, destination: home, permanent: true },
      {
        source: `/${locale}/meta/about`,
        destination: `${home}about/project/`,
        permanent: true,
      },
      {
        source: `/${locale}/meta/documentation`,
        destination: `${home}documentation/`,
        permanent: true,
      },
      {
        source: `/${locale}/meta/documentation/overview`,
        destination: `${home}documentation/`,
        permanent: true,
      },
      {
        source: `/${locale}/meta/documentation/:slug`,
        destination: `${home}documentation/:slug/`,
        permanent: true,
      },
    ];
  });
}
