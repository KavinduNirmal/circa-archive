import { describe, expect, it } from "vitest";
import { projectSiteHref, projectSiteRedirects } from "@/lib/project-site";

describe("the independent project website", () => {
  it("builds a cross-origin destination in the selected language", () => {
    expect(projectSiteHref("en")).toBe("http://localhost:4321/en/");
    expect(projectSiteHref("ko")).toBe("http://localhost:4321/ko/");
    expect(() => projectSiteHref("unknown")).toThrow();
  });
  it("redirects legacy locale routes permanently before the removed pages", () => {
    expect(projectSiteRedirects()).toEqual(
      expect.arrayContaining([
        {
          source: "/en/meta",
          destination: "http://localhost:4321/en/",
          permanent: true,
        },
        {
          source: "/ko/meta/about",
          destination: "http://localhost:4321/ko/about/project/",
          permanent: true,
        },
        {
          source: "/ko/meta/documentation/:slug",
          destination: "http://localhost:4321/ko/documentation/:slug/",
          permanent: true,
        },
      ]),
    );
  });
});
