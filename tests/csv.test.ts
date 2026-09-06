import { describe, it, expect } from "vitest";
import { csvEscape, buildFeedbackCsv } from "@/lib/csv";
import { EVAL_DIMS } from "@/lib/artefact";
import type { FeedbackRow } from "@/lib/admin.functions";

describe("csvEscape", () => {
  it("returns empty string for null/undefined", () => {
    expect(csvEscape(null)).toBe("");
    expect(csvEscape(undefined)).toBe("");
  });
  it("leaves plain strings untouched", () => {
    expect(csvEscape("hello")).toBe("hello");
  });
  it("quotes values that contain commas", () => {
    expect(csvEscape("a,b")).toBe('"a,b"');
  });
  it("quotes and escapes embedded double quotes", () => {
    expect(csvEscape('she said "hi"')).toBe('"she said ""hi"""');
  });
  it("quotes values containing newlines", () => {
    expect(csvEscape("line1\nline2")).toBe('"line1\nline2"');
  });
  it("stringifies numbers", () => {
    expect(csvEscape(42)).toBe("42");
  });
});

describe("buildFeedbackCsv", () => {
  const row: FeedbackRow = {
    id: "fb-1",
    createdAt: "2026-01-15T10:00:00.000Z",
    comment: 'Great, "loved" it',
    scores: {
      uxExperience: 5,
      easeOfUse: 4,
      clarity: 5,
      usefulness: 4,
      recommendationValue: 5,
    },
    submission: {
      id: "s-1",
      businessName: "Acme",
      industry: "Manufacturing",
      size: "50-200",
      region: "EU",
      description: "Sustainable, resilient",
      createdAt: "2026-01-14T09:00:00.000Z",
    },
  };

  it("prefixes a UTF-8 BOM", () => {
    expect(buildFeedbackCsv([])[0]).toBe("\ufeff");
  });
  it("includes headers for every EVAL_DIMS label", () => {
    const csv = buildFeedbackCsv([]);
    for (const d of EVAL_DIMS) {
      expect(csv.includes(csvEscape(d.label))).toBe(true);
    }
  });
  it("emits one row per feedback", () => {
    const csv = buildFeedbackCsv([row]);
    const dataLines = csv.replace("\ufeff", "").split("\r\n");
    expect(dataLines).toHaveLength(2);
    expect(dataLines[1]).toContain("fb-1");
    expect(dataLines[1]).toContain('"Great, ""loved"" it"');
    expect(dataLines[1]).toContain("Acme");
  });
  it("handles rows with a missing submission gracefully", () => {
    const csv = buildFeedbackCsv([{ ...row, submission: null }]);
    expect(csv).toContain("fb-1");
  });
});
