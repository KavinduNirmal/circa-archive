import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Landing, { metadata } from "@/app/page";

describe("public access portal", () => {
  it("offers one prominent archive entry and a skip link into the public notice", () => {
    render(<Landing />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Enter the archive" })).toHaveAttribute("href", "/desktop");
    const main = screen.getByRole("main");
    expect(screen.getByRole("link", { name: "Skip to public access" })).toHaveAttribute("href", `#${main.id}`);
  });

  it("gives each audience a reachable procedure without promising unconnected services", () => {
    const { container } = render(<Landing />);
    const directory = screen.getByRole("navigation", { name: "Public directory" });
    for (const name of ["Public access", "Submission procedure", "Organization filings", "Credential verification"]) {
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
    const { container } = render(<Landing />);
    for (const link of screen.getAllByRole("link")) {
      const href = link.getAttribute("href")!;
      if (href.startsWith("#")) expect(container.querySelector(href), href).not.toBeNull();
      else expect(href).toBe("/desktop");
    }
    expect(screen.getByRole("table", { name: "Revision register" })).toBeVisible();
    expect(screen.getByRole("table", { name: "Contact directory" })).toBeVisible();
  });

  it("keeps the entire surface and page metadata in the institution's voice", () => {
    const { container } = render(<Landing />);
    const copy = `${container.textContent} ${JSON.stringify(metadata)}`;
    expect(copy).not.toMatch(/ghost.story|fiction|open source|CIRCA|Next\.js|repository|developers|customers/i);
    expect(screen.getByRole("heading", { name: /what’s new/i })).toBeVisible();
  });
});
