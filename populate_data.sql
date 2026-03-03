
-- SQL script to populate missing alumni data
-- Run this in the Supabase SQL Editor

DO $$
DECLARE
    r RECORD;
    middle_names TEXT[] := ARRAY['Abad', 'Bachiller', 'Cajilig', 'Dalisay', 'Espinosa', 'Fajardo', 'Guevarra', 'Hernandez', 'Ibarra', 'Jalandoni', 'Kasilag', 'Legaspi', 'Madrigal', 'Navarro', 'Ocampo', 'Panganiban'];
    suffixes TEXT[] := ARRAY['Jr.', 'Sr.', 'III', 'IV'];
    addresses TEXT[] := ARRAY[
        'Brgy. San Bartolome, Novaliches, Quezon City',
        'Brgy. Gulod, Novaliches, Quezon City',
        'Brgy. Bagbag, Novaliches, Quezon City',
        'Brgy. Kaligayahan, Novaliches, Quezon City',
        'Brgy. Greater Lagro, Novaliches, Quezon City',
        'Brgy. Sta. Monica, Novaliches, Quezon City',
        'Novaliches Proper, Quezon City',
        'Nagkaisang Nayon, Quezon City',
        'Brgy. Pasong Putik, Quezon City',
        'Novaliches, Caloocan City North',
        'Brgy. 171 Bagumbong, Caloocan City',
        'Brgy. 177 Camarin, Caloocan City',
        'Brgy. 165 Bagbaguin, Caloocan City',
        'Phase 1, Heritage Homes, Marilao, Bulacan'
    ];
    batch_year_int INT;
    birth_year INT;
    birth_month INT;
    birth_day INT;
BEGIN
    FOR r IN SELECT * FROM profiles WHERE role = 'alumni' LOOP
        -- 1. Middle Name
        IF r.middle_name IS NULL OR r.middle_name = '' THEN
            UPDATE profiles SET middle_name = middle_names[floor(random() * array_length(middle_names, 1) + 1)]
            WHERE id = r.id;
        END IF;

        -- 2. Suffix (15% chance)
        IF (r.suffix IS NULL OR r.suffix = '') AND random() < 0.15 THEN
            UPDATE profiles SET suffix = suffixes[floor(random() * array_length(suffixes, 1) + 1)]
            WHERE id = r.id;
        END IF;

        -- 3. Birthday (Logical age based on batch year)
        IF r.birthday IS NULL THEN
            batch_year_int := COALESCE(NULLIF(regexp_replace(r.batch_year, '\D', '', 'g'), '')::INT, 2024);
            birth_year := batch_year_int - (20 + floor(random() * 4)::INT);
            birth_month := floor(random() * 12 + 1)::INT;
            birth_day := floor(random() * 28 + 1)::INT;
            
            UPDATE profiles SET birthday = (birth_year || '-' || lpad(birth_month::text, 2, '0') || '-' || lpad(birth_day::text, 2, '0'))::DATE
            WHERE id = r.id;
        END IF;

        -- 4. Address
        IF r.address IS NULL OR r.address = '' THEN
            UPDATE profiles SET address = addresses[floor(random() * array_length(addresses, 1) + 1)]
            WHERE id = r.id;
        END IF;

        -- 5. Mobile Number
        IF r.mobile_number IS NULL OR r.mobile_number = '' THEN
            UPDATE profiles SET mobile_number = '09' || floor(random() * 900000000 + 100000000)::text
            WHERE id = r.id;
        END IF;
    END LOOP;
END $$;
