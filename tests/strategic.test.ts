import { describe, it, expect } from "vitest";
import { strategicReportSchema } from "@/lib/strategic";

const validReport = {
  executiveSummary: "Summary.",
  keyFindings: ["A", "B"],
  strategicRecommendations: [
    {
      title: "T1",
      priority: "High",
      timeframe: "Short-term (0-6 months)",
      rationale: "R",
      actionSteps: ["s1", "s2"],
      expectedImpact: "I",
      risks: "risks",
    },
    {
      title: "T2",
      priority: "Medium",
      timeframe: "Medium-term (6-18 months)",
      rationale: "R",
      actionSteps: ["s1", "s2"],
      expectedImpact: "I",
      risks: "risks",
    },
    {
      title: "T3",
      priority: "Low",
      timeframe: "Long-term (18+ months)",
      rationale: "R",
      actionSteps: ["s1", "s2"],
      expectedImpact: "I",
      risks: "risks",
    },
  ],
  nextSteps: ["a", "b", "c"],
};

describe("strategicReportSchema", () => {
  it("accepts a valid report", () => {
    expect(strategicReportSchema.parse(validReport).keyFindings).toHaveLength(2);
  });
  it("rejects fewer than 3 strategic recommendations", () => {
    expect(() =>
      strategicReportSchema.parse({
        ...validReport,
        strategicRecommendations: validReport.strategicRecommendations.slice(0, 2),
      }),
    ).toThrow();
  });
  it("rejects an invalid priority", () => {
    const bad = {
      ...validReport,
      strategicRecommendations: [
        { ...validReport.strategicRecommendations[0], priority: "Urgent" },
        ...validReport.strategicRecommendations.slice(1),
      ],
    };
    expect(() => strategicReportSchema.parse(bad)).toThrow();
  });
  it("rejects too few nextSteps", () => {
    expect(() =>
      strategicReportSchema.parse({ ...validReport, nextSteps: ["only one"] }),
    ).toThrow();
  });
});
