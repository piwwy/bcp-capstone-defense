import { createClient } from '@supabase/supabase-client';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function cleanPartnerInquiries() {
    try {
        const { data: testRecs, error: fetchError } = await supabase
            .from('contact_inquiries')
            .select('id, name, company_name')
            .or('name.ilike.%test%,company_name.ilike.%test%,email.ilike.%test%,company_message.ilike.%test%,message.ilike.%test%');

        if (fetchError) throw fetchError;

        if (!testRecs || testRecs.length === 0) {
            console.log('No test records found in partner inquiries.');
            return;
        }

        console.log(`Found ${testRecs.length} test records. Deleting...`);

        const { error: deleteError } = await supabase
            .from('contact_inquiries')
            .delete()
            .in('id', testRecs.map(r => r.id));

        if (deleteError) throw deleteError;

        console.log('Successfully deleted test records.');
    } catch (err) {
        console.error('Error during cleanup:', err);
    }
}

cleanPartnerInquiries();
