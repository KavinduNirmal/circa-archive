import { loadDocumentation, loadDocumentUpdatedAt } from "@/components/meta/docs/docs-source";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DocsPage } from "@/components/meta/docs/docs-page";
import { DOC_SLUGS, docTopic } from "@/components/meta/docs/docs-topics";

type DocsTopicPageProps = Readonly<{ params: Promise<{ lang: string; slug: string }> }>;

export function generateStaticParams() {
  return DOC_SLUGS.filter((slug) => slug !== "overview").map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: DocsTopicPageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  const topic = docTopic(slug);
  if (!topic) return {};

  const t = await getTranslations({ locale: lang, namespace: "metadata" });
  const docs = await getTranslations({ locale: lang, namespace: "meta" });
  const title = `${docs(topic.titleKey)} | ${t("metaDocsTitle")}`;
  const description = docs(topic.ledeKey);

  return {
    title: { absolute: title },
    description,
    openGraph: { type: "article", siteName: t("registryName"), title, description },
  };
}

export default async function DocsTopicPage({ params }: DocsTopicPageProps) {
  const { lang, slug } = await params;
  setRequestLocale(lang);

  const topic = docTopic(slug);
  if (!topic) notFound();

  const [documents, updatedAt] = await Promise.all([loadDocumentation(lang), loadDocumentUpdatedAt(topic, lang)]);
  return <DocsPage topic={topic} documents={documents} locale={lang} updatedAt={updatedAt} />;
}
