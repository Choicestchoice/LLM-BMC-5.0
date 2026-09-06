import { describe, it, expect } from "vitest";
import {
  businessInputSchema,
  bmcSchema,
  evaluationSchema,
  recommendationsSchema,
  artefactSchema,
  EMPTY_BMC,
  BMC_BLOCKS,
  BMC_LABELS,
  BMC_GUIDANCE,
  EVAL_DIMS,
  INDUSTRY5_LABELS,
} from "@/lib/artefact";

const validInput = {
  businessName: "Acme Corp",
  industry: "Manufacturing",
  size: "50-200",
  region: "EU",
  description: "We build sustainable electronics for the DACH market.",
  challenges: "",
  currentTech: "",
};

describe("businessInputSchema", () => {
  it("accepts a valid brief", () => {
    expect(businessInputSchema.parse(validInput).businessName).toBe("Acme Corp");
  });
  it("rejects a too-short description", () => {
    expect(() =>
      businessInputSchema.parse({ ...validInput, description: "too short" }),
    ).toThrow();
  });
  it("rejects empty required fields", () => {
    expect(() =>
      businessInputSchema.parse({ ...validInput, industry: "" }),
    ).toThrow();
  });
  it("defaults optional fields to empty string", () => {
    const parsed = businessInputSchema.parse({
      businessName: "A",
      industry: "B",
      size: "C",
      region: "D",
      description: "x".repeat(25),
    });
    expect(parsed.challenges).toBe("");
    expect(parsed.currentTech).toBe("");
  });
});

describe("bmcSchema", () => {
  it("accepts an empty BMC (all arrays)", () => {
    expect(bmcSchema.parse(EMPTY_BMC)).toEqual(EMPTY_BMC);
  });
  it("rejects missing blocks", () => {
    const { keyPartners: _kp, ...partial } = EMPTY_BMC;
    void _kp;
    expect(() => bmcSchema.parse(partial)).toThrow();
  });
});

describe("BMC constants", () => {
  it("exposes 9 canonical blocks", () => {
    expect(BMC_BLOCKS).toHaveLength(9);
  });
  it("has a label and guidance for every block", () => {
    for (const key of BMC_BLOCKS) {
      expect(BMC_LABELS[key]).toBeTruthy();
      expect(BMC_GUIDANCE[key].placeholder.length).toBeGreaterThan(0);
      expect(BMC_GUIDANCE[key].hint.length).toBeGreaterThan(0);
    }
  });
});

describe("evaluationSchema", () => {
  const validScores = {
    uxExperience: 4,
    easeOfUse: 5,
    clarity: 3,
    usefulness: 4,
    recommendationValue: 5,
  };
  const submissionId = "11111111-1111-4111-8111-111111111111";
  it("accepts valid scores", () => {
    const p = evaluationSchema.parse({
      submissionId,
      scores: validScores,
      comment: "great",
    });
    expect(p.scores.uxExperience).toBe(4);
  });
  it("rejects out-of-range scores", () => {
    expect(() =>
      evaluationSchema.parse({
        submissionId,
        scores: { ...validScores, clarity: 6 },
      }),
    ).toThrow();
  });
  it("rejects a non-uuid submission id", () => {
    expect(() =>
      evaluationSchema.parse({ submissionId: "nope", scores: validScores }),
    ).toThrow();
  });
  it("declares 5 evaluation dimensions", () => {
    expect(EVAL_DIMS).toHaveLength(5);
  });
});

describe("recommendationsSchema", () => {
  const rec = {
    industry5: [
      {
        principle: "humanCentricity",
        title: "Upskill operators",
        rationale: "Workforce currently under-trained.",
        score: 3,
      },
    ],
    technology: [
      { title: "IoT sensors", whyItFits: "Fits your line", expectedImpact: "10% uptime" },
    ],
    strategic: [
      {
        title: "Subscription add-on",
        relatedBlock: "Revenue Streams",
        suggestion: "Bundle support",
        impact: "MRR growth",
      },
    ],
  };
  it("accepts valid recommendations", () => {
    expect(recommendationsSchema.parse(rec).industry5[0].score).toBe(3);
  });
  it("rejects an unknown industry5 principle", () => {
    const bad = { ...rec, industry5: [{ ...rec.industry5[0], principle: "bogus" }] };
    expect(() => recommendationsSchema.parse(bad)).toThrow();
  });
  it("labels all industry5 principles", () => {
    expect(Object.keys(INDUSTRY5_LABELS)).toHaveLength(3);
  });
});

describe("artefactSchema", () => {
  it("combines BMC + recommendations", () => {
    const artefact = {
      bmc: EMPTY_BMC,
      recommendations: {
        industry5: [
          { principle: "resilience", title: "T", rationale: "R", score: 2 },
        ],
        technology: [
          { title: "T", whyItFits: "W", expectedImpact: "I" },
        ],
        strategic: [
          { title: "T", relatedBlock: "Channels", suggestion: "S", impact: "I" },
        ],
      },
    };
    expect(artefactSchema.parse(artefact).bmc.keyPartners).toEqual([]);
  });
});
