
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Manually read .env to avoid dotenv dependency errors in some environments
const envContent = fs.readFileSync('.env', 'utf8');
const getEnv = (key) => {
    const match = envContent.match(new RegExp(`${key}=(.*)`));
    return match ? match[1].trim() : null;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing environment variables in .env file.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SURNAMES = ["Dela Cruz", "Santos", "Reyes", "Garcia", "Bautista", "Mendoza", "Pascual", "Castillo", "Villanueva", "Torres", "Lim", "Go", "Tan", "Chua", "Sy"];
const FIRST_NAMES = ["John", "Maria", "Jose", "Michael", "Sarah", "David", "Jessica", "James", "Michelle", "Robert", "Jennifer", "William", "Patricia", "Richard", "Elizabeth"];
const MIDDLE_NAMES = ["Abad", "Bachiller", "Cajilig", "Dalisay", "Espinosa", "Fajardo", "Guevarra", "Hernandez", "Ibarra", "Jalandoni", "Kasilag", "Legaspi", "Madrigal", "Navarro", "Ocampo", "Panganiban"];
const SUFFIXES = ["Jr.", "III", "IV", "Sr."];
const ADDRESS_PARTS = [
    "Brgy. San Bartolome, Novaliches, Quezon City",
    "Brgy. Gulod, Novaliches, Quezon City",
    "Brgy. Bagbag, Novaliches, Quezon City",
    "Brgy. Kaligayahan, Novaliches, Quezon City",
    "Brgy. Greater Lagro, Novaliches, Quezon City",
    "Brgy. Sta. Monica, Novaliches, Quezon City",
    "Novaliches Proper, Quezon City",
    "Nagkaisang Nayon, Quezon City",
    "Brgy. Pasong Putik, Quezon City",
    "Novaliches, Caloocan City North",
    "Brgy. 171 Bagumbong, Caloocan City",
    "Brgy. 177 Camarin, Caloocan City",
    "Brgy. 165 Bagbaguin, Caloocan City",
    "Phase 1, Heritage Homes, Marilao, Bulacan"
];

async function fillMissingData() {
    console.log("Fetching alumni profiles...");
    const { data: alumni, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'alumni');

    if (error) {
        console.error("Error fetching profiles:", error);
        return;
    }

    console.log(`Found ${alumni.length} alumni profiles. Processing...`);

    for (const profile of alumni) {
        const updates = {};
        let needsUpdate = false;

        // 1. Suffix - Randomly assign to 15% of people
        if (!profile.suffix && Math.random() < 0.15) {
            updates.suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
            needsUpdate = true;
        }

        // 2. Middle Name - Invent if missing
        if (!profile.middle_name) {
            updates.middle_name = MIDDLE_NAMES[Math.floor(Math.random() * MIDDLE_NAMES.length)];
            needsUpdate = true;
        }

        // 3. Birthday
        if (!profile.birthday) {
            const batchYear = parseInt(profile.batch_year) || 2024;
            const ageAtGrad = 20 + Math.floor(Math.random() * 4);
            const birthYear = batchYear - ageAtGrad;
            const birthMonth = Math.floor(Math.random() * 12) + 1;
            const birthDay = Math.floor(Math.random() * 28) + 1;
            updates.birthday = `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;
            needsUpdate = true;
        }

        // 4. Address
        if (!profile.address) {
            updates.address = ADDRESS_PARTS[Math.floor(Math.random() * ADDRESS_PARTS.length)];
            needsUpdate = true;
        }

        // 5. Mobile Number
        if (!profile.mobile_number) {
            updates.mobile_number = `09${Math.floor(100000000 + Math.random() * 900000000)}`;
            needsUpdate = true;
        }

        if (needsUpdate) {
            console.log(`Updating ${profile.first_name} ${profile.last_name} with: ${JSON.stringify(updates)}`);
            const { error: updateError } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', profile.id);

            if (updateError) {
                console.error(`Error updating ${profile.id}:`, updateError);
            }
        }
    }

    console.log("Data population complete.");
}

fillMissingData();
