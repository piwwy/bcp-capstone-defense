-- ============================================================
-- Create contact_inquiries table for landing page submissions
-- Supports general and company/employer inquiries
-- ============================================================

CREATE TABLE IF NOT EXISTS public.contact_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_type text NOT NULL CHECK (inquiry_type IN ('general', 'company')),

  -- General inquiry fields
  name text,
  email text,
  message text,

  -- Company inquiry fields
  company_name text,
  contact_person text,
  company_email text,
  company_phone text,
  position_offered text,
  company_message text,

  -- Admin workflow
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'archived')),
  routed_to_osa boolean NOT NULL DEFAULT false,
  routed_to_hr boolean NOT NULL DEFAULT false,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_inquiries_created_at ON public.contact_inquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_type_status ON public.contact_inquiries (inquiry_type, status);

CREATE OR REPLACE FUNCTION public.set_contact_inquiries_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_contact_inquiries_updated_at ON public.contact_inquiries;
CREATE TRIGGER trg_contact_inquiries_updated_at
BEFORE UPDATE ON public.contact_inquiries
FOR EACH ROW
EXECUTE FUNCTION public.set_contact_inquiries_updated_at();

ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contact_inquiries_anon_insert" ON public.contact_inquiries;
CREATE POLICY "contact_inquiries_anon_insert"
ON public.contact_inquiries
FOR INSERT
TO anon
WITH CHECK (
  (inquiry_type = 'general' AND name IS NOT NULL AND email IS NOT NULL AND message IS NOT NULL)
  OR
  (inquiry_type = 'company' AND company_name IS NOT NULL AND contact_person IS NOT NULL AND company_email IS NOT NULL AND position_offered IS NOT NULL)
);

DROP POLICY IF EXISTS "contact_inquiries_auth_insert" ON public.contact_inquiries;
CREATE POLICY "contact_inquiries_auth_insert"
ON public.contact_inquiries
FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "contact_inquiries_admin_select" ON public.contact_inquiries;
CREATE POLICY "contact_inquiries_admin_select"
ON public.contact_inquiries
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'superadmin', 'super_admin')
);

DROP POLICY IF EXISTS "contact_inquiries_admin_update" ON public.contact_inquiries;
CREATE POLICY "contact_inquiries_admin_update"
ON public.contact_inquiries
FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'superadmin', 'super_admin')
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'superadmin', 'super_admin')
);

GRANT SELECT, INSERT, UPDATE ON public.contact_inquiries TO authenticated;
GRANT INSERT ON public.contact_inquiries TO anon;
