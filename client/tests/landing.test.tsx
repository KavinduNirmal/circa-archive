import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Landing from "@/app/page";
import {
  COMMANDS,
  DOCUMENTS,
  PROJECT,
  ROLES,
  SECTIONS,
  SPECIMEN,
  STACK,
  STEPS,
} from "@/components/site/site-meta";

describe("landing page", () => {
  it("leads with the archive's own name and the one way into the workstation", () => {
    render(<Landing />);
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(PROJECT.name);
    const enter = screen.getByRole("link", { name: /enter workstation/i });
    expect(enter).toHaveAttribute("href", "/desktop");
    // One primary action on the page, and it is the one that boots the machine.
    expect(enter).toHaveClass("landing-enter");
  });

  it("navigates to every section it names", () => {
    const { container } = render(<Landing />);
    const navigation = screen.getByRole("navigation", { name: "Site sections" });
    for (const section of SECTIONS) {
      const link = within(navigation).getByRole("link", { name: section.nav });
      expect(link).toHaveAttribute("href", `#${section.id}`);
      expect(container.querySelector(`#${section.id}`)).not.toBeNull();
      expect(container.querySelector(`#${section.id}`)?.getAttribute("aria-labelledby")).toBe(
        `${section.id}-title`,
      );
    }
  });

  it("introduces the community and where each kind of contributor works", () => {
    const { container } = render(<Landing />);
    const community = container.querySelector("#community");
    if (!community) throw new Error("the community section is missing");
    expect(screen.getByRole("heading", { name: "Community" })).toBeVisible();
    for (const role of ROLES) {
      const card = within(community as HTMLElement).getByRole("heading", { name: role.title });
      expect(card).toBeVisible();
      expect(within(community as HTMLElement).getByText(role.path)).toBeVisible();
    }
  });

  it("shows the specimen record the browser files, on paper", () => {
    const { container } = render(<Landing />);
    const specimen = container.querySelector(".landing-specimen");
    if (!specimen) throw new Error("the specimen record is missing");
    expect(within(specimen as HTMLElement).getByText(SPECIMEN.code)).toBeVisible();
    expect(within(specimen as HTMLElement).getByText(SPECIMEN.designation ?? "")).toBeVisible();
    expect(specimen).toHaveTextContent(SPECIMEN.abstract);
  });

  it("publishes the project record with the unbuilt parts marked", () => {
    render(<Landing />);
    const table = screen.getByRole("table", { name: "Project record" });
    expect(within(table).getByText(PROJECT.status)).toBeVisible();
    for (const row of STACK) {
      const cell = within(table).getByText(row.key);
      const line = cell.closest("tr");
      if (!line) throw new Error(`${row.key} is not in a row`);
      expect(line).toHaveTextContent(row.value);
      expect(line.querySelector(`[data-state="${row.state}"]`)).not.toBeNull();
    }
  });

  it("walks a contributor from the checkout to the pull request", () => {
    const { container } = render(<Landing />);
    const contribute = container.querySelector("#contribute");
    if (!contribute) throw new Error("the contributing section is missing");
    for (const step of STEPS) {
      expect(within(contribute as HTMLElement).getByRole("heading", { name: step.title })).toBeVisible();
      for (const id of step.commands) {
        const command = COMMANDS.find((item) => item.id === id);
        if (!command) throw new Error(`${id} is missing from the command list`);
        expect(within(contribute as HTMLElement).getAllByText(command.text).length).toBeGreaterThan(0);
      }
    }
  });

  it("copies a command and says so, and reports a blocked clipboard instead of failing quietly", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<Landing />);
    const precommit = screen.getByRole("button", { name: "Copy bun run precommit" });
    fireEvent.click(precommit);
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("bun run precommit"));
    expect(await screen.findByText("Copied")).toBeVisible();

    writeText.mockRejectedValueOnce(new Error("denied"));
    fireEvent.click(precommit);
    expect(await screen.findByText("Copy blocked")).toBeVisible();
    Reflect.deleteProperty(navigator, "clipboard");
  });

  it("indexes the documents by the path a contributor has to open", () => {
    const { container } = render(<Landing />);
    const documents = container.querySelector("#documents");
    if (!documents) throw new Error("the documents section is missing");
    for (const document of DOCUMENTS) {
      expect(within(documents as HTMLElement).getByText(document.path)).toBeVisible();
    }
    // No remote is configured, so the page must not pretend these are links.
    expect(within(documents as HTMLElement).getByText(/no remote/i)).toBeVisible();
    expect(within(documents as HTMLElement).queryAllByRole("link")).toHaveLength(0);
  });
});
