import { describe, it, expect } from "vitest";
import { formatSlug, generateSlugSuggestions } from "../lib/helpers/slug";

describe("formatSlug", () => {
  it("lowercases and replaces spaces with dashes", () => {
    expect(formatSlug("Baby Smith")).toBe("baby-smith");
  });

  it("strips punctuation and special characters", () => {
    expect(formatSlug("O'Brien, Jr.!")).toBe("obrien-jr");
  });

  it("collapses repeated dashes and trims edge dashes", () => {
    expect(formatSlug("--baby  --  smith--")).toBe("baby-smith");
  });

  it("handles emoji and unicode by removing them", () => {
    expect(formatSlug("Baby 👶 Smith")).toBe("baby-smith");
  });

  it("keeps numbers", () => {
    expect(formatSlug("Baby 2026 Pool")).toBe("baby-2026-pool");
  });
});

describe("generateSlugSuggestions", () => {
  it("returns at most 4 unique suggestions containing the baby name", () => {
    const out = generateSlugSuggestions("taken-slug", "Alice");
    expect(out.length).toBeGreaterThan(0);
    expect(out.length).toBeLessThanOrEqual(4);
    expect(new Set(out).size).toBe(out.length);
    for (const s of out) {
      expect(s).toContain("alice");
      expect(s).toMatch(/^[a-z0-9]+$/);
    }
  });

  it("strips non-alphanumerics from the baby name", () => {
    const out = generateSlugSuggestions("x", "Mary-Kate!");
    for (const s of out) {
      expect(s).toContain("marykate");
    }
  });

  it("returns an empty array when the name has no usable characters", () => {
    expect(generateSlugSuggestions("x", "!!!")).toEqual([]);
  });

  it("falls back to 'baby' when no name is given", () => {
    const out = generateSlugSuggestions("x", "");
    expect(out.length).toBeGreaterThan(0);
    for (const s of out) {
      expect(s).toContain("baby");
    }
  });
});
