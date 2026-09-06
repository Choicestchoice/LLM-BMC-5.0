import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listFeedback, type FeedbackRow } from "@/lib/admin.functions";
import { EVAL_DIMS } from "@/lib/artefact";
import { buildFeedbackCsv } from "@/lib/csv";
import { Loader2, ChevronDown, ChevronRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Feedback analytics" },
      { name: "description", content: "Aggregated feedback and submissions analytics for BMC Studio." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const fetchFeedback = useServerFn(listFeedback);
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-feedback"],
    queryFn: () => fetchFeedback(),
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="font-display text-xl font-semibold tracking-tight">
            BMC<span className="text-primary">·</span>Studio
          </Link>
          <nav className="flex items-center gap-5 text-sm text-muted-foreground">
            <Link to="/new" className="hover:text-foreground">
              New submission
            </Link>
            <Link to="/" className="hover:text-foreground">
              ← Home
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-baseline justify-between mb-2 gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
              Admin dashboard
            </p>
            <h1 className="font-display text-4xl font-medium">Feedback analytics</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => data && exportFeedbackCsv(data.rows)}
              disabled={!data || data.rows.length === 0}
            >
              <Download className="h-4 w-4 mr-1" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              {isFetching && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Refresh
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground mb-8">
          Aggregated feedback from all users of the platform.
        </p>

        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground py-16">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading…
          </div>
        )}
        {isError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error instanceof Error ? error.message : "Failed to load feedback"}
          </div>
        )}

        {data && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
              <StatCard label="Total submissions" value={data.totalSubmissions} />
              <StatCard label="Total feedback" value={data.totalFeedback} />
              <StatCard
                label="Avg overall UX"
                value={fmt(data.averages.uxExperience)}
              />
              <StatCard
                label="Avg recommendation value"
                value={fmt(data.averages.recommendationValue)}
              />
            </div>

            <section className="mb-10">
              <h2 className="font-display text-2xl font-medium mb-4">
                Average rating per dimension
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {EVAL_DIMS.map((d) => (
                  <div
                    key={d.key}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <div className="text-xs text-muted-foreground mb-1">{d.label}</div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-3xl font-medium">
                        {fmt(data.averages[d.key])}
                      </span>
                      <span className="text-sm text-muted-foreground">/ 5</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="font-display text-2xl font-medium mb-4">
                All feedback ({data.rows.length})
              </h2>
              {data.rows.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground text-sm">
                  No feedback collected yet.
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="hidden md:grid grid-cols-[1.4fr_1fr_repeat(5,minmax(0,80px))_1fr_28px] gap-3 px-4 py-3 border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    <div>Business</div>
                    <div>Industry</div>
                    {EVAL_DIMS.map((d) => (
                      <div key={d.key} className="text-center" title={d.label}>
                        {shortLabel(d.key)}
                      </div>
                    ))}
                    <div>Date</div>
                    <div />
                  </div>
                  <ul className="divide-y divide-border">
                    {data.rows.map((row) => (
                      <FeedbackRowItem key={row.id} row={row} />
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function exportFeedbackCsv(rows: FeedbackRow[]) {
  const csv = buildFeedbackCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `feedback-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


function fmt(v: number | undefined) {
  if (v === undefined || v === null || Number.isNaN(v)) return "—";
  return v.toFixed(1);
}

function shortLabel(k: string) {
  return (
    {
      uxExperience: "UX",
      easeOfUse: "Ease",
      clarity: "Clarity",
      usefulness: "Useful",
      recommendationValue: "Rec Val",
    } as Record<string, string>
  )[k] ?? k;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="font-display text-3xl font-medium">{value}</div>
    </div>
  );
}

function FeedbackRowItem({ row }: { row: FeedbackRow }) {
  const [open, setOpen] = useState(false);
  const sub = row.submission;
  const date = new Date(row.createdAt).toLocaleDateString();
  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors grid grid-cols-[1.4fr_1fr_repeat(5,minmax(0,80px))_1fr_28px] gap-3 items-center"
      >
        <div className="min-w-0">
          <div className="font-medium truncate">{sub?.businessName ?? "—"}</div>
          <div className="text-xs text-muted-foreground truncate">
            {sub?.size ?? ""} {sub?.region ? `· ${sub.region}` : ""}
          </div>
        </div>
        <div className="text-sm text-muted-foreground truncate">{sub?.industry ?? "—"}</div>
        {EVAL_DIMS.map((d) => (
          <div key={d.key} className="text-center text-sm tabular-nums">
            {row.scores[d.key] ?? "—"}
          </div>
        ))}
        <div className="text-xs text-muted-foreground">{date}</div>
        <div className="text-muted-foreground">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-5 pt-1 bg-muted/20 space-y-4">
          {sub && (
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                Business brief
              </div>
              <p className="text-sm whitespace-pre-wrap text-foreground/90">
                {sub.description}
              </p>
            </div>
          )}

          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Scores
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {EVAL_DIMS.map((d) => (
                <div key={d.key} className="rounded-md border border-border bg-background p-2">
                  <div className="text-[10px] text-muted-foreground">{d.label}</div>
                  <div className="text-lg font-medium tabular-nums">
                    {row.scores[d.key] ?? "—"}
                    <span className="text-xs text-muted-foreground"> / 5</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
              Comment
            </div>
            <p className="text-sm text-foreground/90 whitespace-pre-wrap">
              {row.comment?.trim() ? row.comment : <span className="text-muted-foreground italic">No comment.</span>}
            </p>
          </div>
        </div>
      )}
    </li>
  );
}
