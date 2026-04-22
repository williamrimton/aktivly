
-- Drop the overly permissive SELECT policy
DROP POLICY "Authenticated users can view participants" ON participants;

-- Add a scoped policy: only the activity owner or the participant themselves can read rows
CREATE POLICY "Participants visible to owner and self"
  ON participants FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM activities
      WHERE activities.id = participants.activity_id
        AND activities.user_id = auth.uid()
    )
  );
