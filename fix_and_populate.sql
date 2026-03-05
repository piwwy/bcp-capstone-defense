
-- 1. Fix Michael Llagas batch and course data (as seen in screenshot he is Bachelor of Science in Information Technology, but N/A appears)
UPDATE profiles 
SET batch_year = '2025', course = 'BSIT' 
WHERE last_name = 'Llagas' AND first_name = 'Michael';

-- 2. Populate Career Data with Realistic Values
DO $$
DECLARE
    r RECORD;
    positions TEXT[] := ARRAY['Software Engineer', 'Data Analyst', 'HR Specialist', 'Hotel Manager', 'Tourism Officer', 'Financial Advisor', 'Police Officer', 'Elementary Teacher', 'Business Owner', 'Customer Service Representative', 'Senior Developer', 'Quality Assurance', 'Marketing Executive'];
    companies TEXT[] := ARRAY['Accenture', 'Google Philippines', 'SM Prime Holdings', 'BDO Unibank', 'Globe Telecom', 'PLDT', 'San Miguel Corp', 'Jollibee Foods Corp', 'Ayala Land', 'Converge ICT', 'Sutherland', 'Teleperformance', 'LCP', 'Foundever'];
    locations TEXT[] := ARRAY['Quezon City, PH', 'Makati City, PH', 'BGC, Taguig City, PH', 'Caloocan City, PH', 'Mandaluyong City, PH', 'Pasig City, PH', 'Manila, PH', 'Remote / Work From Home'];
    statuses TEXT[] := ARRAY['employed', 'self-employed', 'unemployed', 'student'];
    salary_ranges TEXT[] := ARRAY['20,000 - 30,000', '30,000 - 50,000', '50,000 - 80,000', '80,000 - 120,000', '15,000 - 25,000'];
BEGIN
    FOR r IN SELECT id, first_name, last_name, mobile_number, address FROM profiles WHERE role = 'alumni' LOOP
        -- Upsert into alumni_profiles
        INSERT INTO alumni_profiles (id, employment_status, current_position, current_company, industry, location, phone, headline, years_experience)
        VALUES (
            r.id,
            statuses[floor(random() * array_length(statuses, 1) + 1)],
            positions[floor(random() * array_length(positions, 1) + 1)],
            companies[floor(random() * array_length(companies, 1) + 1)],
            'Technology', -- Simplified for now
            COALESCE(r.address, locations[floor(random() * array_length(locations, 1) + 1)]),
            r.mobile_number,
            'Alumni of Linker College',
            floor(random() * 5 + 1)
        )
        ON CONFLICT (id) DO UPDATE SET
            employment_status = EXCLUDED.employment_status,
            current_position = EXCLUDED.current_position,
            current_company = EXCLUDED.current_company,
            location = EXCLUDED.location,
            phone = EXCLUDED.phone;
    END LOOP;
END $$;

-- 3. Add subscription columns to profiles if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_start_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_end_date DATE;

-- 4. Initial populate for subscription dates (sample data)
UPDATE profiles 
SET 
  subscription_start_date = (CURRENT_DATE - (floor(random() * 30) || ' days')::interval)::date,
  subscription_end_date = (CURRENT_DATE + (floor(random() * 300 + 30) || ' days')::interval)::date
WHERE role = 'alumni' AND status = 'verified' AND random() < 0.3;
