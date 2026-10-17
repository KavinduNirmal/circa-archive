import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LandingPage } from "@/components/site/landing-page";
import { generateMetadata } from "@/app/[lang]/page";
import { catalogFor, renderWithIntl } from "./intl";

const english = catalogFor("en");

/** The page is a Server Component that only awaits its locale, so the metadata is called the way Next calls it. */
function metadataFor(lang: "en" | "ko") {
  return generateMetadata({ params: Promise.resolve({ lang }) });
}

describe("public access portal", () => {
  it("offers one prominent archive entry and a skip link into the public notice", () => {
    renderWithIntl(<LandingPage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    // The archive link carries the reader's language, because it is built by the locale-aware Link.
    expect(screen.getByRole("link", { name: english.landing.enterArchive })).toHaveAttribute("href", "/en/desktop");
    const main = screen.getByRole("main");
    expect(screen.getByRole("link", { name: english.landing.skipToAccess })).toHaveAttribute("href", `#${main.id}`);
  });

  it("gives each audience a reachable procedure without promising unconnected services", () => {
    const { container } = renderWithIntl(<LandingPage />);
    const directory = screen.getByRole("navigation", { name: english.landing.directoryLabel });
    for (const name of [
      english.landing.publicAccess,
      english.landing.submissions,
      english.landing.organizations,
      english.landing.credentials,
    ]) {
      const link = within(directory).getByRole("link", { name: new RegExp(name) });
      const section = container.querySelector(link.getAttribute("href")!);
      expect(section).not.toBeNull();
      expect(section).toHaveAccessibleName(new RegExp(name, "i"));
    }
    expect(screen.getByText(/Credential verification is not connected/)).toBeVisible();
    expect(screen.getByText(/Organization submissions are not being transmitted/)).toBeVisible();
    expect(screen.getByText(/Drafts remain in this browser/)).toBeVisible();
  });

  it("resolves every local link, including withdrawn documents and footer policies", () => {
    const { container } = renderWithIntl(<LandingPage />);
    for (const link of screen.getAllByRole("link")) {
      const href = link.getAttribute("href")!;
      if (href.startsWith("#")) expect(container.querySelector(href), href).not.toBeNull();
      // Every outward link stays inside the reader's language: the archive links
      // point at that language's desktop, and the switcher at the other language's
      // copy of this page. A bare path would bounce the reader through the proxy.
      else expect(href, href).toMatch(/^\/(en|ko)(\/desktop)?$/);
    }
    expect(screen.getByRole("table", { name: english.landing.revisionLabel })).toBeVisible();
    expect(screen.getByRole("table", { name: english.landing.contactsLabel })).toBeVisible();
  });

  it("keeps the entire surface and page metadata in the institution's voice", async () => {
    const { container } = renderWithIntl(<LandingPage />);
    const copy = `${container.textContent} ${JSON.stringify(await metadataFor("en"))}`;
    expect(copy).not.toMatch(/ghost.story|fiction|open source|CIRCA|Next\.js|repository|developers|customers/i);
    expect(screen.getByRole("heading", { name: /what’s new/i })).toBeVisible();
  });

  it("serves the whole portal in Korean when the request resolves to Korean", () => {
    renderWithIntl(<LandingPage />, { locale: "ko" });
    const korean = catalogFor("ko");
    expect(screen.getByRole("link", { name: korean.landing.enterArchive })).toHaveAttribute("href", "/ko/desktop");
    // The institution's own name, not a translated stub of the English one.
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(korean.landing.agencyLineOne);
    // The archive's codes are identifiers and must survive translation untouched.
    expect(screen.getByRole("link", { name: /PA–01/ })).toBeVisible();
  });

  it("declares the locale it is publishing when it builds metadata", async () => {
    const englishMetadata = await metadataFor("en");
    const koreanMetadata = await metadataFor("ko");
    expect(englishMetadata.openGraph?.locale).toBe("en_GB");
    expect(koreanMetadata.openGraph?.locale).toBe("ko_KR");
    expect(koreanMetadata.title).toEqual({ absolute: catalogFor("ko").metadata.homeTitle });
  });
});
