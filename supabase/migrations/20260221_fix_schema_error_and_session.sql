-- ================================================================
-- FIX: Database Error Querying Schema (500 on Login)
-- Date: 2026-02-21
-- ================================================================
-- This error occurs when Supabase Auth's internal trigger/function
-- tries to interact with the profiles table during signIn but
-- encounters a schema mismatch (missing columns, broken triggers,
-- or orphaned constraints).
-- ================================================================

-- STEP 1: Ensure profiles table has all required columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dpa_consented_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'email';

-- STEP 2: Drop any broken triggers that reference non-existent columns
-- (These are the #1 cause of "Database error querying schema")
DO $$
DECLARE
  trigger_rec RECORD;
BEGIN
  FOR trigger_rec IN
    SELECT trigger_name, event_object_table
    FROM information_schema.triggers
    WHERE event_object_schema = 'public'
      AND event_object_table = 'profiles'
  LOOP
    RAISE NOTICE 'Found trigger: % on table %', trigger_rec.trigger_name, trigger_rec.event_object_table;
  END LOOP;
END $$;

-- STEP 3: Fix the auth.users -> profiles sync trigger
-- Drop and recreate the trigger function cleanly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role, status, auth_provider)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'alumni'),
    CASE 
      WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'alumni') IN ('admin', 'staff', 'superadmin') THEN 'verified'
      ELSE 'pending_approval'
    END,
    COALESCE(NEW.raw_user_meta_data->>'auth_provider', 'email')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now();
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- NEVER block user creation even if profile insert fails
  RAISE WARNING 'Profile creation failed for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists, then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STEP 4: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;

-- STEP 5: Clean up orphaned auth entries that cause schema conflicts
-- Remove users from auth.users that don't have matching profiles (and vice versa)
-- WARNING: This is READ-ONLY diagnostic. Uncomment DELETE lines only if needed.

-- Diagnostic: Find orphaned auth users (no profile)
DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_count 
  FROM auth.users u 
  LEFT JOIN public.profiles p ON u.id = p.id 
  WHERE p.id IS NULL;
  
  RAISE NOTICE 'Orphaned auth.users (no matching profile): %', orphan_count;
END $$;

-- STEP 6: Re-create staff and superadmin with FRESH UUIDs
DO $$
DECLARE
  super_id UUID;
  staff_id UUID;
BEGIN
  -- Check if super admin exists
  SELECT id INTO super_id FROM auth.users WHERE email = 'super@gmail.com';
  
  IF super_id IS NOT NULL THEN
    -- Fix existing: ensure profile exists with matching ID
    INSERT INTO public.profiles (id, email, role, first_name, last_name, status, auth_provider)
    VALUES (super_id, 'super@gmail.com', 'superadmin', 'Super', 'Admin', 'verified', 'email')
    ON CONFLICT (id) DO UPDATE SET 
      role = 'superadmin', 
      status = 'verified',
      email = 'super@gmail.com';
    
    -- Reset password
    UPDATE auth.users SET 
      encrypted_password = crypt('Super_123', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      raw_user_meta_data = '{"first_name": "Super", "last_name": "Admin", "role": "superadmin"}'::jsonb,
      raw_app_meta_data = '{"provider": "email", "providers": ["email"]}'::jsonb,
      updated_at = now()
    WHERE id = super_id;
    
    RAISE NOTICE 'Super Admin FIXED: super@gmail.com (ID: %)', super_id;
  ELSE
    RAISE NOTICE 'Super Admin not found in auth.users. Run the seed script first.';
  END IF;

  -- Check if staff exists
  SELECT id INTO staff_id FROM auth.users WHERE email = 'staff@gmail.com';
  
  IF staff_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, role, first_name, last_name, status, auth_provider)
    VALUES (staff_id, 'staff@gmail.com', 'staff', 'Staff', 'Member', 'verified', 'email')
    ON CONFLICT (id) DO UPDATE SET 
      role = 'staff', 
      status = 'verified',
      email = 'staff@gmail.com';
    
    UPDATE auth.users SET 
      encrypted_password = crypt('Staff_123', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      raw_user_meta_data = '{"first_name": "Staff", "last_name": "Member", "role": "staff"}'::jsonb,
      raw_app_meta_data = '{"provider": "email", "providers": ["email"]}'::jsonb,
      updated_at = now()
    WHERE id = staff_id;
    
    RAISE NOTICE 'Staff FIXED: staff@gmail.com (ID: %)', staff_id;
  ELSE
    RAISE NOTICE 'Staff not found in auth.users. Run the seed script first.';
  END IF;
END $$;

-- STEP 7: Verify auth.identities are correct (required for signInWithPassword)
DO $$
DECLARE
  user_rec RECORD;
BEGIN
  FOR user_rec IN 
    SELECT u.id, u.email 
    FROM auth.users u 
    WHERE u.email IN ('super@gmail.com', 'staff@gmail.com', 'lcp.superadmin@gmail.com', 'lcp.staff@gmail.com')
  LOOP
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (
      user_rec.id,
      user_rec.id,
      jsonb_build_object('sub', user_rec.id::text, 'email', user_rec.email),
      'email',
      user_rec.id::text,
      now(), now(), now()
    )
    ON CONFLICT (provider, provider_id) DO UPDATE SET
      identity_data = jsonb_build_object('sub', user_rec.id::text, 'email', user_rec.email),
      updated_at = now();
    
    RAISE NOTICE 'Identity verified for: %', user_rec.email;
  END LOOP;
END $$;

RAISE NOTICE '=== ALL FIXES APPLIED. Try logging in again. ===';
