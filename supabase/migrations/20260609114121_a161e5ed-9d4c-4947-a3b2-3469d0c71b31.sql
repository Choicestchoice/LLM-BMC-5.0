
DROP POLICY IF EXISTS "public can insert submissions" ON public.submissions;
DROP POLICY IF EXISTS "public can read submissions" ON public.submissions;
DROP POLICY IF EXISTS "public can insert evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "public can read evaluations" ON public.evaluations;

REVOKE ALL ON public.submissions FROM anon, authenticated;
REVOKE ALL ON public.evaluations FROM anon, authenticated;

GRANT ALL ON public.submissions TO service_role;
GRANT ALL ON public.evaluations TO service_role;
