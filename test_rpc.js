
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

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRPC() {
    console.log('Testing RPC admin_create_user...');
    const { data, error } = await supabase.rpc('admin_create_user', {
        email: 'test_check@example.com',
        password: 'Password123!',
        user_metadata: { first_name: 'Test', last_name: 'Check' }
    });

    if (error) {
        console.error('RPC Error:', error);
    } else {
        console.log('RPC Result:', data);
    }
}

testRPC();
