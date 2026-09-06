# Platform Flow Restructure

Restructure the wizard so the user authors the BMC, recommendations are AI-generated from Step 1 + Step 2, the evaluation step focuses on UX feedback, and admins can review all feedback.

## Step 1 — Business info (unchanged)
Keep the existing brief form.

## Step 2 — User-authored Business Model Canvas
Replace the "Generating…" + auto-BMC view with an editable 9-block canvas the user fills in themselves.

For each of the 9 blocks (Key Partners, Key Activities, Key Resources, Value Propositions, Customer Relationships, Channels, Customer Segments, Cost Structure, Revenue Streams):
- short helper text explaining the block
- contextual placeholder example tailored to the block
- "Suggest with AI" button per block that calls a new server fn `suggestBmcBlock` using Step 1 inputs + any already-filled blocks as context, returning 2–3 short bullet suggestions the user can insert/append
- optional "Suggest all" button at top to pre-fill all blocks as a starting draft (user still edits)

Validation: require non-empty Value Propositions, Customer Segments, Revenue Streams before continuing; others optional but encouraged.

## Step 3 — Context-aware recommendations
After Step 2, call a new server fn `generateRecommendations({ input, bmc })` that returns three grouped lists:
1. Industry 5.0 alignment (Human-Centricity / Sustainability / Resilience), each with rationale + score
2. Technology adoption recommendations (title, why-it-fits, expected impact)
3. Strategic improvement suggestions (tied to specific BMC blocks)

Render as three tabs/sections on Step 3. Replace current `RecommendationsList` usage; reuse styling.

Drop the separate "Industry 5.0 assessment" step — fold it into Step 3 as the first group. Wizard becomes 5 steps:
1. Business info → 2. BMC → 3. Recommendations → 4. Feedback → 5. Done (report).

## Step 4 — UX & value feedback
Repurpose the evaluation form. New rating dimensions (1–5):
- Overall UX experience
- Ease of use / navigation
- Clarity of the platform
- Usefulness of the evaluation process for your business
- Perceived value of the generated recommendations

Keep the free-text comment box. Persist into existing `evaluations` table (scores jsonb already supports any keys; comment column stays).

## Step 5 — Done + Strategic report
Keep the AI strategic-recommendations PDF flow. Update its input to use the user-authored BMC + generated recommendations instead of the previous artefact shape.

## Admin dashboard
New route `/admin` (public link from header, no auth gate for now — matches the rest of the app which uses anonymous session IDs):
- Summary cards: total submissions, total feedback, average score per dimension
- Table of all feedback rows joined to submission (business name, industry, scores, comment, date)
- Per-row expand to see the original business brief + BMC

Data access via a new server fn `listFeedback` using `supabaseAdmin` (existing tables are service-role only per prior security fix). Returns aggregated stats + rows.

## Technical changes

- `src/lib/artefact.ts` — extend `Artefact` type: `bmc` (user-authored, same 9-block shape), `recommendations` grouped as `{ industry5: [...], technology: [...], strategic: [...] }`. Update Zod schema.
- `src/lib/artefact.functions.ts` — replace `generateArtefact` with:
  - `suggestBmcBlock({ input, bmc, block })` → `string[]` (Lovable AI, gemini-3-flash-preview)
  - `suggestFullBmc({ input })` → full BMC draft
  - `generateRecommendations({ input, bmc })` → grouped recommendations (structured output via Zod)
  - Keep `saveSubmission` / `saveEvaluation`; update payload shapes.
- `src/components/bmc-canvas.tsx` — convert to editable form (`BMCEditor`) with per-block textarea + "Suggest" button; keep read-only `BMCCanvas` for the report/admin view.
- `src/components/recommendations.tsx` — render the new grouped shape with tabs.
- `src/routes/new.tsx` — restructure wizard: input → bmc (user fills) → recs (auto) → feedback → done. Update STEPS array, handlers, EvalForm dimensions.
- `src/routes/admin.tsx` — new route with table + stats.
- `src/routes/__root.tsx` or header — add "Admin" link.
- `src/lib/strategic.functions.ts` / `src/lib/pdf-report.ts` — accept the new artefact shape (BMC blocks + grouped recommendations).
- Evaluation `scores` keys change to: `uxExperience`, `easeOfUse`, `clarity`, `usefulness`, `recommendationValue`. No DB migration needed (jsonb).

No schema migration required — `submissions.artefact` is jsonb and accepts the new shape; `evaluations.scores` is jsonb.

## Out of scope
- Auth/roles on the admin page (still anonymous-session model). Can add later if needed.
- Editing/deleting submitted feedback from admin.
