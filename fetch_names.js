import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

if (!url || !key) {
    console.error('Missing Supabase URL or Key in .env');
    process.exit(1);
}

const supabase = createClient(url, key);

async function getExistingNames() {
    const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name');

    if (error) {
        console.error('Error fetching profiles:', error);
        process.exit(1);
    }

    fs.writeFileSync('existing_names.json', JSON.stringify(data, null, 2));
    console.log(`Saved ${data.length} existing names to existing_names.json`);
}

getExistingNames();
