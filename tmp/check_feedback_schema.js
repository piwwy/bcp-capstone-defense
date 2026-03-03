import { createClient } from '@supabase/supabase-client';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkSchema() {
    const { data, error } = await supabase
        .from('alumni_feedback')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching feedback:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns in alumni_feedback:', Object.keys(data[0]));
    } else {
        console.log('No data in alumni_feedback to determine columns.');
    }
}

checkSchema();
