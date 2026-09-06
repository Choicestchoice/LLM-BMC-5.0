import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  FileText,
  Lightbulb,
  Gauge,
  Sparkles,
  Clock,
  Shield,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BMC Studio — AI-Powered Business Model Canvas & Strategy" },
      {
        name: "description",
        content:
          "Turn your business idea into a complete Business Model Canvas, Industry 5.0 recommendations, and a strategic report — in minutes, no sign-in required.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="font-display text-xl font-semibold tracking-tight">
            BMC<span className="text-primary">·</span>Studio
          </div>
          <Link
            to="/new"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Start a submission →
          </Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative mx-auto max-w-6xl px-6 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute top-1/2 -left-32 h-64 w-64 rounded-full bg-accent blur-3xl" />
          </div>

          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>

              <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-medium leading-[1.05] tracking-tight">
                Build a smarter{" "}
                <em className="italic text-primary">business model</em> with
                AI.
              </h1>

              <p className="mt-6 max-w-xl text-lg md:text-xl text-muted-foreground leading-relaxed">
                Enter your business idea and get a complete Business Model
                Canvas, tailored Industry 5.0 recommendations, and a strategic
                report — ready to share or download.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to="/new"
                  className="group inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-primary-foreground font-semibold shadow-lg shadow-primary/15 hover:opacity-90 transition-all"
                >
                  Start building
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  ~2 minutes · no sign-in
                </span>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <Badge icon={<CheckCircle2 className="h-3 w-3" />}>
                  9-block BMC
                </Badge>
                <Badge icon={<CheckCircle2 className="h-3 w-3" />}>
                  Industry 5.0 scored
                </Badge>
                <Badge icon={<CheckCircle2 className="h-3 w-3" />}>
                  PDF report
                </Badge>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <CanvasPreview />
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border/60 bg-secondary/30">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
            <div className="max-w-2xl mb-14">
              <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-3">
                What you get
              </p>
              <h2 className="font-display text-3xl md:text-4xl font-medium tracking-tight">
                Three outputs, one guided flow.
              </h2>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <Feature
                icon={<FileText className="h-5 w-5" />}
                title="Business Model Canvas"
                body="Populate all nine Osterwalder blocks with your own inputs, guided by smart suggestions and contextual examples."
              />
              <Feature
                icon={<Lightbulb className="h-5 w-5" />}
                title="AI recommendations"
                body="Get Industry 5.0, technology adoption, and strategic improvement recommendations based on your business context."
              />
              <Feature
                icon={<Gauge className="h-5 w-5" />}
                title="Industry 5.0 assessment"
                body="Every recommendation is scored against Human-Centricity, Sustainability, and Resilience pillars."
              />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-3">
              How it works
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-medium tracking-tight">
              From brief to boardroom-ready report.
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-4">
            <Step number="1" title="Describe your business">
              Share your idea, industry, and goals in a short guided form.
            </Step>
            <Step number="2" title="Complete your canvas">
              Fill the nine BMC blocks with help from AI suggestions.
            </Step>
            <Step number="3" title="Review recommendations">
              See tailored Industry 5.0 and technology recommendations.
            </Step>
            <Step number="4" title="Download your report">
              Export a professional PDF strategic report to share.
            </Step>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border/60 bg-primary text-primary-foreground">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-24 text-center">
            <h2 className="font-display text-3xl md:text-5xl font-medium tracking-tight mb-5">
              Ready to map your model?
            </h2>
            <p className="mx-auto max-w-xl text-primary-foreground/80 text-lg mb-9">
              No sign-up, no credit card. Just your business idea and a few
              minutes.
            </p>
            <Link
              to="/new"
              className="group inline-flex items-center gap-2 rounded-full bg-background px-8 py-4 text-foreground font-semibold hover:bg-background/90 transition-colors"
            >
              Start your submission
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-center px-6 py-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            No RAG, no external data, no multi-agent workflows.
          </span>
        </div>
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-7 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-5">
        {icon}
      </div>
      <h3 className="font-display text-xl font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}

function Step({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-display font-semibold text-lg">
        {number}
      </div>
      <h3 className="font-display text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {children}
      </p>
    </div>
  );
}

function Badge({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1">
      {icon}
      {children}
    </span>
  );
}

function CanvasPreview() {
  const blocks = [
    { label: "Key Partners", hint: "Suppliers, alliances..." },
    { label: "Key Activities", hint: "Core operations..." },
    { label: "Value Propositions", hint: "What you offer...", highlight: true },
    { label: "Customer Relationships", hint: "Support & retention..." },
    { label: "Customer Segments", hint: "Target users..." },
    { label: "Key Resources", hint: "Assets & IP..." },
    { label: "Channels", hint: "Distribution..." },
    { label: "Cost Structure", hint: "Fixed & variable..." },
    { label: "Revenue Streams", hint: "Pricing & streams..." },
  ];

  return (
    <div className="relative">
      <div className="absolute inset-0 rotate-3 rounded-3xl bg-primary/10" />
      <div className="relative rounded-3xl border border-border bg-card p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="font-display text-sm font-semibold">
            Business Model Canvas
          </div>
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {blocks.map(({ label, hint, highlight }) => (
            <div
              key={label}
              className={`rounded-lg p-3 text-[10px] leading-snug min-h-[72px] flex flex-col justify-center ${
                highlight
                  ? "bg-primary/10 text-primary text-center font-medium"
                  : "bg-secondary/60 text-muted-foreground"
              }`}
            >
              <span
                className={`block mb-1 ${
                  highlight ? "font-display text-sm" : "font-semibold text-foreground"
                }`}
              >
                {label}
              </span>
              {!highlight && <span className="opacity-70">{hint}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
