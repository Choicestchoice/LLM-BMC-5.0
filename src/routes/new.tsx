import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  suggestBmcBlock,
  suggestFullBmc,
  generateRecommendations,
  saveSubmission,
  saveEvaluation,
} from "@/lib/artefact.functions";
import {
  EVAL_DIMS,
  EMPTY_BMC,
  type Bmc,
  type BmcBlockKey,
  type BusinessInput,
  type Recommendations,
} from "@/lib/artefact";
import { getSessionId } from "@/lib/session";
import { BMCEditor } from "@/components/bmc-canvas";
import { RecommendationsView } from "@/components/recommendations";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  Eye,
  Sparkles,
} from "lucide-react";
import { generateStrategicReportUrl } from "@/lib/pdf-report";
import { generateStrategicReport } from "@/lib/strategic.functions";
import type { StrategicReport } from "@/lib/strategic";

export const Route = createFileRoute("/new")({
  head: () => ({
    meta: [
      { title: "New submission — BMC Studio" },
      {
        name: "description",
        content:
          "Tell us about your business, build your Business Model Canvas, and get personalised Industry 5.0, technology, and strategic recommendations.",
      },
    ],
  }),
  component: Wizard,
});

type Step = "input" | "bmc" | "generating" | "recs" | "eval" | "done";

const STEPS: { id: Step; label: string }[] = [
  { id: "input", label: "Business info" },
  { id: "bmc", label: "Your Business Model Canvas" },
  { id: "recs", label: "Recommendations" },
  { id: "eval", label: "Your feedback" },
  { id: "done", label: "Done" },
];

const EMPTY: BusinessInput = {
  businessName: "",
  industry: "",
  size: "",
  region: "",
  description: "",
  challenges: "",
  currentTech: "",
};

function Wizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("input");
  const [input, setInput] = useState<BusinessInput>(EMPTY);
  const [bmc, setBmc] = useState<Bmc>(EMPTY_BMC);
  const [recs, setRecs] = useState<Recommendations | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [evalScores, setEvalScores] = useState<Record<string, number>>({});
  const [evalComment, setEvalComment] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [strategic, setStrategic] = useState<StrategicReport | null>(null);
  const [strategicLoading, setStrategicLoading] = useState(false);
  const [strategicError, setStrategicError] = useState<string | null>(null);
  const [suggestingBlock, setSuggestingBlock] = useState<BmcBlockKey | null>(null);
  const [draftingBmc, setDraftingBmc] = useState(false);

  const genStrategic = useServerFn(generateStrategicReport);
  const suggestBlockFn = useServerFn(suggestBmcBlock);
  const suggestFullFn = useServerFn(suggestFullBmc);
  const genRecsFn = useServerFn(generateRecommendations);
  const save = useServerFn(saveSubmission);

  useEffect(() => {
    if (step !== "done" || !recs || strategic || strategicLoading) return;
    setStrategicLoading(true);
    setStrategicError(null);
    genStrategic({ data: { input, artefact: { bmc, recommendations: recs } } })
      .then((r) => setStrategic(r))
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Failed to generate strategic report";
        setStrategicError(msg);
        toast.error(msg);
      })
      .finally(() => setStrategicLoading(false));
  }, [step, recs, bmc, input, strategic, strategicLoading, genStrategic]);

  async function handleInputNext() {
    setError(null);
    const fieldLabels: Record<string, string> = {
      businessName: "Business name",
      industry: "Industry",
      size: "Size",
      region: "Region",
      description: "Description",
    };
    const requiredKeys = ["businessName", "industry", "size", "region", "description"] as const;
    const errs: Record<string, string> = {};
    for (const k of requiredKeys) {
      const v = (input[k] ?? "").toString().trim();
      if (!v) {
        errs[k] = `${fieldLabels[k]} is required.`;
      } else if (k === "description" && v.length < 20) {
        errs[k] = `Description should be at least 20 characters (currently ${v.length}).`;
      }
    }
    // Length caps (mirror schema) for filled fields
    const caps: Record<string, number> = {
      businessName: 200, industry: 120, size: 80, region: 120, description: 4000,
    };
    for (const k of requiredKeys) {
      if (errs[k]) continue;
      const v = (input[k] ?? "").toString().trim();
      if (v.length > caps[k]) errs[k] = `${fieldLabels[k]} must be under ${caps[k]} characters.`;
    }
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      const missing = Object.keys(errs).map((k) => fieldLabels[k]);
      setError(
        missing.length === 1
          ? `Please fix ${missing[0]}.`
          : `Please fix ${missing.length} fields: ${missing.join(", ")}.`,
      );
      // Focus first invalid
      if (typeof document !== "undefined") {
        const first = Object.keys(errs)[0];
        const el = document.querySelector<HTMLElement>(`[data-field="${first}"]`);
        el?.focus();
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    setFieldErrors({});
    setStep("bmc");
  }

  async function handleSuggestBlock(block: BmcBlockKey): Promise<string[]> {
    setSuggestingBlock(block);
    try {
      const res = await suggestBlockFn({ data: { input, bmc, block } });
      return res?.items ?? [];
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Suggestion failed");
      return [];
    } finally {
      setSuggestingBlock(null);
    }
  }

  async function handleSuggestFull() {
    setDraftingBmc(true);
    try {
      const draft = await suggestFullFn({ data: { input } });
      if (draft) setBmc(draft);
      toast.success("Draft created — edit it to fit your business.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Draft failed");
    } finally {
      setDraftingBmc(false);
    }
  }

  async function handleBmcNext() {
    setError(null);
    const required: BmcBlockKey[] = [
      "valuePropositions",
      "customerSegments",
      "revenueStreams",
    ];
    const reqLabels: Record<BmcBlockKey, string> = {
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
    const missing = required.filter((k) => bmc[k].length === 0);
    if (missing.length > 0) {
      setError(`Please fill at least: ${missing.map((k) => reqLabels[k]).join(", ")}.`);
      return;
    }
    setStep("generating");
    try {
      const result = await genRecsFn({ data: { input, bmc } });
      if (!result) throw new Error("No recommendations returned");
      setRecs(result);
      const sessionId = getSessionId();
      const saved = await save({
        data: {
          ...input,
          sessionId,
          artefact: { bmc, recommendations: result },
        },
      });
      setSubmissionId(saved.id);
      setStep("recs");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
      setStep("bmc");
    }
  }

  const stepForProgress = step === "generating" ? "bmc" : step;
  const progressIdx = STEPS.findIndex((s) => s.id === stepForProgress);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="font-display text-xl font-semibold tracking-tight">
            BMC<span className="text-primary">·</span>Studio
          </Link>
          <nav className="flex items-center gap-5 text-sm text-muted-foreground">
            <Link to="/admin" className="hover:text-foreground">
              Admin
            </Link>
            <Link to="/" className="hover:text-foreground">
              ← Home
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10 grid gap-10 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-10 lg:self-start">
          <ol className="space-y-1">
            {STEPS.map((s, i) => {
              const active = i === progressIdx;
              const done = i < progressIdx;
              return (
                <li
                  key={s.id}
                  className={`flex items-center gap-3 py-2 text-sm ${
                    active ? "text-foreground font-medium" : done ? "text-foreground/60" : "text-muted-foreground/60"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] tabular-nums ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : done
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {done ? <Check className="h-3 w-3" /> : i + 1}
                  </span>
                  {s.label}
                </li>
              );
            })}
          </ol>
        </aside>

        <main className="min-w-0">
          {error && (
            <div
              role="alert"
              className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              <div className="font-medium mb-1">{error}</div>
              {Object.keys(fieldErrors).length > 1 && (
                <ul className="list-disc pl-5 space-y-0.5 text-destructive/90">
                  {Object.entries(fieldErrors).map(([k, msg]) => (
                    <li key={k}>{msg}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {step === "input" && (
            <BusinessForm
              input={input}
              setInput={setInput}
              onSubmit={handleInputNext}
              errors={fieldErrors}
              clearError={(k) =>
                setFieldErrors((prev) => {
                  if (!prev[k]) return prev;
                  const { [k]: _, ...rest } = prev;
                  return rest;
                })
              }
            />
          )}

          {step === "bmc" && (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
                Step 2 of 5
              </p>
              <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
                <h1 className="font-display text-4xl font-medium">
                  Build your Business Model Canvas
                </h1>
                <Button
                  variant="outline"
                  onClick={handleSuggestFull}
                  disabled={draftingBmc}
                >
                  {draftingBmc ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-1" />
                  )}
                  Draft with AI
                </Button>
              </div>
              <p className="text-muted-foreground mb-8 max-w-2xl">
                Fill in each block — one idea per line. Use the placeholder text and
                hints as guidance, or tap <strong>Suggest</strong> on a block to get
                AI-generated starter bullets you can edit. Value Propositions,
                Customer Segments and Revenue Streams are required.
              </p>

              <BMCEditor
                bmc={bmc}
                setBmc={setBmc}
                onSuggestBlock={handleSuggestBlock}
                suggesting={suggestingBlock}
              />

              <div className="mt-10 flex items-center justify-between">
                <Button variant="ghost" onClick={() => setStep("input")}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button onClick={handleBmcNext}>
                  Generate recommendations <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {step === "generating" && <Generating />}

          {step === "recs" && recs && (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
                Step 3 of 5
              </p>
              <h1 className="font-display text-4xl font-medium mb-2">
                Your recommendations
              </h1>
              <p className="text-muted-foreground mb-8 max-w-2xl">
                Personalised to your business and the canvas you just built —
                Industry 5.0 alignment, technologies to consider, and strategic
                improvements tied to your model.
              </p>
              <RecommendationsView recs={recs} />
              <div className="mt-10 flex items-center justify-between">
                <Button variant="ghost" onClick={() => setStep("bmc")}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button onClick={() => setStep("eval")}>
                  Share your feedback <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {step === "eval" && submissionId && (
            <EvalForm
              submissionId={submissionId}
              scores={evalScores}
              setScores={setEvalScores}
              comment={evalComment}
              setComment={setEvalComment}
              onBack={() => setStep("recs")}
              onDone={() => setStep("done")}
            />
          )}

          {step === "done" && (
            <>
              <DoneScreen
                ready={!!strategic}
                loading={strategicLoading}
                error={strategicError}
                onPreview={() => {
                  if (!strategic || !submissionId) return;
                  try {
                    const url = generateStrategicReportUrl({
                      input,
                      report: strategic,
                      submissionId,
                    });
                    setPdfUrl(url);
                    setPdfOpen(true);
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Failed to generate preview");
                  }
                }}
                onDownload={() => {
                  if (!strategic || !submissionId) return;
                  try {
                    const url = generateStrategicReportUrl({
                      input,
                      report: strategic,
                      submissionId,
                    });
                    const link = document.createElement("a");
                    link.href = url;
                    const safeName = input.businessName.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
                    link.download = `strategic-recommendations-${safeName || "report"}.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Failed to download");
                  }
                }}
                onRestart={() => {
                  setInput(EMPTY);
                  setBmc(EMPTY_BMC);
                  setRecs(null);
                  setSubmissionId(null);
                  setEvalScores({});
                  setEvalComment("");
                  setPdfUrl(null);
                  setStrategic(null);
                  setStrategicError(null);
                  setStep("input");
                  navigate({ to: "/new" });
                }}
              />
              <Dialog open={pdfOpen} onOpenChange={setPdfOpen}>
                <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 flex flex-col">
                  <DialogHeader className="px-6 pt-6 pb-2">
                    <DialogTitle>Strategic recommendations report</DialogTitle>
                    <DialogDescription>
                      Review the report before downloading.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex-1 min-h-0 px-6 pb-6">
                    {pdfUrl ? (
                      <iframe
                        src={pdfUrl}
                        title="PDF Preview"
                        className="w-full h-full rounded-md border"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        Generating preview…
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function BusinessForm({
  input,
  setInput,
  onSubmit,
  errors,
  clearError,
}: {
  input: BusinessInput;
  setInput: (i: BusinessInput) => void;
  onSubmit: () => void;
  errors: Record<string, string>;
  clearError: (k: string) => void;
}) {
  const set = <K extends keyof BusinessInput>(k: K, v: BusinessInput[K]) => {
    setInput({ ...input, [k]: v });
    if (errors[k as string]) clearError(k as string);
  };

  const invalidClass =
    "border-destructive focus-visible:ring-destructive/40 focus-visible:border-destructive";

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
        Step 1 of 5
      </p>
      <h1 className="font-display text-4xl font-medium mb-2">Tell us about your business</h1>
      <p className="text-muted-foreground mb-8">
        A short, specific brief makes the rest of the process sharper. Fields marked{" "}
        <span className="text-destructive">*</span> are required. Everything stays anonymous.
      </p>

      <div className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Business name" required error={errors.businessName} htmlFor="businessName">
            <Input
              id="businessName"
              data-field="businessName"
              aria-invalid={!!errors.businessName}
              aria-describedby={errors.businessName ? "businessName-error" : undefined}
              className={errors.businessName ? invalidClass : ""}
              value={input.businessName}
              onChange={(e) => set("businessName", e.target.value)}
              placeholder="Acme Robotics"
            />
          </Field>
          <Field label="Industry" required error={errors.industry} htmlFor="industry">
            <Input
              id="industry"
              data-field="industry"
              aria-invalid={!!errors.industry}
              aria-describedby={errors.industry ? "industry-error" : undefined}
              className={errors.industry ? invalidClass : ""}
              value={input.industry}
              onChange={(e) => set("industry", e.target.value)}
              placeholder="Precision manufacturing"
            />
          </Field>
          <Field label="Size" required error={errors.size} htmlFor="size">
            <Input
              id="size"
              data-field="size"
              aria-invalid={!!errors.size}
              aria-describedby={errors.size ? "size-error" : undefined}
              className={errors.size ? invalidClass : ""}
              value={input.size}
              onChange={(e) => set("size", e.target.value)}
              placeholder="50 employees"
            />
          </Field>
          <Field label="Region" required error={errors.region} htmlFor="region">
            <Input
              id="region"
              data-field="region"
              aria-invalid={!!errors.region}
              aria-describedby={errors.region ? "region-error" : undefined}
              className={errors.region ? invalidClass : ""}
              value={input.region}
              onChange={(e) => set("region", e.target.value)}
              placeholder="Northern Europe"
            />
          </Field>
        </div>

        <Field
          label="Description"
          required
          hint="What does the business do, for whom, and how? (min 20 characters)"
          error={errors.description}
          htmlFor="description"
        >
          <Textarea
            id="description"
            data-field="description"
            aria-invalid={!!errors.description}
            aria-describedby={errors.description ? "description-error" : undefined}
            className={errors.description ? invalidClass : ""}
            rows={5}
            value={input.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="We design and assemble industrial robotic arms for small-batch electronics manufacturers…"
          />
        </Field>

        <Field label="Current challenges" hint="Optional">
          <Textarea
            rows={3}
            value={input.challenges}
            onChange={(e) => set("challenges", e.target.value)}
            placeholder="Skills shortage, rising energy costs, slow time-to-quote…"
          />
        </Field>

        <Field label="Current technologies in use" hint="Optional">
          <Textarea
            rows={3}
            value={input.currentTech}
            onChange={(e) => set("currentTech", e.target.value)}
            placeholder="On-prem ERP, manual CAD review, basic MES…"
          />
        </Field>
      </div>

      <div className="mt-10 flex justify-end">
        <Button size="lg" onClick={onSubmit}>
          Continue to Canvas <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
  required,
  error,
  htmlFor,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
  htmlFor?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <Label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
          {required && (
            <span className="text-destructive ml-0.5" aria-hidden="true">
              *
            </span>
          )}
        </Label>
        {hint && !error && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
      {error && (
        <p
          id={htmlFor ? `${htmlFor}-error` : undefined}
          role="alert"
          className="mt-1.5 text-xs text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function Generating() {
  const [phase, setPhase] = useState(0);
  const phases = [
    "Reading your business brief…",
    "Analysing your canvas…",
    "Drafting Industry 5.0 alignment…",
    "Selecting technology adoption ideas…",
    "Composing strategic improvements…",
  ];
  useEffect(() => {
    const t = setInterval(() => setPhase((p) => (p + 1) % phases.length), 2200);
    return () => clearInterval(t);
  }, [phases.length]);
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-6" />
      <h2 className="font-display text-2xl font-medium mb-2">Generating recommendations</h2>
      <p className="text-muted-foreground transition-opacity">{phases[phase]}</p>
    </div>
  );
}

function EvalForm({
  submissionId,
  scores,
  setScores,
  comment,
  setComment,
  onBack,
  onDone,
}: {
  submissionId: string;
  scores: Record<string, number>;
  setScores: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  comment: string;
  setComment: React.Dispatch<React.SetStateAction<string>>;
  onBack: () => void;
  onDone: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const save = useServerFn(saveEvaluation);

  const missing = EVAL_DIMS.filter((d) => !scores[d.key]);

  async function submit() {
    if (missing.length > 0) {
      toast.error(`Please score: ${missing.map((d) => d.label).join(", ")}`);
      const el = document.getElementById(`eval-${missing[0].key}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSubmitting(true);
    try {
      await save({
        data: {
          submissionId,
          sessionId: getSessionId(),
          scores: {
            uxExperience: scores.uxExperience,
            easeOfUse: scores.easeOfUse,
            clarity: scores.clarity,
            usefulness: scores.usefulness,
            recommendationValue: scores.recommendationValue,
          },
          comment,
        },
      });
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save evaluation");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Step 4 of 5</p>
      <h1 className="font-display text-4xl font-medium mb-2">How was your experience?</h1>
      <p className="text-muted-foreground mb-8 max-w-2xl">
        Help us improve the platform. Rate each dimension on a 1–5 scale
        (1 = poor, 5 = excellent) and leave a comment if you'd like.
      </p>

      <div className="space-y-6">
        {EVAL_DIMS.map((d) => (
          <div key={d.key} id={`eval-${d.key}`} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-baseline justify-between mb-1">
              <h3 className="font-medium">{d.label}</h3>
              <span className="text-xs tabular-nums text-muted-foreground">
                {scores[d.key] ? `${scores[d.key]}/5` : "—"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">{d.help}</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setScores({ ...scores, [d.key]: n })}
                  className={`flex-1 rounded-md border py-2.5 text-sm font-medium transition-colors ${
                    scores[d.key] === n
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div>
          <Label className="text-sm font-medium mb-1.5 block">Additional comments (optional)</Label>
          <Textarea
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What worked well? What could be better? Anything else to share?"
          />
        </div>
      </div>

      <div className="mt-10 flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Button onClick={submit} disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
          Submit feedback
        </Button>
      </div>
    </div>
  );
}

function DoneScreen({
  ready,
  loading,
  error,
  onPreview,
  onDownload,
  onRestart,
}: {
  ready: boolean;
  loading: boolean;
  error: string | null;
  onPreview: () => void;
  onDownload: () => void;
  onRestart: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center py-24">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-6">
        <Check className="h-7 w-7" />
      </div>
      <h1 className="font-display text-4xl font-medium mb-3">Thank you</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        Your feedback has been recorded. We've prepared a strategic
        recommendations report based on your canvas and the recommendations —
        preview or download it below.
      </p>

      {loading && (
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating your strategic recommendations report…
        </div>
      )}
      {error && !loading && (
        <div className="mb-6 max-w-md rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="outline" onClick={onPreview} disabled={!ready}>
          <Eye className="h-4 w-4 mr-1" /> Preview report
        </Button>
        <Button onClick={onDownload} disabled={!ready}>
          <Download className="h-4 w-4 mr-1" /> Download PDF
        </Button>
        <Button variant="outline" onClick={onRestart}>
          Start a new submission
        </Button>
        <Link to="/">
          <Button variant="ghost">Home</Button>
        </Link>
      </div>
    </div>
  );
}
