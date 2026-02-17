-- =====================================================
-- DEMO ACCOUNTS FOR BCP ALUMNI SYSTEM
-- =====================================================
-- Run this in Supabase SQL Editor
-- NOTE: You must create these users in Supabase Auth first, then run this script
-- Or use the Supabase Dashboard to create auth users with these emails

-- =====================================================
-- STEP 1: Create Auth Users (Do this in Supabase Dashboard > Authentication > Users)
-- =====================================================
-- Click "Add User" for each:
-- 1. alumni.demo@lcp.edu.ph (password: Demo2026!)
-- 2. admin.demo@lcp.edu.ph (password: Demo2026!)
-- 3. superadmin.demo@lcp.edu.ph (password: Demo2026!)
-- 4. staff.demo@lcp.edu.ph (password: Demo2026!)

-- =====================================================
-- STEP 2: Update Profiles (Run this SQL after creating auth users)
-- =====================================================

-- Alumni Demo Account
UPDATE profiles 
SET 
  role = 'alumni',
  status = 'verified',
  first_name = 'Juan',
  last_name = 'Dela Cruz',
  email = 'alumni.demo@lcp.edu.ph',
  course = 'Bachelor of Science in Information Technology',
  batch_year = 2020,
  employment_status = 'employed',
  current_company = 'Tech Solutions Inc.',
  job_title = 'Software Developer',
  auth_provider = 'email'
WHERE email = 'alumni.demo@lcp.edu.ph';

-- Admin Demo Account
UPDATE profiles 
SET 
  role = 'admin',
  status = 'verified',
  first_name = 'Maria',
  last_name = 'Santos',
  email = 'admin.demo@lcp.edu.ph',
  auth_provider = 'email'
WHERE email = 'admin.demo@lcp.edu.ph';

-- Super Admin Demo Account
UPDATE profiles 
SET 
  role = 'superadmin',
  status = 'verified',
  first_name = 'Pedro',
  last_name = 'Reyes',
  email = 'superadmin.demo@lcp.edu.ph',
  auth_provider = 'email'
WHERE email = 'superadmin.demo@lcp.edu.ph';

-- Staff Demo Account
UPDATE profiles 
SET 
  role = 'staff',
  status = 'verified',
  first_name = 'Ana',
  last_name = 'Garcia',
  email = 'staff.demo@lcp.edu.ph',
  auth_provider = 'email'
WHERE email = 'staff.demo@lcp.edu.ph';

-- =====================================================
-- VERIFICATION: Check if accounts were created
-- =====================================================
SELECT 
  email, 
  role, 
  status, 
  first_name, 
  last_name,
  CASE 
    WHEN role = 'alumni' THEN course
    ELSE 'N/A'
  END as course_or_na
FROM profiles 
WHERE email IN (
  'alumni.demo@lcp.edu.ph',
  'admin.demo@lcp.edu.ph', 
  'superadmin.demo@lcp.edu.ph',
  'staff.demo@lcp.edu.ph'
)
ORDER BY role;
