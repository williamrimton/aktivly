CREATE POLICY "Participants can update their own response"
ON public.participants
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);