import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { artefactSchema, businessInputSchema, BMC_LABELS, INDUSTRY5_LABELS } from "./artefact";
import { strategicReportSchema, type StrategicReport } from "./strategic";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const SYSTEM_PROMPT = `You are a senior strategy consultant. Based on a business brief, its user-authored Business Model Canvas, and a set of AI-generated recommendations (Industry 5.0 alignment, technology adoption, strategic improvements), produce an actionable STRATEGIC RECOMMENDATIONS report the business can use to make decisions.

Return ONLY a single JSON object (no prose, no markdown fences) matching exactly this TypeScript shape:

{
  "executiveSummary": string,
  "keyFindings": string[],
  "strategicRecommendations": Array<{
    "title": string,
    "priority": "High" | "Medium" | "Low",
    "timeframe": "Short-term (0-6 months)" | "Medium-term (6-18 months)" | "Long-term (18+ months)",
    "rationale": string,
    "actionSteps": string[],
    "expectedImpact": string,
    "risks": string
  }>,
  "nextSteps": string[]
}

Rules:
- Ground every recommendation in the supplied BMC + recommendations.
- Prioritise where Industry 5.0 alignment scores are weakest or where BMC blocks show gaps.
- Be specific and business-ready. No generic boilerplate.
- 4-6 strategic recommendations, 3-6 key findings, 3-5 next steps.
- Output MUST be valid JSON. No trailing commas, no comments, no code fences.`;

function extractJson(text: string): unknown {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object found in model output");
  return JSON.parse(candidate.slice(start, end + 1));
}

const inputSchema = z.object({
  input: businessInputSchema,
  artefact: artefactSchema,
});

export const generateStrategicReport = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY missing");

    const { input, artefact } = data;

    const userPrompt = `BUSINESS BRIEF
Name: ${input.businessName}
Industry: ${input.industry}
Size: ${input.size}
Region: ${input.region}
Description: ${input.description}
Current challenges: ${input.challenges || "(none provided)"}
Current technologies: ${input.currentTech || "(none provided)"}

BUSINESS MODEL CANVAS (user-authored)
${Object.entries(artefact.bmc)
  .map(
    ([k, v]) =>
      `${BMC_LABELS[k as keyof typeof BMC_LABELS]}: ${(v as string[]).length ? (v as string[]).join("; ") : "(empty)"}`,
  )
  .join("\n")}

INDUSTRY 5.0 ALIGNMENT
${artefact.recommendations.industry5
  .map(
    (r) =>
      `- [${INDUSTRY5_LABELS[r.principle]} ${r.score}/5] ${r.title} — ${r.rationale}`,
  )
  .join("\n")}

TECHNOLOGY ADOPTION RECOMMENDATIONS
${artefact.recommendations.technology
  .map((r, i) => `${i + 1}. ${r.title} — Why: ${r.whyItFits} | Impact: ${r.expectedImpact}`)
  .join("\n")}

STRATEGIC IMPROVEMENTS
${artefact.recommendations.strategic
  .map((r, i) => `${i + 1}. [${r.relatedBlock}] ${r.title} — ${r.suggestion} | Impact: ${r.impact}`)
  .join("\n")}

Generate the strategic recommendations report as JSON now.`;

    const gateway = createLovableAiGatewayProvider(key);

    try {
      const { text } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        system: SYSTEM_PROMPT,
        prompt: userPrompt,
      });
      const parsed = extractJson(text);
      return strategicReportSchema.parse(parsed) as StrategicReport;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("429")) throw new Error("Rate limit reached. Please wait and retry.");
      if (msg.includes("402")) throw new Error("AI credits exhausted. Top up in Settings → Workspace → Usage.");
      throw new Error(`Strategic report generation failed: ${msg}`);
    }
  });
