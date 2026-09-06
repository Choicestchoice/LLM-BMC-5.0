import { z } from "zod";

export const BMC_BLOCKS = [
  "keyPartners",
  "keyActivities",
  "keyResources",
  "valuePropositions",
  "customerRelationships",
  "channels",
  "customerSegments",
  "costStructure",
  "revenueStreams",
] as const;

export type BmcBlockKey = (typeof BMC_BLOCKS)[number];

export const BMC_LABELS: Record<BmcBlockKey, string> = {
  keyPartners: "Key Partners",
  keyActivities: "Key Activities",
  keyResources: "Key Resources",
  valuePropositions: "Value Propositions",
  customerRelationships: "Customer Relationships",
  channels: "Channels",
  customerSegments: "Customer Segments",
  costStructure: "Cost Structure",
  revenueStreams: "Revenue Streams",
};

export const BMC_GUIDANCE: Record<
  BmcBlockKey,
  { hint: string; placeholder: string; examples: string[] }
> = {
  keyPartners: {
    hint: "The network of suppliers, alliances, and partners that make the model work.",
    placeholder:
      "e.g. Component suppliers, logistics partners, university R&D lab, channel resellers",
    examples: ["Strategic suppliers", "Joint-venture partners", "Outsourced manufacturers"],
  },
  keyActivities: {
    hint: "The most important things you must do to deliver your value proposition.",
    placeholder:
      "e.g. Product engineering, on-site installation, customer onboarding, predictive maintenance",
    examples: ["Production", "Problem solving", "Platform/network operations"],
  },
  keyResources: {
    hint: "The assets — physical, intellectual, human, financial — required to operate.",
    placeholder:
      "e.g. Skilled engineering team, proprietary IP, manufacturing facility, working capital",
    examples: ["IP & patents", "Specialist talent", "Infrastructure"],
  },
  valuePropositions: {
    hint: "The bundle of products/services that creates value for a specific customer segment.",
    placeholder:
      "e.g. 30% lower energy use, 24h turnaround, fully traceable supply chain",
    examples: ["Performance", "Cost reduction", "Convenience", "Customisation"],
  },
  customerRelationships: {
    hint: "The type of relationship you establish and maintain with each segment.",
    placeholder:
      "e.g. Dedicated account manager, self-service portal, online community",
    examples: ["Personal assistance", "Self-service", "Co-creation"],
  },
  channels: {
    hint: "How you reach, sell to, and deliver to your customer segments.",
    placeholder: "e.g. Direct field sales, e-commerce, channel partners, in-app",
    examples: ["Owned web/app", "Partner stores", "Direct sales force"],
  },
  customerSegments: {
    hint: "The distinct groups of people or organisations you serve.",
    placeholder:
      "e.g. Mid-sized electronics manufacturers in DACH, sustainability-focused SMEs",
    examples: ["Mass market", "Niche", "Multi-sided platform"],
  },
  costStructure: {
    hint: "The most significant costs incurred to operate the business model.",
    placeholder:
      "e.g. Payroll for engineers, raw materials, cloud infrastructure, R&D",
    examples: ["Fixed costs", "Variable costs", "Economies of scale"],
  },
  revenueStreams: {
    hint: "How the business captures value — pricing and revenue mechanics.",
    placeholder:
      "e.g. Hardware sale + 12% annual service contract, SaaS subscription, usage-based fees",
    examples: ["One-time sale", "Subscription", "Licensing", "Usage fee"],
  },
};

export const businessInputSchema = z.object({
  businessName: z.string().trim().min(1).max(200),
  industry: z.string().trim().min(1).max(120),
  size: z.string().trim().min(1).max(80),
  region: z.string().trim().min(1).max(120),
  description: z.string().trim().min(20).max(4000),
  challenges: z.string().trim().max(2000).optional().default(""),
  currentTech: z.string().trim().max(2000).optional().default(""),
});

export type BusinessInput = z.infer<typeof businessInputSchema>;

export const bmcSchema = z.object({
  keyPartners: z.array(z.string()),
  keyActivities: z.array(z.string()),
  keyResources: z.array(z.string()),
  valuePropositions: z.array(z.string()),
  customerRelationships: z.array(z.string()),
  channels: z.array(z.string()),
  customerSegments: z.array(z.string()),
  costStructure: z.array(z.string()),
  revenueStreams: z.array(z.string()),
});

export type Bmc = z.infer<typeof bmcSchema>;

export const EMPTY_BMC: Bmc = {
  keyPartners: [],
  keyActivities: [],
  keyResources: [],
  valuePropositions: [],
  customerRelationships: [],
  channels: [],
  customerSegments: [],
  costStructure: [],
  revenueStreams: [],
};

const INDUSTRY5_PRINCIPLE = z.enum([
  "humanCentricity",
  "sustainability",
  "resilience",
]);

export type Industry5Principle = z.infer<typeof INDUSTRY5_PRINCIPLE>;

export const INDUSTRY5_LABELS: Record<Industry5Principle, string> = {
  humanCentricity: "Human-Centricity",
  sustainability: "Sustainability",
  resilience: "Resilience",
};

export const recommendationsSchema = z.object({
  industry5: z.array(
    z.object({
      principle: INDUSTRY5_PRINCIPLE,
      title: z.string(),
      rationale: z.string(),
      score: z.number().min(1).max(5),
    }),
  ),
  technology: z.array(
    z.object({
      title: z.string(),
      whyItFits: z.string(),
      expectedImpact: z.string(),
    }),
  ),
  strategic: z.array(
    z.object({
      title: z.string(),
      relatedBlock: z.string(),
      suggestion: z.string(),
      impact: z.string(),
    }),
  ),
});

export type Recommendations = z.infer<typeof recommendationsSchema>;

export const artefactSchema = z.object({
  bmc: bmcSchema,
  recommendations: recommendationsSchema,
});

export type Artefact = z.infer<typeof artefactSchema>;

export const EVAL_DIMS = [
  {
    key: "uxExperience",
    label: "Overall UX experience",
    help: "How was the look, feel, and flow of the platform?",
  },
  {
    key: "easeOfUse",
    label: "Ease of use / navigation",
    help: "How easy was it to move through the steps and complete the process?",
  },
  {
    key: "clarity",
    label: "Clarity of the platform",
    help: "Were instructions, hints, and labels clear and understandable?",
  },
  {
    key: "usefulness",
    label: "Usefulness of the process for your business",
    help: "Did going through this give you useful insight for your business?",
  },
  {
    key: "recommendationValue",
    label: "Value of the generated recommendations",
    help: "How valuable were the recommendations produced for you?",
  },
] as const;

export type EvalKey = (typeof EVAL_DIMS)[number]["key"];

export const evaluationSchema = z.object({
  submissionId: z.string().uuid(),
  scores: z.object({
    uxExperience: z.number().min(1).max(5),
    easeOfUse: z.number().min(1).max(5),
    clarity: z.number().min(1).max(5),
    usefulness: z.number().min(1).max(5),
    recommendationValue: z.number().min(1).max(5),
  }),
  comment: z.string().max(2000).optional().default(""),
});

export type EvaluationInput = z.infer<typeof evaluationSchema>;
