
-- Add recurring fields to activities
ALTER TABLE public.activities
  ADD COLUMN is_recurring boolean NOT NULL DEFAULT false,
  ADD COLUMN recurrence_type text,
  ADD COLUMN recurrence_end_date date;

-- Create activity_invitees table for default participant lists
CREATE TABLE public.activity_invitees (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_invitees ENABLE ROW LEVEL SECURITY;

-- Only activity owners can manage invitees
CREATE POLICY "Activity owners can view invitees"
  ON public.activity_invitees FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.activities
    WHERE activities.id = activity_invitees.activity_id
      AND activities.user_id = auth.uid()
  ));

CREATE POLICY "Activity owners can add invitees"
  ON public.activity_invitees FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.activities
    WHERE activities.id = activity_invitees.activity_id
      AND activities.user_id = auth.uid()
  ));

CREATE POLICY "Activity owners can update invitees"
  ON public.activity_invitees FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.activities
    WHERE activities.id = activity_invitees.activity_id
      AND activities.user_id = auth.uid()
  ));

CREATE POLICY "Activity owners can delete invitees"
  ON public.activity_invitees FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.activities
    WHERE activities.id = activity_invitees.activity_id
      AND activities.user_id = auth.uid()
  ));

CREATE INDEX idx_activity_invitees_activity_id ON public.activity_invitees(activity_id);
