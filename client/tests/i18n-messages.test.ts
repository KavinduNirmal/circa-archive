import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Translation mistakes are invisible at the type level: a missing key renders as
 * its own path, and a mistyped placeholder renders as literal braces. Both are
 * caught here by comparing the two catalogs against each other rather than
 * against a hand-maintained list, so adding a message cannot silently skip a
 * language.
 *
 * Catalogs are one file per namespace per language, so the comparison is over the
 * union of every namespace's keys, keyed by `<namespace>.<key>`. Paths resolve
 * from the working directory because `import.meta.url` is not a file URL under
 * the jsdom environment; the test scripts run from `client/`.
 */

const catalogRoot = resolve(process.cwd(), "messages");

type Catalog = Record<string, unknown>;

function leafKeys(value: unknown, prefix: string, leaves: Map<string, string>) {
  for (const [key, entry] of Object.entries(value as Catalog)) {
    const path = `${prefix}.${key}`;
    if (typeof entry === "string") leaves.set(path, entry);
    else if (entry && typeof entry === "object") leafKeys(entry, path, leaves);
  }
}

function namespaceFiles(locale: string): string[] {
  return readdirSync(`${catalogRoot}/${locale}`).filter((name) => name.endsWith(".json")).sort();
}

function readCatalog(locale: string): Map<string, string> {
  const leaves = new Map<string, string>();
  for (const file of namespaceFiles(locale)) {
    const namespace = file.replace(/\.json$/, "");
    leafKeys(JSON.parse(readFileSync(`${catalogRoot}/${locale}/${file}`, "utf8")), namespace, leaves);
  }
  return leaves;
}

/** ICU arguments, so a translation cannot quietly drop or invent a placeholder. */
function placeholders(text: string): string[] {
  return [...text.matchAll(/\{(\w+)/g)].map((match) => match[1]).sort();
}

/**
 * Rich-text tags, so a translation cannot drop or unbalance the element a phrase
 * is wrapped in. The landing page hands `<strong>` and `<b>` through `t.rich`, and
 * a tag left open in one language would swallow the rest of the paragraph.
 */
function richTags(text: string): string[] {
  return [...text.matchAll(/<(\/?)(\w+)>/g)].map((match) => `${match[1]}${match[2]}`).sort();
}

/** Well-formed nested markup and matched braces. */
function balanced(text: string): boolean {
  const stack: string[] = [];
  for (const match of text.matchAll(/<(\/?)(\w+)>/g)) {
    if (match[1]) {
      if (stack.pop() !== match[2]) return false;
    } else stack.push(match[2]);
  }
  const opens = [...text.matchAll(/\{/g)].length;
  const closes = [...text.matchAll(/\}/g)].length;
  return stack.length === 0 && opens === closes;
}

const english = readCatalog("en");
const korean = readCatalog("ko");

describe("message catalogs", () => {
  it("ships the same namespaces in both languages", () => {
    expect(namespaceFiles("ko")).toEqual(namespaceFiles("en"));
  });

  it("defines the same keys in both languages", () => {
    expect([...korean.keys()].sort()).toEqual([...english.keys()].sort());
  });

  it("has no empty translations", () => {
    for (const [locale, leaves] of [["en", english], ["ko", korean]] as const) {
      const empty = [...leaves].filter(([, text]) => text.trim() === "").map(([key]) => key);
      expect(empty, `${locale} has empty messages`).toEqual([]);
    }
  });

  it("keeps every ICU placeholder in the translation", () => {
    const mismatched = [...english]
      .filter(([key, text]) => placeholders(korean.get(key) ?? "").join(",") !== placeholders(text).join(","))
      .map(([key]) => key);
    expect(mismatched, "translated messages disagree about their placeholders").toEqual([]);
  });

  it("keeps every rich-text tag in the translation", () => {
    const mismatched = [...english]
      .filter(([key, text]) => richTags(korean.get(key) ?? "").join(",") !== richTags(text).join(","))
      .map(([key]) => key);
    expect(mismatched, "translated messages disagree about their rich-text tags").toEqual([]);
  });

  it("leaves no unbalanced tag or brace in either language", () => {
    for (const [locale, leaves] of [["en", english], ["ko", korean]] as const) {
      const broken = [...leaves].filter(([, text]) => !balanced(text)).map(([key]) => key);
      expect(broken, `${locale} has malformed markup`).toEqual([]);
    }
  });

  it("actually translates the shell and the landing page", () => {
    for (const key of ["landing.enterArchive", "shell.startLabel", "boot.posting"]) {
      expect(english.has(key), `en is missing ${key}`).toBe(true);
      expect(korean.get(key), `ko is missing ${key}`).toBeTruthy();
    }
  });

  it("writes Korean copy in Korean, so an untranslated stub is visible", () => {
    // Prose, not a brand name or an archive code, so leaving it in English is a miss.
    const prose = [
      "landing.enterArchive",
      "landing.accessIntro",
      "shell.startLabel",
      "shell.settingsIntro",
      "shell.notificationsEmpty",
      "boot.posting",
    ];
    for (const key of prose) {
      expect(korean.get(key), `${key} is still English`).not.toBe(english.get(key));
    }
  });
});
