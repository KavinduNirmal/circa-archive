import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import { Link } from "@/i18n/navigation";
import styles from "./archive-button.module.css";

/**
 * The site's one button: the workstation's tool button, pulled out of the
 * stylesheet so the masthead, the section bar, the search, and the record's
 * action bar all draw the same key.
 *
 * It renders the element the job needs — the locale-aware router link, a plain
 * anchor for an in-page jump or a download, or a real `<button>` — because the
 * look is shared and the element is not. `tone` picks the ground: `steel` on the
 * navy chrome, `paper` on the sheets, where a navy key would read as a hole.
 *
 * The `<summary>` that opens the download menu cannot be one of these, so it
 * wears `styles.button` directly with `data-tone="paper"`; see `archive-record.tsx`.
 */
export type ArchiveButtonTone = "steel" | "paper";

type BaseProps = {
  children: ReactNode;
  /** A glyph set before the label; pass an `aria-hidden` lucide icon. */
  icon?: ReactNode;
  tone?: ArchiveButtonTone;
  /** The page or section this control already is; renders `aria-current="page"`. */
  current?: boolean;
  className?: string;
};

type ArchiveLinkProps = BaseProps & {
  href: string;
  /** A plain `<a>`, for `#anchors` and downloads that must leave the router. */
  raw?: boolean;
} & Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    "href" | "className" | "children"
  >;

type ArchiveButtonElementProps = BaseProps & {
  href?: undefined;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

export type ArchiveButtonProps = ArchiveLinkProps | ArchiveButtonElementProps;

export function ArchiveButton(props: ArchiveButtonProps) {
  if ("href" in props && props.href !== undefined) {
    const {
      children,
      icon,
      tone = "steel",
      current,
      className,
      href,
      raw,
      ...rest
    } = props;
    const state = {
      className: className ? `${styles.button} ${className}` : styles.button,
      "data-tone": tone,
      "aria-current": current ? ("page" as const) : undefined,
    };

    return raw ? (
      <a {...rest} {...state} href={href}>
        {icon}
        {children}
      </a>
    ) : (
      <Link {...rest} {...state} href={href}>
        {icon}
        {children}
      </Link>
    );
  }

  const { children, icon, tone = "steel", current, className, ...rest } = props;

  return (
    <button
      {...rest}
      type={rest.type ?? "button"}
      className={className ? `${styles.button} ${className}` : styles.button}
      data-tone={tone}
      aria-current={current ? "page" : undefined}
    >
      {icon}
      {children}
    </button>
  );
}
