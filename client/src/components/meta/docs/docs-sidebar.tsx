"use client";

import * as React from "react";
import { ChevronDown, Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Input } from "../../ui/input";

export type DocsSidebarGroup = Readonly<{
  label: string;
  items: readonly { label: string; href: string; slug: string; number: string }[];
}>;

export type DocsSidebarLabels = Readonly<{
  contents: string;
  search: string;
  searchPlaceholder: string;
  noResults: string;
  results: string;
  close: string;
}>;

/**
 * The documentation index: grouped links, plus a filter that works on the labels
 * it is already rendering.
 *
 * Filtering happens in the browser because the index is nine links, not a search
 * service; every item is in the DOM before the reader types. The mobile version
 * is a native disclosure, so it needs no JavaScript of its own and keeps the
 * reading order intact when the sidebar moves above the article.
 */
export function DocsSidebar({
  groups,
  currentSlug,
  labels,
}: Readonly<{ groups: readonly DocsSidebarGroup[]; currentSlug: string; labels: DocsSidebarLabels }>) {
  const [query, setQuery] = React.useState("");
  const needle = query.trim().toLowerCase();

  const filtered = React.useMemo(
    () =>
      groups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => item.label.toLowerCase().includes(needle)),
        }))
        .filter((group) => group.items.length > 0),
    [groups, needle],
  );

  const count = filtered.reduce((total, group) => total + group.items.length, 0);
  const groupId = React.useId();

  const nav = (
    <nav className="meta-docs-nav" aria-label={labels.contents}>
      {filtered.length === 0 ? (
        <p className="meta-docs-empty">{labels.noResults}</p>
      ) : (
        filtered.map((group) => (
          <div className="meta-docs-group" key={group.label}>
            <p className="meta-docs-group-title">{group.label}</p>
            <ul>
              {group.items.map((item) => {
                const active = item.slug === currentSlug;
                return (
                  <li key={item.href}>
                    <Link
                      className="meta-docs-link"
                      href={item.href}
                      data-active={active ? "true" : undefined}
                      aria-current={active ? "page" : undefined}
                    >
                      <span className="meta-docs-link-number" aria-hidden="true">
                        {item.number}
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))
      )}
    </nav>
  );

  const search = (id: string) => (
    <div className="meta-docs-search">
      <label className="meta-docs-search-label" htmlFor={id}>
        {labels.search}
      </label>
      <div className="meta-docs-search-field">
        <Search className="meta-docs-search-icon" aria-hidden="true" size={14} />
        <Input
          id={id}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={labels.searchPlaceholder}
          autoComplete="off"
          className="meta-docs-search-input"
        />
      </div>
      <p className="meta-docs-search-status" aria-live="polite">
        {labels.results.replace("%count%", String(count))}
      </p>
    </div>
  );

  return (
    <>
      <details className="meta-docs-mobile">
        <summary>
          <span>{labels.contents}</span>
          <ChevronDown aria-hidden="true" size={16} />
        </summary>
        <div className="meta-docs-mobile-body">
          {search(`${groupId}-mobile`)}
          {nav}
        </div>
      </details>

      <div className="meta-docs-sidebar-inner">
        {search(`${groupId}-desktop`)}
        {nav}
      </div>
    </>
  );
}
