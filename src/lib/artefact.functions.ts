import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import {
  artefactSchema,
  bmcSchema,
  businessInputSchema,
  evaluationSchema,
  recommendationsSchema,
  BMC_LABELS,
  BMC_BLOCKS,
  type Bmc,
  type Recommendations,
} from "./artefact";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

function extractJson(text: string): unknown {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) {
    const sa = candidate.indexOf("[");
    const ea = candidate.lastIndexOf("]");
    if (sa !== -1 && ea !== -1) return JSON.parse(candidate.slice(sa, ea + 1));
    throw new Error("No JSON found in model output");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

function aiError(err: unknown): never {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("429")) throw new Error("Rate limit reached. Please wait and retry.");
  if (msg.includes("402"))
    throw new Error("AI credits exhausted. Top up in Settings → Workspace → Usage.");
  throw new Error(msg);
}

function bizContext(d: z.infer<typeof businessInputSchema>) {
  return `Business name: ${d.businessName}
Industry: ${d.industry}
Size: ${d.size}
Region: ${d.region}

Description:
${d.description}

Current challenges:
${d.challenges || "(none provided)"}

Current technologies in use:
${d.currentTech || "(none provided)"}`;
}

/* -------------------- Suggest one BMC block -------------------- */

const suggestBlockInput = z.object({
  input: businessInputSchema,
  bmc: bmcSchema.partial(),
  block: z.enum(BMC_BLOCKS),
});

export const suggestBmcBlock = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => suggestBlockInput.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY missing");
    const gateway = createLovableAiGatewayProvider(key);

    const otherBlocks = Object.entries(data.bmc)
      .filter(([k, v]) => k !== data.block && Array.isArray(v) && v.length > 0)
      .map(
        ([k, v]) =>
          `${BMC_LABELS[k as keyof typeof BMC_LABELS]}: ${(v as string[]).join("; ")}`,
      )
      .join("\n");

    const prompt = `${bizContext(data.input)}

The user is filling out the Business Model Canvas block: "${BMC_LABELS[data.block]}".

${otherBlocks ? `Other blocks already filled:\n${otherBlocks}\n` : ""}
Suggest 3 short, specific bullet items the user could put in the "${BMC_LABELS[data.block]}" block, tailored to their business. Each bullet must be at most 12 words. No numbering, no preamble.

Return ONLY a JSON array of 3 strings, e.g. ["bullet one", "bullet two", "bullet three"].`;

    try {
      const { text } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        prompt,
      });
      const parsed = extractJson(text);
      const items = z.array(z.string()).min(1).max(8).parse(parsed);
      return { items };
    } catch (err) {
      aiError(err);
    }
  });

/* -------------------- Suggest full BMC draft -------------------- */

const suggestFullInput = z.object({ input: businessInputSchema });

export const suggestFullBmc = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => suggestFullInput.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY missing");
    const gateway = createLovableAiGatewayProvider(key);

    const prompt = `${bizContext(data.input)}

Draft an initial Business Model Canvas for this business. Each of the 9 blocks must contain 2-4 short specific bullets (≤12 words each).

Return ONLY a single JSON object with this exact shape:
{
  "keyPartners": string[],
  "keyActivities": string[],
  "keyResources": string[],
  "valuePropositions": string[],
  "customerRelationships": string[],
  "channels": string[],
  "customerSegments": string[],
  "costStructure": string[],
  "revenueStreams": string[]
}
No prose, no markdown fences.`;

    try {
      const { text } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        prompt,
      });
      const parsed = extractJson(text);
      return bmcSchema.parse(parsed) as Bmc;
    } catch (err) {
      aiError(err);
    }
  });

/* -------------------- Generate Recommendations -------------------- */

const RECS_SYSTEM = `You are a strategic business analyst. Based on a business brief and its user-authored Business Model Canvas, produce three groups of personalised, context-aware recommendations.

Return ONLY a single JSON object (no prose, no markdown fences) matching exactly:

{
  "industry5": Array<{
    "principle": "humanCentricity" | "sustainability" | "resilience",
    "title": string,                  // short headline
    "rationale": string,              // 1-2 sentences tied to this business
    "score": 1|2|3|4|5                // current alignment of the business with this principle
  }>,                                 // 3-6 items; cover all three principles
  "technology": Array<{
    "title": string,                  // specific technology / tool
    "whyItFits": string,              // why it fits THIS business + BMC
    "expectedImpact": string          // concrete expected outcome
  }>,                                 // 3-6 items
  "strategic": Array<{
    "title": string,
    "relatedBlock": string,           // human-readable BMC block name, e.g. "Revenue Streams"
    "suggestion": string,             // what to change/add/improve
    "impact": string                  // expected business impact
  }>                                  // 3-6 items
}

Rules:
- Be specific to the supplied business and BMC. No generic boilerplate.
- Reference details from the BMC where useful.
- Output MUST be valid JSON. No trailing commas, no comments, no code fences.`;

const recsInput = z.object({
  input: businessInputSchema,
  bmc: bmcSchema,
});

export const generateRecommendations = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => recsInput.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY missing");
    const gateway = createLovableAiGatewayProvider(key);

    const bmcText = Object.entries(data.bmc)
      .map(
        ([k, v]) =>
          `${BMC_LABELS[k as keyof typeof BMC_LABELS]}: ${(v as string[]).length ? (v as string[]).join("; ") : "(empty)"}`,
      )
      .join("\n");

    const userPrompt = `${bizContext(data.input)}

USER-AUTHORED BUSINESS MODEL CANVAS:
${bmcText}

Generate the recommendations JSON now.`;

    try {
      const { text } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        system: RECS_SYSTEM,
        prompt: userPrompt,
      });
      const parsed = extractJson(text);
      return recommendationsSchema.parse(parsed) as Recommendations;
    } catch (err) {
      aiError(err);
    }
  });

/* -------------------- Persistence -------------------- */

const saveSubmissionInput = businessInputSchema.extend({
  sessionId: z.string().min(1).max(100),
  artefact: artefactSchema,
});

export const saveSubmission = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => saveSubmissionInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: row, error } = await supabaseAdmin
      .from("submissions")
      .insert({
        session_id: data.sessionId,
        business_name: data.businessName,
        industry: data.industry,
        size: data.size,
        region: data.region,
        description: data.description,
        challenges: data.challenges || null,
        current_tech: data.currentTech || null,
        artefact: data.artefact as unknown as never,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

const evalInput = evaluationSchema.extend({
  sessionId: z.string().min(1).max(100),
});

export const saveEvaluation = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => evalInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { error } = await supabaseAdmin.from("evaluations").insert({
      submission_id: data.submissionId,
      session_id: data.sessionId,
      scores: data.scores as unknown as never,
      comment: data.comment || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
