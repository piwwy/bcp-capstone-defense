-- ================================================================
-- ROBUST SEED: Staff and Super Admin Users
-- Date: 2026-02-18
-- Passwords: Staff_123, Super_123
-- Optimized: Uses dynamic UUIDs to avoid primary key conflicts
-- FIX: Includes auth.identities upsert (required for signInWithPassword)
-- ================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SEED SUPER ADMIN
-- Account: super@gmail.com / Super_123
DO $$
DECLARE
  target_id UUID;
BEGIN
  -- Get existing ID if any
  SELECT id INTO target_id FROM auth.users WHERE email = 'super@gmail.com';

  IF target_id IS NOT NULL THEN
    -- Update existing user password and metadata
    UPDATE auth.users SET 
      encrypted_password = crypt('Super_123', gen_salt('bf')),
      raw_user_meta_data = '{"first_name": "Super", "last_name": "Admin", "role": "superadmin"}',
      updated_at = now(),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      raw_app_meta_data = '{"provider": "email", "providers": ["email"]}'
    WHERE id = target_id;
  ELSE
    -- Create new user
    target_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at, 
      raw_app_meta_data, raw_user_meta_data, is_super_admin, role, 
      aud, created_at, updated_at
    )
    VALUES (
      target_id, 
      '00000000-0000-0000-0000-000000000000', 
      'super@gmail.com', 
      crypt('Super_123', gen_salt('bf')), 
      now(), 
      '{"provider": "email", "providers": ["email"]}', 
      '{"first_name": "Super", "last_name": "Admin", "role": "superadmin"}', 
      false, 
      'authenticated', 
      'authenticated', 
      now(), now()
    );
  END IF;

  -- CRITICAL: Ensure auth.identities row exists (required for signInWithPassword)
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  VALUES (
    target_id,           -- id = user_id for email provider
    target_id,
    jsonb_build_object('sub', target_id::text, 'email', 'super@gmail.com'),
    'email',
    target_id::text,     -- provider_id = user_id for email provider
    now(),
    now(),
    now()
  )
  ON CONFLICT (provider, provider_id) DO UPDATE SET
    identity_data = jsonb_build_object('sub', target_id::text, 'email', 'super@gmail.com'),
    updated_at = now();

  -- Ensure profile exists and has correct role
  INSERT INTO public.profiles (id, email, role, first_name, last_name, status)
  VALUES (target_id, 'super@gmail.com', 'superadmin', 'Super', 'Admin', 'verified')
  ON CONFLICT (id) DO UPDATE SET 
    role = 'superadmin', 
    status = 'verified',
    first_name = 'Super',
    last_name = 'Admin';
    
  RAISE NOTICE 'Super Admin seeded successfully: super@gmail.com / Super_123';
END $$;

-- 2. SEED STAFF
-- Account: staff@gmail.com / Staff_123
DO $$
DECLARE
  target_id UUID;
BEGIN
  -- Get existing ID if any
  SELECT id INTO target_id FROM auth.users WHERE email = 'staff@gmail.com';

  IF target_id IS NOT NULL THEN
    -- Update existing user
    UPDATE auth.users SET 
      encrypted_password = crypt('Staff_123', gen_salt('bf')),
      raw_user_meta_data = '{"first_name": "Staff", "last_name": "Member", "role": "staff"}',
      updated_at = now(),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      raw_app_meta_data = '{"provider": "email", "providers": ["email"]}'
    WHERE id = target_id;
  ELSE
    -- Create new user
    target_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at, 
      raw_app_meta_data, raw_user_meta_data, is_super_admin, role, 
      aud, created_at, updated_at
    )
    VALUES (
      target_id, 
      '00000000-0000-0000-0000-000000000000', 
      'staff@gmail.com', 
      crypt('Staff_123', gen_salt('bf')), 
      now(), 
      '{"provider": "email", "providers": ["email"]}', 
      '{"first_name": "Staff", "last_name": "Member", "role": "staff"}', 
      false, 
      'authenticated', 
      'authenticated', 
      now(), now()
    );
  END IF;

  -- CRITICAL: Ensure auth.identities row exists (required for signInWithPassword)
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  VALUES (
    target_id,
    target_id,
    jsonb_build_object('sub', target_id::text, 'email', 'staff@gmail.com'),
    'email',
    target_id::text,
    now(),
    now(),
    now()
  )
  ON CONFLICT (provider, provider_id) DO UPDATE SET
    identity_data = jsonb_build_object('sub', target_id::text, 'email', 'staff@gmail.com'),
    updated_at = now();

  -- Ensure profile exists
  INSERT INTO public.profiles (id, email, role, first_name, last_name, status)
  VALUES (target_id, 'staff@gmail.com', 'staff', 'Staff', 'Member', 'verified')
  ON CONFLICT (id) DO UPDATE SET 
    role = 'staff', 
    status = 'verified',
    first_name = 'Staff',
    last_name = 'Member';

  RAISE NOTICE 'Staff user seeded successfully: staff@gmail.com / Staff_123';
END $$;
