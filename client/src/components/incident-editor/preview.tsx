"use client";
import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { parseRecord } from "@/lib/markdown/pipeline";
import {
  ENTITY_LINK_PREFIX,
  remarkEntityLinks,
  type RegistryEntity,
} from "@/lib/incident-editor/model";
import { RecordMarkdown } from "../reader/record-markdown";
import styles from "./editor.module.css";

export function IncidentPreview({
  source,
  resolveEntity,
  resolveAsset,
  onDetails,
}: {
  source: string;
  resolveEntity: (code: string) => RegistryEntity | undefined;
  resolveAsset: (code: string) => string | undefined;
  onDetails: (code: string) => void;
}) {
  const t = useTranslations("editor");
  const locale = useLocale();
  const valid = useMemo(() => {
    try {
      parseRecord({ markdown: source });
      return true;
    } catch {
      return false;
    }
  }, [source]);
  if (!valid)
    return (
      <p className={styles.notice} role="alert">
        {t("previewError")}
      </p>
    );
  if (!source.trim())
    return <p className={styles.empty}>{t("emptyPreview")}</p>;
  return (
    <div className={styles.preview}>
      <RecordMarkdown
        source={source}
        additionalPlugins={[remarkEntityLinks]}
        components={{
          a: ({ href, children }) => {
            if (href?.startsWith(ENTITY_LINK_PREFIX)) {
              const code = href.slice(ENTITY_LINK_PREFIX.length);
              const entity = resolveEntity(code);
              return entity?.href ? (
                <a href={`/${locale}${entity.href}`}>{children}</a>
              ) : (
                <button
                  className={styles.entityLink}
                  onClick={() => onDetails(code)}
                >
                  {children}
                </button>
              );
            }
            return (
              <a href={href?.startsWith("/site/") ? `/${locale}${href}` : href}>
                {children}
              </a>
            );
          },
          img: ({ src, alt }) => {
            const caption = alt?.replace(/^(?:left|right|full)\|/, "") ?? "";
            const local =
              typeof src === "string" ? resolveAsset(src) : undefined;
            // The local prototype renders only attached blobs, never author-supplied remote URLs.
            return local ? (
              // eslint-disable-next-line @next/next/no-img-element -- Browser-local object URLs cannot use the image optimizer.
              <img src={local} alt={caption} />
            ) : (
              <span
                className={styles.imageMissing}
                role="img"
                aria-label={caption || t("imageMissing")}
              >
                {t("imageMissing")}
                {caption ? ` — ${caption}` : ""}
              </span>
            );
          },
        }}
      />
    </div>
  );
}
