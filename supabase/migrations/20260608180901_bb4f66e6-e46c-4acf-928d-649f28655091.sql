
CREATE TABLE public.submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  business_name TEXT NOT NULL,
  industry TEXT NOT NULL,
  size TEXT NOT NULL,
  region TEXT NOT NULL,
  description TEXT NOT NULL,
  challenges TEXT,
  current_tech TEXT,
  artefact JSONB NOT NULL
);
CREATE INDEX idx_submissions_session ON public.submissions(session_id, created_at DESC);

CREATE TABLE public.evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scores JSONB NOT NULL,
  comment TEXT
);
CREATE INDEX idx_evaluations_submission ON public.evaluations(submission_id);

GRANT SELECT, INSERT ON public.submissions TO anon, authenticated;
GRANT ALL ON public.submissions TO service_role;
GRANT SELECT, INSERT ON public.evaluations TO anon, authenticated;
GRANT ALL ON public.evaluations TO service_role;

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

-- Demo app, no auth. Allow public insert/select; clients scope by session_id.
CREATE POLICY "public can insert submissions" ON public.submissions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public can read submissions" ON public.submissions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public can insert evaluations" ON public.evaluations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public can read evaluations" ON public.evaluations FOR SELECT TO anon, authenticated USING (true);
