-- Allow Admins to INSERT/UPSERT into alumni_profiles for other users
-- This is required for the "Career Tracking" edit functionality where admins fill in missing info for alumni

DROP POLICY IF EXISTS "alumni_profiles_insert" ON public.alumni_profiles;

CREATE POLICY "alumni_profiles_insert" ON public.alumni_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    id = (SELECT auth.uid()) OR
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

-- Ensure update policy is also correct (already seems fine but reinforcing)
DROP POLICY IF EXISTS "alumni_profiles_update" ON public.alumni_profiles;

CREATE POLICY "alumni_profiles_update" ON public.alumni_profiles
  FOR UPDATE TO authenticated
  USING (
    id = (SELECT auth.uid()) OR
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff')
  )
  WITH CHECK (
    id = (SELECT auth.uid()) OR
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

-- Ensure delete policy allows admins too
DROP POLICY IF EXISTS "alumni_profiles_delete" ON public.alumni_profiles;

CREATE POLICY "alumni_profiles_delete" ON public.alumni_profiles
  FOR DELETE TO authenticated
  USING (
    id = (SELECT auth.uid()) OR
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff')
  );
