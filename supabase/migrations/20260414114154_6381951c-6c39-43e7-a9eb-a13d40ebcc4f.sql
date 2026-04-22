
DROP POLICY "Activity owners can add participants" ON public.participants;

CREATE POLICY "Activity owners can add participants"
ON public.participants
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = user_id)
  OR
  (EXISTS (
    SELECT 1 FROM activities
    WHERE activities.id = participants.activity_id
    AND activities.user_id = auth.uid()
  ))
);
