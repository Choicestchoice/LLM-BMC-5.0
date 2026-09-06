import { z } from "zod";

export const strategicReportSchema = z.object({
  executiveSummary: z.string(),
  keyFindings: z.array(z.string()).min(2),
  strategicRecommendations: z
    .array(
      z.object({
        title: z.string(),
        priority: z.enum(["High", "Medium", "Low"]),
        timeframe: z.enum(["Short-term (0-6 months)", "Medium-term (6-18 months)", "Long-term (18+ months)"]),
        rationale: z.string(),
        actionSteps: z.array(z.string()).min(2),
        expectedImpact: z.string(),
        risks: z.string(),
      }),
    )
    .min(3),
  nextSteps: z.array(z.string()).min(3),
});

export type StrategicReport = z.infer<typeof strategicReportSchema>;
