"use client";
import { useState } from "react";
import { authFetch, SignedOutError } from "@/lib/auth/client";
import { Link } from "@/i18n/navigation";
import { ArchiveButton } from "./archive-button";

type Labels = {
  request: string;
  pending: string;
  denied: string;
  expired: string;
  error: string;
  signIn: string;
};
export function RecordAccessRequest({
  code,
  initialStatus,
  labels,
}: {
  code: string;
  initialStatus: string | null;
  labels: Labels;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState(false);
  async function request() {
    setBusy(true);
    try {
      const response = await authFetch(
        `/api/v1/archive/${encodeURIComponent(code)}/access-requests`,
        { method: "POST" },
      );
      if (response.status === 401) {
        setStatus("sign-in");
        return;
      }
      if (!response.ok) throw new Error("request_failed");
      const result: unknown = await response.json();
      if (
        typeof result !== "object" ||
        result === null ||
        !("status" in result) ||
        !["pending", "approved", "denied", "expired"].includes(
          String(result.status),
        )
      )
        throw new Error("invalid_response");
      setStatus(String(result.status));
    } catch (error) {
      setStatus(error instanceof SignedOutError ? "sign-in" : "error");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <p role="status">
        {status === "pending" || status === "approved"
          ? labels.pending
          : status === "denied"
            ? labels.denied
            : status === "expired"
              ? labels.expired
              : status === "error"
                ? labels.error
                : null}
      </p>
      {status === "sign-in" ? (
        <Link href="/sign-in">{labels.signIn}</Link>
      ) : (
        !["pending", "approved", "denied", "expired"].includes(
          status ?? "",
        ) && (
          <ArchiveButton
            tone="paper"
            type="button"
            disabled={busy}
            onClick={request}
          >
            {labels.request}
          </ArchiveButton>
        )
      )}
    </div>
  );
}
