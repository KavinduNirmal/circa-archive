import { getSessionState } from "@/lib/auth/session";
import { AccessLink, type AccessLinkProps } from "./access-link";

export async function SessionAccessLink(props: Omit<AccessLinkProps, "state">) {
  return <AccessLink {...props} state={await getSessionState()} />;
}
