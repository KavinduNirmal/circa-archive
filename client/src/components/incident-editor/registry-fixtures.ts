import type { RegistryEntity } from "@/lib/incident-editor/model";
import { SITE_INDEX } from "../archive-site/archive-data";

/** Illustrative entities; destinations exist only where the public archive holds a page. */
export const EDITOR_REGISTRY: RegistryEntity[] = [
  ...SITE_INDEX.filter((entry) => /^INC-\d+$/.test(entry.code)).map(
    (entry) => ({
      code: entry.code,
      kind: "INC" as const,
      name: entry.designation ?? entry.code,
      status: entry.status,
      href: `/site/records/${entry.code}`,
    }),
  ),
  {
    code: "ORG-005429",
    kind: "ORG",
    name: "Office of Nocturnal Surveys",
    status: "unrecognized",
  },
  { code: "CHR-018257", kind: "CHR", name: "Mara Vale", usage: "restricted" },
  { code: "CHR-018258", kind: "CHR", name: "Elias Ward", usage: "open" },
  {
    code: "ITM-000001",
    kind: "ITM",
    name: "The unmarked receiver",
    status: "active",
  },
  {
    code: "EVI-000001",
    kind: "EVI",
    name: "A recording of the final call",
    status: "on-file",
  },
  {
    code: "EXP-000001",
    kind: "EXP",
    name: "First survey of the empty platform",
    status: "erased",
  },
  {
    code: "RUM-000001",
    kind: "RUM",
    name: "The last train still stops",
    status: "on-file",
  },
];
