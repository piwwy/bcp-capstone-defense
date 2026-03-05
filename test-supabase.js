import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mexfpnvdeiuqdotzrqyi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1leGZwbnZkZWl1cWRvdHpycXlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNTAxNjQsImV4cCI6MjA4NDcyNjE2NH0.1enUWKVd-uuG8Ju1pJmIrp55zcXyAM1-_VLOShY0UBg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const { data, error } = await supabase.from('alumni_events').select('id, title');
    console.log('Events Data:', data);
    console.log('Error:', error);
}

test();
