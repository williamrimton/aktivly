
-- Create activities table
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  location TEXT,
  max_participants INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create participants table
CREATE TABLE public.participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('confirmed', 'pending', 'declined', 'waitlist')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

-- Activities policies
CREATE POLICY "Authenticated users can view all activities"
  ON public.activities FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create their own activities"
  ON public.activities FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities"
  ON public.activities FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities"
  ON public.activities FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Participants policies
CREATE POLICY "Authenticated users can view participants"
  ON public.participants FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can add themselves as participants"
  ON public.participants FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Activity owners can update participants"
  ON public.participants FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.activities WHERE id = activity_id AND user_id = auth.uid()));

CREATE POLICY "Activity owners can delete participants"
  ON public.participants FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.activities WHERE id = activity_id AND user_id = auth.uid()));

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_participants_updated_at
  BEFORE UPDATE ON public.participants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_activities_user_id ON public.activities(user_id);
CREATE INDEX idx_activities_date ON public.activities(date);
CREATE INDEX idx_participants_activity_id ON public.participants(activity_id);
CREATE INDEX idx_participants_user_id ON public.participants(user_id);
