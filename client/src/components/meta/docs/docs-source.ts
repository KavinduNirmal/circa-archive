import { PROJECT_LINKS } from '../meta-links';
import { DOC_TOPICS, docHref, type DocTopic } from './docs-topics';

const branch = process.env.PROJECT_DOCUMENTATION_REF ?? 'develop';
const repository = PROJECT_LINKS.repository.replace(/\/$/, '');
function repositoryPath() {
  const url = new URL(repository);
  if (url.protocol !== 'https:' || url.hostname !== 'github.com' || !/^\/[^/]+\/[^/]+$/.test(url.pathname)) {
    throw new Error('Documentation requires a public GitHub repository URL');
  }
  return url.pathname;
}
const encodePath = (path: string) => path.split('/').map(encodeURIComponent).join('/');

export function sourcePath(topic: DocTopic, locale: string) {
  if (locale !== 'en' && locale !== 'ko') throw new Error('Unsupported documentation locale');
  if (topic.sourceFile) return topic.sourceFile;
  return `docs/documentation/${locale}/${topic.slug}.md`;
}

export function sourceUrl(path: string, action: 'blob' | 'edit' | 'raw' = 'blob') {
  const project = repositoryPath();
  const ref = encodeURIComponent(branch);
  return action === 'raw'
    ? `https://raw.githubusercontent.com${project}/${ref}/${encodePath(path)}`
    : `${repository}/${action}/${ref}/${encodePath(path)}`;
}

export function resolveDocLink(href: string, path: string, image = false) {
  if (!href || href.startsWith('#') || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href)) return href;
  const resolved = new URL(href, `https://repository.local/${path}`);
  const target = decodeURIComponent(resolved.pathname.slice(1));
  if (!image) {
    for (const locale of ['en', 'ko']) {
      const topic = DOC_TOPICS.find(candidate => sourcePath(candidate, locale) === target);
      if (topic) return `/${locale}${docHref(topic.slug)}${resolved.search}${resolved.hash}`;
    }
  }
  return sourceUrl(target, image ? 'raw' : 'blob') + resolved.search + resolved.hash;
}

export async function loadDocument(topic: DocTopic, locale: string): Promise<string> {
  const response = await fetch(sourceUrl(sourcePath(topic, locale), 'raw'), {
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Documentation unavailable (${response.status})`);
  return response.text();
}

export type DocumentationEntry = { slug: string; markdown: string | null };
export async function loadDocumentation(locale: string): Promise<DocumentationEntry[]> {
  return Promise.all(DOC_TOPICS.map(async topic => {
    try { return { slug: topic.slug, markdown: await loadDocument(topic, locale) }; }
    catch { return { slug: topic.slug, markdown: null }; }
  }));
}

export async function loadDocumentUpdatedAt(topic: DocTopic, locale: string): Promise<string | null> {
  try {
    const query = new URLSearchParams({ path: sourcePath(topic, locale), sha: branch, per_page: "1" });
    const response = await fetch(`https://api.github.com/repos${repositoryPath()}/commits?${query}`, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const commits: unknown = await response.json();
    const date = Array.isArray(commits) ? commits[0]?.commit?.committer?.date : null;
    return typeof date === "string" && Number.isFinite(Date.parse(date)) ? date : null;
  } catch {
    return null;
  }
}
