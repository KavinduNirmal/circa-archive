/**
 * Where the project lives outside this site, and what it is licensed under.
 *
 * The project page is the only page allowed to point at the repository, at the
 * funding page, or at a licence deed, so those addresses are declared once here
 * instead of being repeated in the markup. Each can be overridden by a deployment
 * without editing a component; the repository and the funding page default to
 * the maintainer's published repository and sponsorship page.
 */
const HANDLE = "KavinduNirmal";

/** The one account credited as maintainer until someone else is on file. */
export const MAINTAINER = HANDLE;

/** The published repository. A deployment can point at a mirror instead. */
const REPOSITORY = `https://github.com/${HANDLE}/circa-archive`;

export const PROJECT_LINKS = {
  repository: process.env.PROJECT_REPOSITORY_URL ?? REPOSITORY,
  sponsor: process.env.PROJECT_SPONSOR_URL ?? `https://github.com/sponsors/${HANDLE}`,
};

/**
 * The three doors out of the page: a defect, a proposal, and everything else.
 * The first two point at the repository's issue templates, which exist; the third
 * falls back to a blank issue until the project has an address to publish.
 */
export const ISSUES = {
  bug: `${PROJECT_LINKS.repository}/issues/new?template=bug_report.yml`,
  feature: `${PROJECT_LINKS.repository}/issues/new?template=feature_request.yml`,
  contact: process.env.PROJECT_CONTACT_URL ?? `${PROJECT_LINKS.repository}/issues/new`,
};

/**
 * The two licences. Code and fiction are different kinds of work, so they carry
 * different terms; the names are licence identifiers rather than copy, which is
 * why they are not in the catalog.
 */
export const LICENCES = {
  code: { name: "MIT", href: "https://opensource.org/license/mit" },
  content: { name: "CC BY-NC-SA 4.0", href: "https://creativecommons.org/licenses/by-nc-sa/4.0/" },
} as const;

/** External links leave the site, so every one of them opens the same way. */
export const EXTERNAL = { target: "_blank", rel: "noreferrer" } as const;
