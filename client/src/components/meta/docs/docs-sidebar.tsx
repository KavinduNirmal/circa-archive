"use client";

import * as React from "react";
import { AlertTriangle, ChevronDown, Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Input } from "../../ui/input";

export type DocsSidebarGroup = Readonly<{
  label: string;
  items: readonly {
    label: string;
    href: string;
    slug: string;
    number: string;
    text?: string;
  }[];
}>;

export type DocsSidebarLabels = Readonly<{
  contents: string;
  search: string;
  searchPlaceholder: string;
  noResults: string;
  results: string;
  close: string;
  searchPartial?: string;
}>;

/**
 * The documentation index searches the complete fetched locale corpus in the
 * browser. All nine navigation links remain available before hydration. The mobile version
 * is a native disclosure, so it needs no JavaScript of its own and keeps the
 * reading order intact when the sidebar moves above the article.
 */
export function DocsSidebar({
  groups,
  currentSlug,
  labels,
  partial = false,
}: Readonly<{
  groups: readonly DocsSidebarGroup[];
  currentSlug: string;
  labels: DocsSidebarLabels;
  partial?: boolean;
}>) {
  const [query, setQuery] = React.useState("");
  const desktopInput = React.useRef<HTMLInputElement>(null);
  const mobileInput = React.useRef<HTMLInputElement>(null);
  const mobileDisclosure = React.useRef<HTMLDetailsElement>(null);
  React.useEffect(() => {
    function focusInput() {
      if (window.matchMedia?.("(max-width: 900px)").matches) {
        if (mobileDisclosure.current) mobileDisclosure.current.open = true;
        mobileInput.current?.focus();
      } else desktopInput.current?.focus();
    }
    function focusSearch(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "k")
        return;
      event.preventDefault();
      focusInput();
    }
    function focusFromHash() {
      if (window.location.hash === "#documentation-search") focusInput();
    }
    focusFromHash();
    window.addEventListener("hashchange", focusFromHash);
    window.addEventListener("keydown", focusSearch);
    return () => {
      window.removeEventListener("hashchange", focusFromHash);
      window.removeEventListener("keydown", focusSearch);
    };
  }, []);
  const needle = query.trim().toLowerCase();

  const filtered = React.useMemo(
    () =>
      groups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) =>
            `${item.label} ${item.text ?? ""}`.toLowerCase().includes(needle),
          ),
        }))
        .filter((group) => group.items.length > 0),
    [groups, needle],
  );

  const count = filtered.reduce(
    (total, group) => total + group.items.length,
    0,
  );
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
                      <span
                        className="meta-docs-link-number"
                        aria-hidden="true"
                      >
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
      <div className="meta-docs-search-field">
        <Search
          className="meta-docs-search-icon"
          aria-hidden="true"
          size={14}
        />
        <Input
          id={id}
          ref={id.endsWith("desktop") ? desktopInput : mobileInput}
          aria-keyshortcuts="Control+k Meta+k"
          onKeyDown={(event) => {
            if (event.key === "Escape") setQuery("");
          }}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={labels.searchPlaceholder}
          aria-label={labels.search}
          autoComplete="off"
          className="meta-docs-search-input"
        />
      </div>
      <p className="meta-docs-search-status meta-sr" aria-live="polite">
        {labels.results.replace("%count%", String(count))}
      </p>
      {needle.length > 0 && partial && labels.searchPartial && (
        <div className="meta-docs-search-warning" role="status">
          <AlertTriangle
            className="meta-docs-search-warning-icon"
            aria-hidden="true"
            size={13}
          />
          <span>{labels.searchPartial}</span>
        </div>
      )}
    </div>
  );

  return (
    <>
      <details className="meta-docs-mobile" ref={mobileDisclosure}>
        <summary>
          <span>
            {groups
              .flatMap((group) => group.items)
              .find((item) => item.slug === currentSlug)?.label ??
              labels.contents}
          </span>
          <ChevronDown aria-hidden="true" size={16} />
        </summary>
        <div className="meta-docs-mobile-body">
          {search(`${groupId}-mobile`)}
          {nav}
        </div>
      </details>

      <div className="meta-docs-sidebar-inner">
        <p className="meta-docs-group-title">
          {labels.contents} <kbd>Ctrl / ⌘ K</kbd>
        </p>
        {search(`${groupId}-desktop`)}
        {nav}
      </div>
    </>
  );
}
