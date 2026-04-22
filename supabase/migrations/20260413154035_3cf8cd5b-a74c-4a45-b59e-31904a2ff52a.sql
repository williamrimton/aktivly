
-- Add parent_activity_id to link generated events to recurring parent
ALTER TABLE public.activities 
ADD COLUMN parent_activity_id uuid REFERENCES public.activities(id) ON DELETE CASCADE;

-- Index for fast lookups
CREATE INDEX idx_activities_parent ON public.activities(parent_activity_id) WHERE parent_activity_id IS NOT NULL;
