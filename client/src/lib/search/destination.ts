import "server-only";
import { unstable_rethrow } from "next/navigation";
import { sessionFetch } from "@/lib/auth/session";

export interface ArchiveDestination {
  id: string;
  type: "incident" | "record" | "organization" | "character" | "recovery";
  code: string;
  title: string;
  markdown: string | null;
  access: "public" | "sealed";
  requestStatus: string | null;
  rumours: ArchiveDestination[];
}
export type DestinationOutcome =
  | { status: "success"; destination: ArchiveDestination }
  | { status: "missing" | "error" };
function isDestination(
  value: unknown,
  acknowledge: boolean,
  child = false,
): value is ArchiveDestination {
  if (typeof value !== "object" || value === null) return false;
  const item = value as ArchiveDestination;
  return (
    typeof item.id === "string" &&
    typeof item.code === "string" &&
    typeof item.title === "string" &&
    ["incident", "record", "organization", "character", "recovery"].includes(
      item.type,
    ) &&
    ["public", "sealed"].includes(item.access) &&
    (item.requestStatus === null ||
      ["pending", "approved", "denied", "expired"].includes(
        item.requestStatus,
      )) &&
    (item.markdown === null || typeof item.markdown === "string") &&
    (item.access !== "sealed" ||
      item.markdown === null ||
      (item.type === "incident" && acknowledge) ||
      (item.type === "record" && item.requestStatus === "approved")) &&
    Array.isArray(item.rumours) &&
    (child
      ? item.rumours.length === 0
      : item.rumours.every((rumour) => isDestination(rumour, false, true)))
  );
}

export async function getArchiveDestination(
  code: string,
  acknowledge = false,
): Promise<DestinationOutcome> {
  try {
    const response = await sessionFetch(
      `/api/v1/archive/${encodeURIComponent(code)}${acknowledge ? "?acknowledge=true" : ""}`,
      {
        headers: { Accept: "application/json" },
        cache: "no-store",
      },
    );
    if (response.status === 404) return { status: "missing" };
    if (!response.ok) return { status: "error" };
    const destination: unknown = await response.json();
    return isDestination(destination, acknowledge)
      ? { status: "success", destination }
      : { status: "error" };
  } catch (error) {
    unstable_rethrow(error);
    return { status: "error" };
  }
}
