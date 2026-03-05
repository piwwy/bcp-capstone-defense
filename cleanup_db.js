
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mexfpnvdeiuqdotzrqyi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1leGZwbnZkZWl1cWRvdHpycXlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNTAxNjQsImV4cCI6MjA4NDcyNjE2NH0.1enUWKVd-uuG8Ju1pJmIrp55zcXyAM1-_VLOShY0UBg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
    console.log('Starting cleanup...');

    // 1. Remove 'Largest Batch', 'Batch Unknown' from profiles
    const { data: pData, error: pError } = await supabase
        .from('profiles')
        .update({ batch_year: null })
        .in('batch_year', ['Largest Batch', 'Batch Unknown', 'Unknown', 'n/a', 'null', '1 alumni']);

    if (pError) console.error('Error updating profiles:', pError);
    else console.log('Profiles updated.');

    // 2. Remove any '1 alumni' from other places if found
    const { data: apData, error: apError } = await supabase
        .from('alumni_profiles')
        .update({ industry: 'Other' })
        .eq('industry', '1 alumni');

    if (apError) console.error('Error updating alumni_profiles:', apError);
    else console.log('Alumni profiles updated.');

    // 3. Remove seeding sample feedback
    const { error: fError } = await supabase
        .from('alumni_feedback')
        .delete()
        .ilike('message', '%seeding%');

    if (fError) console.error('Error deleting sample feedback:', fError);
    else console.log('Sample feedback deleted.');

    console.log('Cleanup complete.');
}

cleanup();
