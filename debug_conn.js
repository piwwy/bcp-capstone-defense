
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const getEnv = (key) => {
    const match = envContent.match(new RegExp(`${key}=(.*)`));
    return match ? match[1].trim() : null;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');

console.log("Using URL:", supabaseUrl);
// console.log("Using Key (start):", supabaseKey ? supabaseKey.substring(0, 10) : "null");

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllTables() {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error fetching profiles:", error);
    } else {
        console.log("Data fetched:", data);
    }
}
listAllTables();
