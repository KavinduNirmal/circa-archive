import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { SessionState } from "@/lib/auth/session";
import { ArchiveButton } from "../archive-site/archive-button";

export type AccessLinkProps = {
  state: SessionState;
  variant?: "archive" | "portal";
  className?: string;
};

export function AccessLink({
  state,
  variant = "archive",
  className,
}: AccessLinkProps) {
  const t = useTranslations("auth");
  const href = state.status === "authenticated" ? "/account" : "/sign-in";
  const label = t(
    state.status === "authenticated"
      ? "personalAccess"
      : state.status === "guest"
        ? "signIn"
        : "access",
  );
  return variant === "portal" ? (
    <Link href={href} className={className}>
      {label} <span aria-hidden="true">»</span>
    </Link>
  ) : (
    <ArchiveButton href={href} className={className}>
      {label}
    </ArchiveButton>
  );
}
