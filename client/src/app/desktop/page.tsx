import type { Metadata } from "next";
import { DesktopShell } from "@/components/desktop-shell";
import { WorkstationBoot } from "@/components/site/boot-sequence";

export const metadata: Metadata = {
  title: "Workstation",
  description:
    "CIRCA/OS 4.12 workstation preview: the archive browser, the mail client, the file browser, and the record editor, with no backend connected yet.",
};

export default function DesktopPage() {
  // The post screen sits in front of the shell, so arriving here reads as powering the machine on.
  return (
    <WorkstationBoot>
      <DesktopShell />
    </WorkstationBoot>
  );
}
