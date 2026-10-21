import Image from "next/image";

/**
 * A photograph inside a record, through the Next image pipeline.
 *
 * The pipeline does not carry a document image's dimensions, so the figure
 * reserves a 4:3 plate and the sheet's `width: 100%; height: auto` rule restores
 * the photograph's own ratio once it loads. `sizes` describes the two measures a
 * figure takes: the full sheet and the narrower floated print.
 *
 * A document's image is authored content, not a map of the application's assets.
 * An absolute URL is optimised against the hosts in `next.config.ts`; a new
 * image host has to be allowed there before it can be displayed.
 */
export function RecordImage({
  src,
  alt = "",
  title,
  className,
  loading,
}: {
  src?: string | Blob;
  alt?: string;
  title?: string;
  className?: string;
  loading?: "eager" | "lazy";
}) {
  // A document's image is a URL; the intrinsic `img` type also admits a Blob,
  // which the Markdown pipeline never produces.
  if (typeof src !== "string" || !src) return null;
  return (
    <Image
      src={src}
      alt={alt}
      title={title}
      width={1200}
      height={900}
      sizes="(max-width: 620px) 100vw, (max-width: 1024px) 46vw, 640px"
      className={className}
      loading={loading}
    />
  );
}
