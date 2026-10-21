import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LandingPage } from "@/components/site/landing-page";
import { generateMetadata } from "@/app/[lang]/page";
import { catalogFor, renderWithIntl } from "./intl";

vi.mock("@/components/auth/session-access-link", async () => {
  const { AccessLink } = await import("@/components/auth/access-link");
  return {
    SessionAccessLink: (props: {
      variant?: "archive" | "portal";
      className?: string;
    }) => <AccessLink {...props} state={{ status: "guest" }} />,
  };
});

const english = catalogFor("en");

/** The page is a Server Component that only awaits its locale, so the metadata is called the way Next calls it. */
function metadataFor(lang: "en" | "ko") {
  return generateMetadata({ params: Promise.resolve({ lang }) });
}

describe("public access portal", () => {
  it("offers the workstation and the public archive as entries, and a skip link into the public notice", () => {
    renderWithIntl(<LandingPage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    // Both entries carry the reader's language, because they are built by the locale-aware Link.
    expect(
      screen.getByRole("link", { name: english.landing.enterArchive }),
    ).toHaveAttribute("href", "/en/desktop");
    expect(
      screen.getByRole("link", { name: english.landing.enterPublicSite }),
    ).toHaveAttribute("href", "/en/site");
    const main = screen.getByRole("main");
    expect(
      screen.getByRole("link", { name: english.landing.skipToAccess }),
    ).toHaveAttribute("href", `#${main.id}`);
  });

  it("gives each audience a reachable procedure without promising unconnected services", () => {
    const { container } = renderWithIntl(<LandingPage />);
    const directory = screen.getByRole("navigation", {
      name: english.landing.directoryLabel,
    });
    for (const name of [
      english.landing.publicAccess,
      english.landing.submissions,
      english.landing.organizations,
      english.landing.credentials,
    ]) {
      const link = within(directory).getByRole("link", {
        name: new RegExp(name),
      });
      const section = container.querySelector(link.getAttribute("href")!);
      expect(section).not.toBeNull();
      expect(section).toHaveAccessibleName(new RegExp(name, "i"));
    }
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/en/sign-in",
    );
    expect(
      screen.getByText(/Organization submissions are not being transmitted/),
    ).toBeVisible();
    expect(screen.getByText(/Drafts remain in this browser/)).toBeVisible();
  });

  it("resolves every local link, including withdrawn documents and footer policies", () => {
    const { container } = renderWithIntl(<LandingPage />);
    for (const link of screen.getAllByRole("link")) {
      const href = link.getAttribute("href")!;
      if (href.startsWith("#"))
        expect(container.querySelector(href), href).not.toBeNull();
      // Every outward link stays inside the reader's language: the archive links
      // point at that language's desktop or reading edition, and the switcher at
      // the other language's copy of this page. A bare path would bounce the
      // reader through the proxy.
      else
        expect(href, href).toMatch(
          /^\/(en|ko)(\/(desktop|site|sign-in|sign-up|account))?$/,
        );
    }
    expect(
      screen.getByRole("table", { name: english.landing.revisionLabel }),
    ).toBeVisible();
    expect(
      screen.getByRole("table", { name: english.landing.contactsLabel }),
    ).toBeVisible();
  });

  it("keeps the entire surface and page metadata in the institution's voice", async () => {
    const { container } = renderWithIntl(<LandingPage />);
    const copy = `${container.textContent} ${JSON.stringify(await metadataFor("en"))}`;
    expect(copy).not.toMatch(
      /ghost.story|fiction|open source|CIRCA|Next\.js|repository|developers|customers/i,
    );
    expect(screen.getByRole("heading", { name: /what’s new/i })).toBeVisible();
  });

  it("serves the whole portal in Korean when the request resolves to Korean", () => {
    renderWithIntl(<LandingPage />, { locale: "ko" });
    const korean = catalogFor("ko");
    expect(
      screen.getByRole("link", { name: korean.landing.enterArchive }),
    ).toHaveAttribute("href", "/ko/desktop");
    expect(
      screen.getByRole("link", { name: korean.landing.enterPublicSite }),
    ).toHaveAttribute("href", "/ko/site");
    // The institution's own name, not a translated stub of the English one.
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      korean.landing.agencyLineOne,
    );
    // The archive's codes are identifiers and must survive translation untouched.
    expect(screen.getByRole("link", { name: /PA–01/ })).toBeVisible();
  });

  it("declares the locale it is publishing when it builds metadata", async () => {
    const englishMetadata = await metadataFor("en");
    const koreanMetadata = await metadataFor("ko");
    expect(englishMetadata.openGraph?.locale).toBe("en_GB");
    expect(koreanMetadata.openGraph?.locale).toBe("ko_KR");
    expect(koreanMetadata.title).toEqual({
      absolute: catalogFor("ko").metadata.homeTitle,
    });
  });
});

describe("staying inside the fiction", () => {
  it("never announces out of character, and keeps its structure legible instead", () => {
    const { container } = renderWithIntl(<LandingPage />);
    // The page is an agency's own site. The meta layer lives in the route
    // metadata and in where the archive link leads, not in a banner.
    expect(container.textContent).not.toMatch(
      /not a real office|demonstration|reconstruction|simulation|fictional/i,
    );
    // What a reader needs instead is a way to see the whole site at once.
    expect(
      screen.getByRole("navigation", { name: english.landing.navLabel }),
    ).toBeVisible();
    expect(
      screen.getByRole("navigation", { name: english.landing.directoryLabel }),
    ).toBeVisible();
    expect(screen.getByText(/Registry \/ Public information/)).toBeVisible();
  });
});

describe("the sentences that change", () => {
  it("carries the other version of the correspondent notice, ready to replace the printed one", () => {
    renderWithIntl(<LandingPage />);
    const notice = screen.getByText(english.landing.noticeBody);
    expect(notice).toHaveAttribute("data-alter", english.landing.noticeAlter);
    // The altered sentence is the one the brief names: the reference number is forgotten.
    expect(english.landing.noticeAlter).toMatch(/forget the reference number/);
  });

  it("staggers the alterations instead of firing them all at once", () => {
    const { container } = renderWithIntl(<LandingPage />);
    const cues = [...container.querySelectorAll("[data-alter]")].map((node) =>
      Number(node.getAttribute("data-alter-after")),
    );
    expect(cues.length).toBeGreaterThan(2);
    expect(new Set(cues).size).toBe(cues.length);
  });
});

describe("pages on this site that are not held", () => {
  it("lists four pages as controls, because choosing one answers rather than navigates", () => {
    renderWithIntl(<LandingPage />);
    const rail = screen.getByRole("navigation", {
      name: english.landing.directoryLabel,
    }).parentElement!;
    for (const name of [
      english.landing.closedPlan,
      english.landing.closedGuest,
      english.landing.closedCircular,
      english.landing.closedPersonnel,
    ]) {
      expect(within(rail).getByRole("button", { name })).toBeVisible();
    }
    expect(within(rail).getByText(english.landing.closedIntro)).toBeVisible();
    expect(
      within(rail).getByText(english.landing.closedFootnote),
    ).toBeVisible();
  });
});

describe("the portal's skin", () => {
  it("draws no gradients, whose absence is what makes the page look its age", () => {
    const css = ["landing-page.module.css", "portal-signs.css"]
      .map((name) =>
        readFileSync(
          resolve(process.cwd(), "src/components/site", name),
          "utf8",
        ),
      )
      .join("\n");
    expect(css).not.toMatch(/gradient\(/i);
  });
});
