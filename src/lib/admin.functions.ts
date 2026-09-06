import { createServerFn } from "@tanstack/react-start";

export type FeedbackRow = {
  id: string;
  createdAt: string;
  comment: string | null;
  scores: Record<string, number>;
  submission: {
    id: string;
    businessName: string;
    industry: string;
    size: string;
    region: string;
    description: string;
    createdAt: string;
  } | null;
};

export type FeedbackSummary = {
  totalSubmissions: number;
  totalFeedback: number;
  averages: Record<string, number>;
  rows: FeedbackRow[];
};

export const listFeedback = createServerFn({ method: "GET" }).handler(
  async (): Promise<FeedbackSummary> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: evals, error: e1 }, { data: subs, error: e2 }, { count: totalSubmissions }] =
      await Promise.all([
        supabaseAdmin
          .from("evaluations")
          .select("id, submission_id, scores, comment, created_at")
          .order("created_at", { ascending: false }),
        supabaseAdmin
          .from("submissions")
          .select(
            "id, business_name, industry, size, region, description, created_at",
          ),
        supabaseAdmin.from("submissions").select("*", { count: "exact", head: true }),
      ]);

    if (e1) throw new Error(e1.message);
    if (e2) throw new Error(e2.message);

    const subMap = new Map<string, FeedbackRow["submission"]>();
    for (const s of subs ?? []) {
      subMap.set(s.id as string, {
        id: s.id as string,
        businessName: s.business_name as string,
        industry: s.industry as string,
        size: s.size as string,
        region: s.region as string,
        description: s.description as string,
        createdAt: s.created_at as string,
      });
    }

    const rows: FeedbackRow[] = (evals ?? []).map((r) => ({
      id: r.id as string,
      createdAt: r.created_at as string,
      comment: (r.comment as string | null) ?? null,
      scores: (r.scores as Record<string, number>) ?? {},
      submission: subMap.get(r.submission_id as string) ?? null,
    }));

    // Averages across all numeric score keys present
    const sums: Record<string, { total: number; n: number }> = {};
    for (const r of rows) {
      for (const [k, v] of Object.entries(r.scores)) {
        if (typeof v !== "number") continue;
        sums[k] = sums[k] ?? { total: 0, n: 0 };
        sums[k].total += v;
        sums[k].n += 1;
      }
    }
    const averages: Record<string, number> = {};
    for (const [k, { total, n }] of Object.entries(sums)) {
      averages[k] = n > 0 ? Math.round((total / n) * 10) / 10 : 0;
    }

    return {
      totalSubmissions: totalSubmissions ?? 0,
      totalFeedback: rows.length,
      averages,
      rows,
    };
  },
);
