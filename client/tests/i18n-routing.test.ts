import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import proxy from "@/proxy";
import { routing } from "@/i18n/routing";

/**
 * The proxy is the only place a reader's language is chosen, so these tests hold
 * the detection order the product promised: an explicit path prefix wins, then a
 * remembered cookie, then the browser's own Accept-Language, then English.
 *
 * A bare path is redirected rather than served, because every page lives under
 * one locale prefix; otherwise the same document would answer at two addresses.
 */
function requestFor(path: string, init: { acceptLanguage?: string; cookie?: string } = {}) {
  const headers = new Headers();
  if (init.acceptLanguage) headers.set("accept-language", init.acceptLanguage);
  if (init.cookie) headers.set("cookie", init.cookie);
  return new NextRequest(new URL(path, "http://localhost:3001"), { headers });
}

describe("locale routing", () => {
  it("offers English and Korean, defaulting to English", () => {
    expect([...routing.locales]).toEqual(["en", "ko"]);
    expect(routing.defaultLocale).toBe("en");
  });

  it("redirects a bare path to the browser's preferred language", () => {
    const response = proxy(requestFor("/", { acceptLanguage: "ko-KR,ko;q=0.9,en;q=0.8" }));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toMatch(/\/ko$/);
  });

  it("keeps an English reader on English", () => {
    const response = proxy(requestFor("/", { acceptLanguage: "en-GB,en;q=0.9" }));
    expect(response.headers.get("location")).toMatch(/\/en$/);
  });

  it("prefers a remembered choice over the browser's language", () => {
    const response = proxy(requestFor("/", { acceptLanguage: "en-GB,en;q=0.9", cookie: "NEXT_LOCALE=ko" }));
    expect(response.headers.get("location")).toMatch(/\/ko$/);
  });

  it("carries the bare path through the redirect, so the destination survives", () => {
    const response = proxy(requestFor("/desktop", { acceptLanguage: "ko-KR,ko;q=0.9" }));
    expect(response.headers.get("location")).toMatch(/\/ko\/desktop$/);
  });

  it("leaves an already-prefixed path alone", () => {
    const response = proxy(requestFor("/ko/desktop", { acceptLanguage: "en-GB,en;q=0.9" }));
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("holds an explicit prefix against a disagreeing cookie, because the URL is the last word", () => {
    const response = proxy(requestFor("/ko/desktop", { cookie: "NEXT_LOCALE=en" }));
    expect(response.headers.get("location")).toBeNull();
  });

  it("falls back to English for an unsupported language", () => {
    const response = proxy(requestFor("/", { acceptLanguage: "fr-FR,fr;q=0.9" }));
    expect(response.headers.get("location")).toMatch(/\/en$/);
  });

  it("follows the browser's stated weighting, not the order languages are listed in", () => {
    // Korean is mentioned second but weighted higher, and the weighting is the request.
    const response = proxy(requestFor("/", { acceptLanguage: "en-GB;q=0.4,ko;q=0.9" }));
    expect(response.headers.get("location")).toMatch(/\/ko$/);
  });

  it("answers a prefixed request without redirecting, whatever the cookie says", () => {
    const response = proxy(requestFor("/en", { acceptLanguage: "ko-KR", cookie: "NEXT_LOCALE=ko" }));
    expect(response.headers.get("location")).toBeNull();
  });
});
