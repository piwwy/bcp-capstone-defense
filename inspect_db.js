
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mexfpnvdeiuqdotzrqyi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1leGZwbnZkZWl1cWRvdHpycXlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNTAxNjQsImV4cCI6MjA4NDcyNjE2NH0.1enUWKVd-uuG8Ju1pJmIrp55zcXyAM1-_VLOShY0UBg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log('Inspecting database...');

    const { data: profiles, error: pError } = await supabase.from('profiles').select('*').limit(5);
    if (pError) console.error('Profiles Error:', pError);
    else console.log('Profiles:', JSON.stringify(profiles, null, 2));

    const { data: ap, error: apError } = await supabase.from('alumni_profiles').select('*').limit(5);
    if (apError) console.error('Alumni Profiles Error:', apError);
    else console.log('Alumni Profiles:', JSON.stringify(ap, null, 2));

    const { data: feedback, error: fError } = await supabase.from('alumni_feedback').select('*').limit(5);
    if (fError) console.error('Feedback Error:', fError);
    else console.log('Feedback:', JSON.stringify(feedback, null, 2));
}

inspect();
