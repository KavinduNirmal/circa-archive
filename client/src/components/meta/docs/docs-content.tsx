import { isValidElement } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUpRight } from 'lucide-react';
import { CopyCode } from './copy-code';
import Markdown from 'react-markdown';
import { documentationPlugins, remarkDocumentPart } from './docs-markdown';
import { resolveDocLink } from './docs-source';

export function DocsBody({ markdown, path, part = "body" }: Readonly<{ markdown: string; path: string; part?: "title" | "body" }>) {
  const t = useTranslations("meta");
  return <div className="meta-doc-markdown">
    <Markdown remarkPlugins={[...documentationPlugins, [remarkDocumentPart, { part }]]} skipHtml components={{
      a: ({ href = '', children }) => {
        if (href.startsWith('#')) return <a href={href}>{children}</a>;
        const resolved = resolveDocLink(href, path);
        const isExternal = resolved.startsWith('http://') || resolved.startsWith('https://');
        return (
          <a
            href={resolved}
            className="meta-doc-link"
            {...(isExternal ? { target: '_blank', rel: 'noreferrer' } : {})}
          >
            <span>{children}</span>
            <ArrowUpRight className="meta-doc-link-icon" aria-hidden="true" size={13} />
          </a>
        );
      },
      // Repository assets retain their intrinsic dimensions and descriptive alt text.
      // eslint-disable-next-line @next/next/no-img-element
      img: ({ src, alt }) => <img src={typeof src === 'string' ? resolveDocLink(src, path, true) : undefined} alt={alt ?? ''} loading="lazy" />,
      table: ({ children }) => <div className="meta-doc-table-wrap" tabIndex={0}><table className="meta-doc-table">{children}</table></div>,
      h2: ({ id, children }) => <h2 id={id}><a href={`#${id}`}>{children}</a></h2>,
      h3: ({ id, children }) => <h3 id={id}><a href={`#${id}`}>{children}</a></h3>,
      mark: ({ children, className }) => <mark className={className ?? 'meta-doc-highlight'}>{children}</mark>,
      blockquote: ({ children, className, ...props }) => {
        const brand = (props as Record<string, unknown>)['data-brand'];
        if (brand === 'callout') {
          return <aside data-brand="callout" className="meta-doc-brand-callout">{children}</aside>;
        }
        if (brand === 'list') {
          return <div data-brand="list" className="meta-doc-brand-list-grid">{children}</div>;
        }
        return <blockquote className={className} {...props}>{children}</blockquote>;
      },
      pre: ({ children }) => {
        const code = isValidElement<{ children?: string; className?: string }>(children) ? children.props : null;
        const lang = (code?.className?.replace('language-', '') ?? '').toLowerCase();
        if (lang === 'brand-callout') {
          return <aside data-brand="callout" className="meta-doc-brand-callout">{code?.children}</aside>;
        }
        if (lang === 'brand-list' || lang === 'brand%20list') {
          return <div data-brand="list" className="meta-doc-brand-list-grid">{code?.children}</div>;
        }
        return code ? <CopyCode code={String(code.children ?? '').replace(/\n$/, '')} language={lang} label={t('docsCodeExample')} copyLabel={t('docsCopy')} copiedLabel={t('docsCopied')} failedLabel={t('docsCopyFailed')} /> : <pre>{children}</pre>;
      },
    }}>{markdown}</Markdown>
  </div>;
}
