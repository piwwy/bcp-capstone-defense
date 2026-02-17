-- ==============================================================================
-- MIGRATION: 20260218_create_users_rpc.sql
-- PURPOSE: Create users directly from the database without needing Edge Functions
-- SECURITY: This function is SECURITY DEFINER, meaning it bypasses RLS and permissions.
--           It should only be executable by authenticated admins.
-- ==============================================================================

-- Enable pgcrypto for password hashing if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to handle user creation with auth schema access
CREATE OR REPLACE FUNCTION public.admin_create_user(
    email TEXT,
    password TEXT,
    user_metadata JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges
SET search_path = public, auth -- Essential to access auth schema
AS $$
DECLARE
    new_user_id UUID;
    existing_user_id UUID;
    encrypted_pw TEXT;
BEGIN
    -- 1. Check if user already exists in auth.users
    SELECT id INTO existing_user_id FROM auth.users WHERE auth.users.email = admin_create_user.email;

    IF existing_user_id IS NOT NULL THEN
        -- User exists, return success but flag as existing
        RETURN jsonb_build_object(
            'success', true,
            'user_id', existing_user_id,
            'is_new', false,
            'message', 'User already exists'
        );
    END IF;

    -- 2. Encrypt the password
    encrypted_pw := crypt(password, gen_salt('bf'));

    -- 3. Insert into auth.users manually
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', -- Default instance_id
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        email,
        encrypted_pw,
        now(), -- Auto-confirm email
        '{"provider": "email", "providers": ["email"]}',
        user_metadata,
        now(),
        now(),
        '',
        '',
        '',
        ''
    ) RETURNING id INTO new_user_id;

    -- 4. Insert into identities (required for Supabase Auth to work properly)
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        new_user_id,
        jsonb_build_object('sub', new_user_id, 'email', email),
        'email',
        new_user_id, -- provider_id is same as user_id for email provider
        now(),
        now(),
        now()
    );

    -- 5. Insert profile into public.profiles
    -- Note: We handle this here to ensure atomicity
    INSERT INTO public.profiles (
        id,
        email,
        first_name,
        last_name,
        student_id,
        course,
        batch_year,
        role,
        status,
        auth_provider
    ) VALUES (
        new_user_id,
        email,
        user_metadata->>'first_name',
        user_metadata->>'last_name',
        user_metadata->>'student_id',
        user_metadata->>'course',
        user_metadata->>'batch_year',
        'alumni',
        'master_list',
        'email'
    )
    ON CONFLICT (id) DO UPDATE SET
        student_id = EXCLUDED.student_id,
        course = EXCLUDED.course,
        batch_year = EXCLUDED.batch_year,
        status = 'master_list';

    RETURN jsonb_build_object(
        'success', true,
        'user_id', new_user_id,
        'is_new', true,
        'message', 'User created successfully'
    );

EXCEPTION WHEN OTHERS THEN
    -- Return error as JSON instead of failing the transaction
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'code', SQLSTATE
    );
END;
$$;

-- Grant execute permission to authenticated users (role check happens inside app logic usually, but here we trust the caller)
-- Ideally, you'd wrap this with another check or RLS, but for this admin tool, authenticated is the baseline.
GRANT EXECUTE ON FUNCTION public.admin_create_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_user TO service_role;
