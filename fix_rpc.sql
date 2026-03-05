
-- 1. Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- 2. Enhanced admin_create_user function
CREATE OR REPLACE FUNCTION public.admin_create_user(
    email TEXT,
    password TEXT,
    user_metadata JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    new_user_id UUID;
    existing_user_id UUID;
    encrypted_pw TEXT;
BEGIN
    -- 1. Check if user already exists in auth.users
    SELECT id INTO existing_user_id FROM auth.users WHERE auth.users.email = admin_create_user.email;

    IF existing_user_id IS NOT NULL THEN
        -- User exists, check if profile exists
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = existing_user_id) THEN
            -- Create profile if missing
            INSERT INTO public.profiles (
                id, email, first_name, last_name, student_id, course, batch_year, role, status, auth_provider
            ) VALUES (
                existing_user_id, email, 
                user_metadata->>'first_name', user_metadata->>'last_name', 
                user_metadata->>'student_id', user_metadata->>'course', 
                user_metadata->>'batch_year', 'alumni', 'verified', 'email'
            );
        ELSE
            -- Update profile to verified
            UPDATE public.profiles 
            SET status = 'verified', 
                subscription_type = user_metadata->>'subscription_type',
                subscription_status = 'ACTIVE'
            WHERE id = existing_user_id;
        END IF;

        RETURN jsonb_build_object(
            'success', true,
            'user_id', existing_user_id,
            'is_new', false,
            'message', 'User already exists, profile updated'
        );
    END IF;

    -- 2. Encrypt the password using extensions prefix for safety
    encrypted_pw := extensions.crypt(password, extensions.gen_salt('bf'));

    -- 3. Insert into auth.users manually
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 
        email, encrypted_pw, now(), 
        '{"provider": "email", "providers": ["email"]}', user_metadata, now(), now(),
        '', '', '', ''
    ) RETURNING id INTO new_user_id;

    -- 4. Insert into identities
    INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), new_user_id, jsonb_build_object('sub', new_user_id, 'email', email),
        'email', new_user_id, now(), now(), now()
    );

    -- 5. Insert profile
    INSERT INTO public.profiles (
        id, email, first_name, last_name, student_id, course, batch_year, role, status, auth_provider
    ) VALUES (
        new_user_id, email, 
        user_metadata->>'first_name', user_metadata->>'last_name', 
        user_metadata->>'student_id', user_metadata->>'course', 
        user_metadata->>'batch_year', 'alumni', 'verified', 'email'
    );

    RETURN jsonb_build_object(
        'success', true,
        'user_id', new_user_id,
        'is_new', true,
        'message', 'User created successfully'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'detail', SQLSTATE
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.admin_create_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_user TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_create_user TO anon; -- Allow anon for registration if needed, but here we expect admin
