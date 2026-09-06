import { useState } from "react";
import {
  INDUSTRY5_LABELS,
  type Industry5Principle,
  type Recommendations,
} from "@/lib/artefact";
import { User, Leaf, Shield, Cpu, Compass } from "lucide-react";

const PRINCIPLE_ICON: Record<Industry5Principle, typeof User> = {
  humanCentricity: User,
  sustainability: Leaf,
  resilience: Shield,
};

const TABS = [
  { id: "industry5", label: "Industry 5.0 alignment", icon: Leaf },
  { id: "technology", label: "Technology adoption", icon: Cpu },
  { id: "strategic", label: "Strategic improvements", icon: Compass },
] as const;
type TabId = (typeof TABS)[number]["id"];

export function RecommendationsView({ recs }: { recs: Recommendations }) {
  const [tab, setTab] = useState<TabId>("industry5");

  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b border-border mb-6">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          const count =
            t.id === "industry5"
              ? recs.industry5.length
              : t.id === "technology"
                ? recs.technology.length
                : recs.strategic.length;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-3 py-2 text-sm border-b-2 -mb-px transition-colors ${
                active
                  ? "border-primary text-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
              <span className="text-[10px] tabular-nums rounded-full bg-muted px-1.5 py-0.5">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {tab === "industry5" && <Industry5List items={recs.industry5} />}
      {tab === "technology" && <TechList items={recs.technology} />}
      {tab === "strategic" && <StrategicList items={recs.strategic} />}
    </div>
  );
}

function Industry5List({ items }: { items: Recommendations["industry5"] }) {
  return (
    <div className="space-y-4">
      {items.map((r, i) => {
        const Icon = PRINCIPLE_ICON[r.principle];
        return (
          <article key={i} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {INDUSTRY5_LABELS[r.principle]}
              </span>
            </div>
            <h3 className="font-display text-lg font-semibold mb-1">{r.title}</h3>
            <p className="text-sm text-foreground/90 leading-relaxed">{r.rationale}</p>
          </article>
        );
      })}
    </div>
  );
}

function TechList({ items }: { items: Recommendations["technology"] }) {
  return (
    <div className="space-y-4">
      {items.map((r, i) => (
        <article key={i} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-baseline gap-3 mb-2">
            <span className="font-display text-xl text-primary/40 tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="font-display text-lg font-semibold">{r.title}</h3>
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed mb-2">
            <span className="font-medium text-foreground/70">Why it fits.</span>{" "}
            {r.whyItFits}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground/70">Expected impact.</span>{" "}
            {r.expectedImpact}
          </p>
        </article>
      ))}
    </div>
  );
}

function StrategicList({ items }: { items: Recommendations["strategic"] }) {
  return (
    <div className="space-y-4">
      {items.map((r, i) => (
        <article key={i} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-baseline justify-between gap-3 mb-2">
            <h3 className="font-display text-lg font-semibold">{r.title}</h3>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground rounded-full bg-muted px-2 py-0.5">
              {r.relatedBlock}
            </span>
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed mb-2">{r.suggestion}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground/70">Impact.</span> {r.impact}
          </p>
        </article>
      ))}
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold tabular-nums">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`h-1.5 w-1.5 rounded-full ${n <= score ? "bg-primary" : "bg-border"}`}
        />
      ))}
      <span className="ml-1 text-foreground/80">{score}/5</span>
    </span>
  );
}
