-- Contact Form System Migration

-- 1. Create contacts table
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Anyone can insert (public contact form)
CREATE POLICY "Anyone can submit contact form"
ON public.contacts FOR INSERT
WITH CHECK (true);

-- Only admins can view contacts
CREATE POLICY "Admins can view all contacts"
ON public.contacts FOR SELECT
USING (public.is_admin());

-- 4. Create index for performance
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON public.contacts(created_at DESC);
