import type { Metadata } from "next";
import { LandingPage } from "@/components/site/landing-page";

export const metadata: Metadata = {
  // Absolute: the landing page is the project's own name, not a subpage of it.
  title: { absolute: "CIRCA Archive: a collaborative ghost-story archive" },
  description:
    "An open source collaborative fiction archive presented as a fictional 1999 workstation. Read the project record, meet the community, and contribute records or interface code.",
  openGraph: {
    type: "website",
    siteName: "CIRCA Archive",
    title: "CIRCA Archive",
    description:
      "A collaborative ghost-story archive presented as a fictional desktop workstation. Incidents, exploration records, and organization dossiers in one shared universe.",
    locale: "en_GB",
  },
  twitter: {
    card: "summary",
    title: "CIRCA Archive",
    description: "A collaborative ghost-story archive presented as a fictional desktop workstation.",
  },
};

export default function HomePage() {
  return <LandingPage />;
}
