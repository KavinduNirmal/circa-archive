import { expect, it } from "vitest";
import { savedSearchHref } from "@/lib/search/saved";

const origin = "https://archive.invalid";
it.each([
  "javascript:alert(1)",
  "jAvAsCrIpT:alert(1)",
  "java\nscript:alert(1)",
  "data:text/html,<script>alert(1)</script>",
  "//attacker.invalid/en/site/records",
  "https://archive.invalid@attacker.invalid/en/site/records",
  "https://user:secret@archive.invalid/en/site/records",
  "/en/site/records/../write",
  "/en/site/records/%2e%2e/write",
  "/api/v1/search?q=door",
  {},
  null,
])("rejects unsafe stored destinations: %s", (value) => {
  expect(savedSearchHref(value, origin)).toBeNull();
});
it("constructs a fixed local path with encoded canonical parameters", () => {
  expect(
    savedSearchHref(
      "https://archive.invalid/ko/site/records?type=record&type=incident&q=%3Cscript%3E&next=https://attacker.invalid#ignored",
      origin,
    ),
  ).toBe("/ko/site/records?q=%3Cscript%3E&type=incident&type=record");
});
