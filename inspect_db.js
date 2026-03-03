
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const getEnv = (key) => {
    const match = envContent.match(new RegExp(`${key}=(.*)`));
    return match ? match[1].trim() : null;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectData() {
    console.log("Fetching first 5 profiles...");
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(5);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Profiles found:", data.length);
        if (data.length > 0) {
            console.log("Sample Profile:", JSON.stringify(data[0], null, 2));
        } else {
            console.log("Table is empty or RLS is blocking unauthenticated access.");

            console.log("Trying to check if we can see any emails in 'profiles'...");
            const { data: emails } = await supabase.from('profiles').select('email').limit(1);
            console.log("Emails visible:", emails);
        }
    }
}
inspectData();
