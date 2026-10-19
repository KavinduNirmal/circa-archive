import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

/**
 * Radix Tooltip and Popover observe their anchors for collision handling, which
 * jsdom does not implement. The stub only needs to exist and stay silent: these
 * tests assert visible behaviour, not measured geometry.
 */
class ResizeObserverStub implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!("ResizeObserver" in globalThis)) {
  Object.defineProperty(globalThis, "ResizeObserver", { value: ResizeObserverStub, writable: true });
}

afterEach(() => {
  cleanup();
  // A persisted workspace is per tab; a test must not inherit the previous one's.
  window.sessionStorage.clear();
});
