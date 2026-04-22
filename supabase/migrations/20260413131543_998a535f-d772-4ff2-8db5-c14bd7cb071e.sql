
DROP POLICY "Authenticated users can add themselves as participants" ON public.participants;

CREATE POLICY "Users can add themselves as participants"
  ON public.participants FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
