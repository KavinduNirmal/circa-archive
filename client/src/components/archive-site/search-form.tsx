"use client";

import { useEffect, useId, useSyncExternalStore, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { NativeSelect } from "@/components/ui/native-select";
import { useLocale, useTranslations } from "next-intl";
import { Search, SlidersHorizontal } from "lucide-react";
import { toSearchHref } from "@/lib/search/query";
import { savedSearchHref } from "@/lib/search/saved";
import {
  DISPLAY_STATUSES,
  RECORD_CLASSES,
  SEARCH_ENABLED_TYPES,
  SEARCH_FILTER_REGISTRY,
  SEARCH_LANGUAGES,
  SEARCH_LIMITS,
  SEARCH_PERIODS,
  SEARCH_SORTS,
  WARNING_DISCLOSURES,
  WARNING_TAGS,
  WARNING_TIERS,
  DEFAULT_SEARCH_STATE,
  type SearchState,
} from "@/lib/search/contract";
import { searchFixture } from "@/lib/search/fixture";
import styles from "./archive-site.module.css";

const optionKey = (value: string) =>
  `searchOption${value.replace(/(^|-)([a-z])/g, (_, _dash, letter: string) => letter.toUpperCase())}`;

export function SearchForm(props: {
  values?: SearchState;
  variant?: "page" | "masthead";
  source?: "fixture" | "api";
}) {
  return <SearchFormContents key={JSON.stringify(props.values)} {...props} />;
}

function SearchFormContents({
  values = DEFAULT_SEARCH_STATE,
  variant = "page",
  source = "fixture",
}: {
  values?: SearchState;
  variant?: "page" | "masthead";
  source?: "fixture" | "api";
}) {
  const t = useTranslations("site");
  const locale = useLocale();
  const idPrefix = variant === "masthead" ? "masthead" : "page";
  const [query, setQuery] = useState(values.q);
  const [language, setLanguage] = useState(values.language);
  const filterCount =
    Number(Boolean(values.holder)) +
    values.types.length +
    values.classes.length +
    values.statuses.length +
    values.warnings.length +
    values.disclosures.length +
    values.warningTags.length +
    values.excludedWarningTags.length +
    Number(Boolean(values.org)) +
    Number(Boolean(values.mention)) +
    Number(Boolean(values.author)) +
    Number(Boolean(values.tag)) +
    Number(Boolean(values.character)) +
    Number(Boolean(values.custody)) +
    Number(values.period !== "any") +
    Number(Boolean(values.from || values.to)) +
    Number(values.language !== "en");

  return (
    <form
      className={variant === "page" ? styles.searchPage : styles.search}
      action={`/${locale}/site/records`}
      method="get"
      role="search"
      aria-label={t("searchLabel")}
      onChange={(event) => {
        const field = event.target;
        if (field instanceof HTMLSelectElement && field.name === "language")
          setLanguage(field.value === "ko" ? "ko" : "en");
      }}
    >
      <div className={styles.searchField}>
        <label className={styles.srOnly} htmlFor={`${idPrefix}-q`}>
          {t("searchLabel")}
        </label>
        <Input
          id={`${idPrefix}-q`}
          name="q"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t(
            variant === "masthead"
              ? "searchPlaceholderShort"
              : "searchPlaceholder",
          )}
          autoComplete="off"
          list={`${idPrefix}-suggestions`}
        />
        <SearchSuggestions
          id={`${idPrefix}-suggestions`}
          query={query}
          language={language}
          source={source}
        />
        <Button type="submit">
          <Search size={12} strokeWidth={2} aria-hidden="true" />
          {t("searchButton")}
        </Button>
      </div>

      <details
        className={
          variant === "page" ? styles.pageFilterMenu : styles.filterMenu
        }
      >
        <Button
          asChild
          variant="outline"
          size="sm"
          className={styles.filterSummary}
        >
          <summary>
            <SlidersHorizontal size={12} aria-hidden="true" />
            {t("filtersLabel")} {filterCount > 0 ? `(${filterCount})` : ""}
          </summary>
        </Button>
        <FilterPanel
          idPrefix={idPrefix}
          values={values}
          compact={variant === "masthead"}
        />
      </details>
    </form>
  );
}

