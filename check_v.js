
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env manually
const envContent = fs.readFileSync('./.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        env[key] = value;
    }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVivien() {
    console.log('Checking for Vivien...');

    // Check Applications
    const { data: apps, error: appErr } = await supabase
        .from('subscription_applications')
        .select('*')
        .ilike('email', '%vivien%');

    if (appErr) console.error('App Error:', appErr);
    else console.log('Applications:', apps);

    // Check Profiles
    const { data: profiles, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .or('email.ilike.%vivien%,first_name.ilike.%vivien%,last_name.ilike.%vivien%');

    if (profErr) console.error('Profile Error:', profErr);
    else console.log('Profiles:', profiles);
}

checkVivien();
