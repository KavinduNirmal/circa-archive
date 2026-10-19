import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadDocument, loadDocumentUpdatedAt, resolveDocLink, sourcePath, sourceUrl } from '@/components/meta/docs/docs-source';
import { docTopic } from '@/components/meta/docs/docs-topics';
const topic = docTopic('records')!;
afterEach(() => vi.unstubAllGlobals());
describe('repository documentation', () => {
  it('fetches exact Markdown with timed revalidation', async () => {
    const markdown = '# Records\n\n| a | b |\n';
    const fetcher = vi.fn().mockResolvedValue(new Response(markdown));
    vi.stubGlobal('fetch', fetcher);
    expect(await loadDocument(topic, 'ko')).toBe(markdown);
    expect(fetcher).toHaveBeenCalledWith('https://raw.githubusercontent.com/KavinduNirmal/circa-archive/develop/docs/documentation/ko/records.md', expect.objectContaining({ next: { revalidate: 300 } }));
  });
  it('reports upstream failure instead of rendering its response body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not found', { status: 404 })));
    await expect(loadDocument(topic, 'en')).rejects.toThrow();
  });
  it('resolves documents, assets and repository files relative to the source', () => {
    const path = sourcePath(topic, 'ko');
    expect(path).toBe('docs/documentation/ko/records.md');
    expect(sourceUrl(path, 'edit')).toBe('https://github.com/KavinduNirmal/circa-archive/edit/develop/docs/documentation/ko/records.md');
    expect(resolveDocLink('./rendering.md#plugins', path)).toBe('/ko/meta/documentation/rendering#plugins');
    expect(resolveDocLink('../../../GITFLOW.md', path)).toBe('https://github.com/KavinduNirmal/circa-archive/blob/develop/GITFLOW.md');
    expect(resolveDocLink('#section', path)).toBe('#section');
    expect(resolveDocLink('https://example.org', path)).toBe('https://example.org');
  });
  it('resolves author guide and lore documents and relative cross-links', () => {
    const authorTopic = docTopic('author-guide');
    const anatomyTopic = docTopic('lore-anatomy');
    expect(authorTopic).toBeDefined();
    expect(anatomyTopic).toBeDefined();
    expect(sourcePath(authorTopic!, 'en')).toBe('docs/AUTHOR_GUIDE.md');
    expect(sourcePath(anatomyTopic!, 'en')).toBe('docs/lore/Anatomy.md');
    expect(resolveDocLink('lore/README.md', 'docs/AUTHOR_GUIDE.md')).toBe('/en/meta/documentation/lore');
    expect(resolveDocLink('Anchors.md', 'docs/lore/Anatomy.md')).toBe('/en/meta/documentation/lore-anchors');
    expect(resolveDocLink('../AUTHOR_GUIDE.md', 'docs/lore/README.md')).toBe('/en/meta/documentation/author-guide');
  });
});

describe('documentation file history', () => {
  it('reads the last commit for the exact source file and ref', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify([{ commit: { committer: { date: '2026-10-15T10:00:00Z' } } }])));
    vi.stubGlobal('fetch', fetcher);
    expect(await loadDocumentUpdatedAt(topic, 'ko')).toBe('2026-10-15T10:00:00Z');
    const url = new URL(fetcher.mock.calls[0][0]);
    expect(url.pathname).toBe('/repos/KavinduNirmal/circa-archive/commits');
    expect(url.searchParams.get('path')).toBe('docs/documentation/ko/records.md');
    expect(url.searchParams.get('sha')).toBe('develop');
    expect(fetcher.mock.calls[0][1].next.revalidate).toBe(3600);
  });
  it('omits unverifiable dates when history is missing, malformed or rate limited', async () => {
    for (const response of [new Response('[]'), new Response('[{"commit":{"committer":{"date":"bad"}}}]'), new Response('', { status: 403 })]) {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
      expect(await loadDocumentUpdatedAt(topic, 'en')).toBeNull();
    }
  });
});
