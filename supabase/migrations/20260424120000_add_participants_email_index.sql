-- Index to speed up email-based participant lookups (used on dashboard load)
CREATE INDEX IF NOT EXISTS idx_participants_email ON public.participants (LOWER(email));