function FilterPanel({
  idPrefix,
  values,
  compact = false,
}: {
  idPrefix: string;
  values: SearchState;
  compact?: boolean;
}) {
  const t = useTranslations("site");
  const className = compact ? styles.filterPanel : styles.globalFilterPanel;
  const defaultSort = values.q || values.holder ? "relevance" : "newest";

  return (
    <div className={className}>
      <noscript>
        <style>{`[data-slot="checkbox"], [data-slot="checkbox"] ~ input[type="hidden"] { display: none; }`}</style>
      </noscript>
      <div className={styles.globalFilterGrid}>
        <label
          className={styles.globalTextField}
          htmlFor={`${idPrefix}-holder`}
        >
          <span>{t("searchHolderCode")}</span>
          <Input
            id={`${idPrefix}-holder`}
            name="holder"
            defaultValue={values.holder}
            maxLength={120}
          />
          <small>{t("searchHolderHint")}</small>
        </label>
        <FilterSet
          id={`${idPrefix}-type`}
          name="type"
          label={t("searchType")}
          values={SEARCH_ENABLED_TYPES}
          selected={values.types}
          t={t}
        />
        {SEARCH_FILTER_REGISTRY.map((filter) => (
          <RegisteredFilter
            key={filter.key}
            id={`${idPrefix}-${filter.key}`}
            filter={filter}
            value={values[filter.key]}
            t={t}
          />
        ))}
        <FilterSet
          id={`${idPrefix}-class`}
          name="class"
          label={t("searchClass")}
          values={RECORD_CLASSES}
          selected={values.classes}
          t={t}
        />
        <FilterSet
          id={`${idPrefix}-status`}
          name="status"
          label={t("searchStatus")}
          values={DISPLAY_STATUSES.filter((value) =>
            ["on-file", "contested", "sealed"].includes(value),
          )}
          selected={values.statuses}
          t={t}
        />
        <FilterSet
          id={`${idPrefix}-warn`}
          name="warn"
          label={t("searchWarningTier")}
          values={WARNING_TIERS}
          selected={values.warnings}
          t={t}
        />
        <FilterSet
          id={`${idPrefix}-disclosure`}
          name="disclosure"
          label={t("searchDisclosure")}
          values={WARNING_DISCLOSURES}
          selected={values.disclosures}
          t={t}
        />
        <FilterSet
          id={`${idPrefix}-warnTag`}
          name="warnTag"
          label={t("searchWarningTags")}
          values={WARNING_TAGS}
          selected={values.warningTags}
          excluded={values.excludedWarningTags}
          t={t}
        />
        <label
          className={styles.globalSelectField}
          htmlFor={`${idPrefix}-period`}
        >
          <span>{t("filterFiled")}</span>
          <NativeSelect
            id={`${idPrefix}-period`}
            name="period"
            defaultValue={values.period === "any" ? "" : values.period}
          >
            {SEARCH_PERIODS.map((period) => (
              <option key={period} value={period === "any" ? "" : period}>
                {t(optionKey(period))}
              </option>
            ))}
          </NativeSelect>
        </label>
        <div className={styles.globalDateFields}>
          <label htmlFor={`${idPrefix}-from`}>
            {t("searchFrom")}
            <Input
              id={`${idPrefix}-from`}
              type="date"
              name="from"
              defaultValue={values.from}
            />
          </label>
          <label htmlFor={`${idPrefix}-to`}>
            {t("searchTo")}
            <Input
              id={`${idPrefix}-to`}
              type="date"
              name="to"
              defaultValue={values.to}
            />
          </label>
        </div>
        <label
          className={styles.globalSelectField}
          htmlFor={`${idPrefix}-language`}
        >
          <span>{t("searchLanguage")}</span>
          <NativeSelect
            id={`${idPrefix}-language`}
            name="language"
            defaultValue={values.language === "en" ? "" : values.language}
          >
            {SEARCH_LANGUAGES.map((language) => (
              <option key={language} value={language === "en" ? "" : language}>
                {t(optionKey(language))}
              </option>
            ))}
          </NativeSelect>
        </label>
        <label
          className={styles.globalSelectField}
          htmlFor={`${idPrefix}-sort`}
        >
          <span>{t("searchSort")}</span>
          <NativeSelect
            id={`${idPrefix}-sort`}
            name="sort"
            defaultValue={values.sort === defaultSort ? "" : values.sort}
          >
            {SEARCH_SORTS.map((sort) => (
              <option key={sort} value={sort === defaultSort ? "" : sort}>
                {t(optionKey(sort))}
              </option>
            ))}
          </NativeSelect>
        </label>
        <label
          className={styles.globalSelectField}
          htmlFor={`${idPrefix}-limit`}
        >
          <span>{t("searchLimit")}</span>
          <NativeSelect
            id={`${idPrefix}-limit`}
            name="limit"
            defaultValue={values.limit === 20 ? "" : String(values.limit)}
          >
            {SEARCH_LIMITS.map((limit) => (
              <option key={limit} value={limit === 20 ? "" : String(limit)}>
                {t(`searchLimit${limit}`)}
              </option>
            ))}
          </NativeSelect>
        </label>
      </div>
      {!compact && <p className={styles.searchHint}>{t("searchHint")}</p>}
      {/*
        Naming a search is not the submit. It sits above the pinned foot, so the
        panel's own scroll can never park the field under the apply key.
      */}
      <SavedSearches values={values} />
      <div className={styles.filterPanelFoot}>
        <Button
          type="submit"
          className={compact ? styles.filterPanelApply : styles.applyKey}
        >
          {t("applyFilters")}
        </Button>
      </div>
    </div>
  );
}

