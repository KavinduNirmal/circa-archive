import { getTranslations } from "next-intl/server";

export default async function Loading() {
  const t = await getTranslations("meta");
  return (
    <div
      className="meta-shell meta-docs-loading"
      role="status"
      aria-busy="true"
    >
      {t("docsLoading")}
    </div>
  );
}
