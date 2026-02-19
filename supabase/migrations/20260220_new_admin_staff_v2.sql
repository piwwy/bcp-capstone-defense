-- ================================================================
-- V2 UNIQUE ADMIN & STAFF CREDENTIALS
-- Date: 2026-02-20
-- ================================================================

DO $$
DECLARE
  super_id UUID := gen_random_uuid();
  staff_id UUID := gen_random_uuid();
BEGIN
  -- 1. CLEANUP OLD ATTEMPTS (Optional but recommended)
  DELETE FROM auth.users WHERE email IN ('lcp.superadmin@gmail.com', 'lcp.staff@gmail.com');
  
  -- 2. CREATE SUPER ADMIN (lcp.superadmin@gmail.com / LCP_Super_2026!)
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at, 
    raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud, created_at, updated_at
  )
  VALUES (
    super_id, '00000000-0000-0000-0000-000000000000', 
    'lcp.superadmin@gmail.com', crypt('LCP_Super_2026!', gen_salt('bf')), 
    now(), '{"provider": "email", "providers": ["email"]}', 
    '{"first_name": "LCP", "last_name": "SuperAdmin", "role": "superadmin"}', 
    false, 'authenticated', 'authenticated', now(), now()
  );

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (super_id, super_id, jsonb_build_object('sub', super_id::text, 'email', 'lcp.superadmin@gmail.com'), 'email', super_id::text, now(), now(), now());

  INSERT INTO public.profiles (id, email, role, first_name, last_name, status)
  VALUES (super_id, 'lcp.superadmin@gmail.com', 'superadmin', 'LCP', 'SuperAdmin', 'verified');

  -- 3. CREATE STAFF (lcp.staff@gmail.com / LCP_Staff_2026!)
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at, 
    raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud, created_at, updated_at
  )
  VALUES (
    staff_id, '00000000-0000-0000-0000-000000000000', 
    'lcp.staff@gmail.com', crypt('LCP_Staff_2026!', gen_salt('bf')), 
    now(), '{"provider": "email", "providers": ["email"]}', 
    '{"first_name": "LCP", "last_name": "Staff", "role": "staff"}', 
    false, 'authenticated', 'authenticated', now(), now()
  );

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (staff_id, staff_id, jsonb_build_object('sub', staff_id::text, 'email', 'lcp.staff@gmail.com'), 'email', staff_id::text, now(), now(), now());

  INSERT INTO public.profiles (id, email, role, first_name, last_name, status)
  VALUES (staff_id, 'lcp.staff@gmail.com', 'staff', 'LCP', 'Staff', 'verified');

  RAISE NOTICE 'New accounts created successfully.';
END $$;