function RegisteredFilter({
  id,
  filter,
  value,
  t,
}: {
  id: string;
  filter: (typeof SEARCH_FILTER_REGISTRY)[number];
  value: string;
  t: ReturnType<typeof useTranslations>;
}) {
  if (filter.kind === "select")
    return (
      <label className={styles.globalSelectField} htmlFor={id}>
        <span>{t(`searchFilter_${filter.key}`)}</span>
        <NativeSelect id={id} name={filter.key} defaultValue={value}>
          <option value="">{t("searchFilterAny")}</option>
          {filter.values.map((option) => (
            <option key={option} value={option}>
              {t(`searchCustody_${option}`)}
            </option>
          ))}
        </NativeSelect>
      </label>
    );
  return (
    <label className={styles.globalTextField} htmlFor={id}>
      <span>{t(`searchFilter_${filter.key}`)}</span>
      <Input
        id={id}
        name={filter.key}
        defaultValue={value}
        maxLength={filter.maxLength}
      />
    </label>
  );
}

function SearchSuggestions({
  id,
  query,
  language,
  source,
}: {
  id: string;
  query: string;
  language: SearchState["language"];
  source: "fixture" | "api";
}) {
  const [items, setItems] = useState<{ code: string; title: string }[]>([]);
  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      if (source === "fixture") {
        const result = searchFixture({
          ...DEFAULT_SEARCH_STATE,
          q: term,
          language,
          limit: 10,
        });
        setItems(
          result.items.map((item) => ({
            code: item.displayCode,
            title: item.title ?? item.displayCode,
          })),
        );
        return;
      }
      try {
        const response = await fetch(
          `/api/v1/search?q=${encodeURIComponent(term)}&language=${language}&limit=10`,
          {
            headers: { Accept: "application/json" },
            credentials: "same-origin",
            signal: controller.signal,
          },
        );
        if (!response.ok) return;
        const payload = (await response.json()) as {
          items?: { displayCode?: unknown; title?: unknown }[];
        };
        setItems(
          (payload.items ?? []).flatMap((item) =>
            typeof item.displayCode === "string" &&
            typeof item.title === "string"
              ? [{ code: item.displayCode, title: item.title }]
              : [],
          ),
        );
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError"))
          setItems([]);
      }
    }, 320);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, language, source]);
  return (
    <datalist id={id}>
      {(query.trim().length < 2 ? [] : items).map((item) => (
        <option key={item.code} value={item.code} label={item.title} />
      ))}
    </datalist>
  );
}

function SavedSearches({ values }: { values: SearchState }) {
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    () => true,
    () => false,
  );
  return hydrated ? <SavedSearchesContents values={values} /> : null;
}

