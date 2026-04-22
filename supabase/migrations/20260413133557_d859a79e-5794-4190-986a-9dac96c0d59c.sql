
-- Allow activity owners to insert participants for their activities
CREATE POLICY "Activity owners can add participants"
  ON public.participants FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.uid() = user_id)
    OR
    (user_id IS NULL AND EXISTS (
      SELECT 1 FROM public.activities
      WHERE activities.id = participants.activity_id
        AND activities.user_id = auth.uid()
    ))
  );

-- Drop the old restrictive insert policy
DROP POLICY IF EXISTS "Users can add themselves as participants" ON public.participants;
