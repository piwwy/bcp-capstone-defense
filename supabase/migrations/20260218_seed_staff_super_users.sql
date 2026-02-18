-- ================================================================
-- FIXED SEED: Staff and Super Admin Users
-- Date: 2026-02-18
-- Passwords: Staff_123, Super_123
-- Optimized: Using WHERE NOT EXISTS instead of ON CONFLICT to avoid RLS/Constraint issues
-- ================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SEED SUPER ADMIN
-- Account: super@gmail.com / Super_123
DO $$
DECLARE
  super_uid UUID := uuid_generate_v4();
BEGIN
  -- Insert into auth.users only if email doesn't exist
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'super@gmail.com') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at, 
      raw_app_meta_data, raw_user_meta_data, is_super_admin, role, 
      aud, confirmation_token, recovery_token, email_change_token_new, 
      last_sign_in_at, created_at, updated_at, confirmation_sent_at
    )
    VALUES (
      super_uid, 
      '00000000-0000-0000-0000-000000000000', 
      'super@gmail.com', 
      crypt('Super_123', gen_salt('bf')), 
      now(), 
      '{"provider": "email", "providers": ["email"]}', 
      '{"name": "Super Admin"}', 
      false, 
      'authenticated', 
      'authenticated', 
      '', '', '', 
      now(), now(), now(), now()
    );
  END IF;

  -- Insert/Update public.profiles
  -- We select by email to ensure we map to the correct auth user
  INSERT INTO public.profiles (id, email, role, first_name, last_name, status)
  SELECT id, email, 'superadmin', 'Super', 'Admin', 'verified'
  FROM auth.users WHERE email = 'super@gmail.com'
  ON CONFLICT (email) DO UPDATE SET role = 'superadmin', status = 'verified';
END $$;

-- 2. SEED STAFF
-- Account: staff@gmail.com / Staff_123
DO $$
DECLARE
  staff_uid UUID := uuid_generate_v4();
BEGIN
  -- Insert into auth.users only if email doesn't exist
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'staff@gmail.com') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at, 
      raw_app_meta_data, raw_user_meta_data, is_super_admin, role, 
      aud, confirmation_token, recovery_token, email_change_token_new, 
      last_sign_in_at, created_at, updated_at, confirmation_sent_at
    )
    VALUES (
      staff_uid, 
      '00000000-0000-0000-0000-000000000000', 
      'staff@gmail.com', 
      crypt('Staff_123', gen_salt('bf')), 
      now(), 
      '{"provider": "email", "providers": ["email"]}', 
      '{"name": "Staff Member"}', 
      false, 
      'authenticated', 
      'authenticated', 
      '', '', '', 
      now(), now(), now(), now()
    );
  END IF;

  -- Insert/Update public.profiles
  INSERT INTO public.profiles (id, email, role, first_name, last_name, status)
  SELECT id, email, 'staff', 'Staff', 'Member', 'verified'
  FROM auth.users WHERE email = 'staff@gmail.com'
  ON CONFLICT (email) DO UPDATE SET role = 'staff', status = 'verified';
END $$;
