
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkApp(email) {
    const { data: apps, error: appErr } = await supabase
        .from('subscription_applications')
        .select('*')
        .ilike('email', `%${email}%`);

    if (appErr) {
        console.error('App Error:', appErr);
    } else {
        console.log('Applications found:', apps);
    }

    const { data: profiles, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', `%${email}%`);

    if (profErr) {
        console.error('Profile Error:', profErr);
    } else {
        console.log('Profiles found:', profiles);
    }
}

checkApp('vivien');
