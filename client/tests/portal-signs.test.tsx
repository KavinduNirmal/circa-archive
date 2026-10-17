import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Attendance, PortalSigns, RegisterRefresh, UnavailableLink, attendanceText } from "@/components/site/portal-signs";

/**
 * The portal's uncanny apparatus.
 *
 * Each piece is tested on its own rather than through the page: the page is a
 * server composition, and these are the four small client behaviours it mounts.
 * The behaviours are time-based, so the timers are faked and advanced by hand
 * instead of waiting; a real clock in a unit test is a flaky test.
 */

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("sentence alteration", () => {
  function Fixture({ after = 4000, hold = 900 }: { after?: number; hold?: number }) {
    return (
      <div>
        <p data-alter="If a record names you, forget the reference number." data-alter-after={after} data-alter-hold={hold}>
          If a record names you in error, retain the reference number.
        </p>
        <PortalSigns />
      </div>
    );
  }

  it("replaces a sentence for a moment and then puts it back", () => {
    render(<Fixture />);
    const sentence = screen.getByText(/retain the reference number/);
    expect(sentence).toBeVisible();

    act(() => vi.advanceTimersByTime(4000));
    expect(sentence).toHaveTextContent("If a record names you, forget the reference number.");

    act(() => vi.advanceTimersByTime(900));
    expect(sentence).toHaveTextContent("If a record names you in error, retain the reference number.");
  });

  it("leaves the sentence alone until its own cue, so alterations do not fire together", () => {
    render(<Fixture after={12000} />);
    const sentence = screen.getByText(/retain the reference number/);
    act(() => vi.advanceTimersByTime(11999));
    expect(sentence).toHaveTextContent(/in error/);
  });

  it("never alters a sentence when reduced motion is asked for", () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true, addEventListener() {}, removeEventListener() {} })));
    render(<Fixture />);
    const sentence = screen.getByText(/retain the reference number/);
    act(() => vi.advanceTimersByTime(60000));
    expect(sentence).toHaveTextContent(/in error/);
  });
});

describe("attendance", () => {
  it("counts the visit and reads as hours, minutes and seconds", () => {
    expect(attendanceText(0)).toBe("00:00:00");
    expect(attendanceText(61)).toBe("00:01:01");
    expect(attendanceText(3661)).toBe("01:01:01");
  });

  it("counts while the page is open and then says it is still counting", () => {
    render(<Attendance label="Attendance this visit" note="Recorded for the duration of the visit." still="Still present. Attendance is retained." />);
    const readout = screen.getByText("00:00:00", { selector: "span" });
    expect(readout).toBeVisible();

    act(() => vi.advanceTimersByTime(3000));
    expect(readout).toHaveTextContent("00:00:03");
    expect(screen.getByText(/Recorded for the duration of the visit/)).toBeVisible();

    act(() => vi.advanceTimersByTime(57000));
    expect(readout).toHaveTextContent("00:01:00");
    expect(screen.getByText(/Still present. Attendance is retained/)).toBeVisible();
  });
});

describe("the register", () => {
  function Fixture() {
    return (
      <RegisterRefresh
        updated="Last updated: 14 November 2003"
        refreshedUpdated="Last updated: 13 November 2003"
        refreshLabel="Refresh the register"
        refreshed="No notices were received this time. The notices listed previously have been returned to the file."
      >
        <p>Revised public access circular</p>
      </RegisterRefresh>
    );
  }

  it("withdraws the previous notices and dates the page earlier when refreshed", () => {
    render(<Fixture />);
    expect(screen.getByText("Revised public access circular")).toBeVisible();
    expect(screen.getByText("Last updated: 14 November 2003")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Refresh the register" }));

    expect(screen.getByText(/No notices were received this time/)).toBeVisible();
    expect(screen.getByText("Last updated: 13 November 2003")).toBeVisible();
    // The withdrawn notices leave the document rather than sitting hidden in the
    // accessibility tree, which is what "returned to the file" is allowed to mean.
    expect(screen.queryByText("Revised public access circular")).toBeNull();
  });
});

describe("pages that are not held", () => {
  it("answers a closed page with a notice instead of navigating away", async () => {
    // Radix waits on real time to place the portal, so the clock is handed back
    // for this one; the page's other behaviours are tested on the fake clock.
    vi.useRealTimers();
    render(
      <UnavailableLink
        label="Reading room plan"
        dialogTitle="Public registry"
        heading="Page not held in this copy"
        body="Withdrawn on 08.06.2001. The room remains in use."
        detail="PL–04a"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Reading room plan" }));
    expect(await screen.findByRole("alertdialog")).toBeVisible();
    expect(screen.getByText("Page not held in this copy")).toBeVisible();
    expect(screen.getByText("Withdrawn on 08.06.2001. The room remains in use.")).toBeVisible();
    expect(screen.getByText("PL–04a")).toBeVisible();
  });
});
