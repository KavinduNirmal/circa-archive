import { NextIntlClientProvider, useMessages, useLocale } from "next-intl";
import type { SearchState } from "@/lib/search/contract";
import { SearchForm } from "./search-form";

export function SiteSearch(props: {
  values?: SearchState;
  variant?: "page" | "masthead";
}) {
  const messages = useMessages();
  const locale = useLocale();
  return (
    <NextIntlClientProvider locale={locale} messages={{ site: messages.site }}>
      <SearchForm {...props} />
    </NextIntlClientProvider>
  );
}
