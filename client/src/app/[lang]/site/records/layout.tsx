import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";

/** Error boundaries need recovery copy alongside the shell's shared namespaces. */
export default async function RecordsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [t, messages] = await Promise.all([
    getTranslations("site"),
    getMessages(),
  ]);
  const shared = Object.fromEntries(
    Object.entries(messages).filter(
      ([key]) => !["site", "landing", "meta"].includes(key),
    ),
  );
  return (
    <NextIntlClientProvider
      messages={{
        ...shared,
        site: {
          searchErrorTitle: t("searchErrorTitle"),
          searchErrorBody: t("searchErrorBody"),
          searchErrorRetry: t("searchErrorRetry"),
        },
      }}
    >
      {children}
    </NextIntlClientProvider>
  );
}
