CREATE POLICY "Anyone can view activities for booking"
ON public.activities
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Anyone can view participants for booking"
ON public.participants
FOR SELECT
TO anon
USING (true);