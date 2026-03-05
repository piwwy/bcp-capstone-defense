
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfile(email) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', `%${email}%`);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Profiles found:', data);
}

checkProfile('vivien');
