import type { Metadata } from "next";
import { LandingPage } from "@/components/site/landing-page";

const title = "Public Registry | Commission for Incident Review and Corrective Action";
const description = "Public access statements, filing procedures, administrative notices, and the released incident registry.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  openGraph: { type: "website", siteName: "Office of the Permanent Registry", title, description, locale: "en_GB" },
  twitter: { card: "summary", title, description },
};

export default function HomePage() {
  return <LandingPage />;
}
