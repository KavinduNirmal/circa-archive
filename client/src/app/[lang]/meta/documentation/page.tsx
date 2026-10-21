import {
  loadDocumentation,
  loadDocumentUpdatedAt,
} from "@/components/meta/docs/docs-source";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DocsPage } from "@/components/meta/docs/docs-page";
import { docTopic } from "@/components/meta/docs/docs-topics";

type DocsOverviewPageProps = Readonly<{ params: Promise<{ lang: string }> }>;

export async function generateMetadata({
  params,
}: DocsOverviewPageProps): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: "metadata" });
  const docs = await getTranslations({ locale: lang, namespace: "meta" });
  const topic = docTopic("overview")!;
  const title = t("metaDocsTitle");
  const description = docs(topic.ledeKey);
  return {
    title: { absolute: title },
    description,
    openGraph: {
      type: "article",
      siteName: t("registryName"),
      title,
      description,
    },
  };
}

export default async function DocsOverviewPage({
  params,
}: DocsOverviewPageProps) {
  const { lang } = await params;
  setRequestLocale(lang);
  const topic = docTopic("overview")!;
  const [documents, updatedAt] = await Promise.all([
    loadDocumentation(lang),
    loadDocumentUpdatedAt(topic, lang),
  ]);
  return (
    <DocsPage
      topic={topic}
      documents={documents}
      locale={lang}
      updatedAt={updatedAt}
    />
  );
}
