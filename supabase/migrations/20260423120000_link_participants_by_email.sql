-- Backfill existing null user_id records where email matches a profile
UPDATE participants p
SET user_id = pr.user_id
FROM profiles pr
WHERE p.user_id IS NULL
  AND p.email IS NOT NULL
  AND LOWER(p.email) = LOWER(pr.email);

-- Update SELECT policy to also let users see their own email-only participant record
DROP POLICY IF EXISTS "Participants visible to owner and fellow participants" ON public.participants;
CREATE POLICY "Participants visible to owner and fellow participants"
  ON public.participants FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM activities
      WHERE activities.id = participants.activity_id
        AND activities.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM participants AS p2
      WHERE p2.activity_id = participants.activity_id
        AND p2.user_id = auth.uid()
    )
    OR (
      user_id IS NULL
      AND email IS NOT NULL
      AND LOWER(email) = LOWER(auth.email())
    )
  );

-- Allow users to claim their participant record by matching email
DROP POLICY IF EXISTS "Users can claim participant record by email" ON public.participants;
CREATE POLICY "Users can claim participant record by email"
  ON public.participants FOR UPDATE TO authenticated
  USING (
    user_id IS NULL
    AND email IS NOT NULL
    AND LOWER(email) = LOWER(auth.email())
  )
  WITH CHECK (user_id = auth.uid());
