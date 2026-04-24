-- SECURITY DEFINER bypasses RLS on its own query, breaking the recursion
CREATE OR REPLACE FUNCTION public.user_participates_in_activity(p_activity_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.participants
    WHERE activity_id = p_activity_id
      AND user_id = auth.uid()
  );
$$;

-- Drop the recursive policy and replace it with one that uses the helper function
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
    OR public.user_participates_in_activity(participants.activity_id)
    OR (
      user_id IS NULL
      AND email IS NOT NULL
      AND LOWER(email) = LOWER(auth.email())
    )
  );