function SavedSearchesContents({ values }: { values: SearchState }) {
  const locale = useLocale();
  const t = useTranslations("site");
  const id = useId();
  const [name, setName] = useState("");
  const [saved, setSaved] = useState<{ name: string; href: string }[]>(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem("circa:saved-searches") ?? "[]",
      );
      if (Array.isArray(stored))
        return stored
          .filter((item) => {
            if (
              !item ||
              typeof item.name !== "string" ||
              typeof item.href !== "string"
            )
              return false;
            return savedSearchHref(item.href, window.location.origin) !== null;
          })
          .slice(0, 20);
    } catch {
      /* Storage can be blocked by browser preferences. */
    }
    return [];
  });
  function save() {
    const label = name.trim();
    if (!label) return;
    const href = `/${locale}${toSearchHref(values)}`;
    const next = [
      { name: label, href },
      ...saved.filter((item) => item.name !== label),
    ].slice(0, 20);
    persistSavedSearches(next);
    setSaved(next);
    setName("");
  }
  return (
    <section className={styles.savedSearches} aria-label={t("savedSearches")}>
      <label htmlFor={id}>{t("savedSearchName")}</label>
      <Input
        id={id}
        value={name}
        maxLength={48}
        onChange={(event) => setName(event.target.value)}
      />
      <Button type="button" variant="outline" size="sm" onClick={save}>
        {t("savedSearchSave")}
      </Button>
      {saved.length > 0 && (
        <ul>
          {saved.map((item) => (
            <li key={`${item.name}:${item.href}`}>
              <a
                href={
                  savedSearchHref(item.href, window.location.origin) ??
                  `/${locale}/site/records`
                }
              >
                {item.name}
              </a>
              <button
                type="button"
                aria-label={t("savedSearchRemove", { name: item.name })}
                onClick={() => {
                  const next = saved.filter((savedItem) => savedItem !== item);
                  persistSavedSearches(next);
                  setSaved(next);
                }}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function FilterSet<T extends string>({
  id,
  name,
  label,
  values,
  selected,
  excluded,
  t,
}: {
  id: string;
  name: string;
  label: string;
  values: readonly T[];
  selected: readonly string[];
  excluded?: readonly string[];
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <fieldset className={styles.globalFilterSet}>
      <legend>{label}</legend>
      {excluded && (
        <p id={`${id}-hint`} className={styles.tagCycleHint}>
          {t("searchTagCycle")}
        </p>
      )}
      <div className={styles.globalFilterOptions}>
        {values.map((value) => {
          const optionId = `${id}-${value}`;
          return (
            <label key={value} htmlFor={optionId}>
              <FilterCheckbox
                label={t(optionKey(value))}
                id={optionId}
                name={name}
                value={value}
                selected={selected.includes(value)}
                excluded={excluded?.includes(value)}
                triState={Boolean(excluded)}
                hint={excluded ? `${id}-hint` : undefined}
              />

              {t(optionKey(value))}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function FilterCheckbox({
  label,
  id,
  name,
  value,
  selected,
  excluded,
  triState,
  hint,
}: {
  label: string;
  id: string;
  name: string;
  value: string;
  selected: boolean;
  excluded?: boolean;
  triState: boolean;
  hint?: string;
}) {
  const t = useTranslations("site");
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    () => true,
    () => false,
  );
  const [state, setState] = useState<"include" | "exclude" | "any">(
    excluded ? "exclude" : selected ? "include" : "any",
  );
  return (
    <>
      <noscript>
        <input
          id={`${id}-native`}
          aria-label={label}
          type="checkbox"
          name={name}
          value={value}
          defaultChecked={selected}
        />
        {triState && (
          <span>
            <input
              aria-label={`${label}: ${t("searchTagExclude")}`}
              type="checkbox"
              name="excludeWarnTag"
              value={value}
              defaultChecked={excluded}
            />
            {t("searchTagExclude")}
          </span>
        )}
      </noscript>
      <Checkbox
        id={id}
        checked={state === "exclude" ? "indeterminate" : state === "include"}
        aria-describedby={hint}
        onCheckedChange={() =>
          setState(
            state === "any"
              ? "include"
              : state === "include" && triState
                ? "exclude"
                : "any",
          )
        }
      />
      {hydrated && state !== "any" && (
        <input
          type="hidden"
          name={state === "exclude" ? "excludeWarnTag" : name}
          value={value}
        />
      )}
      {triState && (
        <span className={styles.tagState} data-excluded={state === "exclude"}>
          {t(
            state === "include"
              ? "searchTagInclude"
              : state === "exclude"
                ? "searchTagExclude"
                : "searchTagAny",
          )}
        </span>
      )}
    </>
  );
}

function subscribeHydration() {
  return () => {};
}

function persistSavedSearches(saved: { name: string; href: string }[]) {
  try {
    localStorage.setItem("circa:saved-searches", JSON.stringify(saved));
  } catch {
    /* Keep this tab usable when persistence is unavailable. */
  }
}
