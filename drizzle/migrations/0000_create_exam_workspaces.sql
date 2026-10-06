CREATE TABLE public.exam_workspaces (user_id uuid PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}'::jsonb, updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_workspaces TO authenticated;
GRANT ALL ON public.exam_workspaces TO service_role;
ALTER TABLE public.exam_workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read workspace" ON public.exam_workspaces FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Owners create workspace" ON public.exam_workspaces FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owners update workspace" ON public.exam_workspaces FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owners delete workspace" ON public.exam_workspaces FOR DELETE TO authenticated USING (user_id = auth.uid());