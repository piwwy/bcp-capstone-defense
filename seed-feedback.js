import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mexfpnvdeiuqdotzrqyi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1leGZwbnZkZWl1cWRvdHpycXlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNTAxNjQsImV4cCI6MjA4NDcyNjE2NH0.1enUWKVd-uuG8Ju1pJmIrp55zcXyAM1-_VLOShY0UBg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedFeedback() {
    // 1. Get Events
    const { data: events, error: eventError } = await supabase
        .from('alumni_events')
        .select('id, title');

    if (eventError) {
        console.error('Error fetching events:', eventError);
        return;
    }

    // 2. Get some Alumni Profiles
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .limit(50);

    if (profileError) {
        console.error('Error fetching profiles:', profileError);
        return;
    }

    if (!events || events.length === 0) {
        console.log('No events found to seed feedback for.');
        return;
    }

    const feedbackData = [];
    const feedbackTemplates = [
        "Great event! Learned a lot.",
        "The speakers were amazing and very insightful.",
        "Very well organized. Looking forward to the next one.",
        "A bit short, but the content was dense and useful.",
        "Excellent networking opportunity!",
        "I enjoyed the workshop part the most.",
        "The venue was perfect for this kind of gathering.",
        "The Q&A session was the best part.",
        "Could have been better if there were more handouts.",
        "It was a life-changing experience for me.",
        "I met a lot of old friends and made new ones.",
        "The presentation slides were a bit hard to see.",
        "Highly recommended for all alumni!",
        "Please do more events like this one.",
        "The food was great too! Thanks for the effort."
    ];

    for (const event of events) {
        // Generate 10-15 feedbacks per event
        const count = Math.floor(Math.random() * 6) + 10; // 10 to 15
        for (let i = 0; i < count; i++) {
            const profile = profiles[Math.floor(Math.random() * profiles.length)];
            const template = feedbackTemplates[Math.floor(Math.random() * feedbackTemplates.length)];

            feedbackData.push({
                alumni_id: profile.id,
                alumni_name: `${profile.first_name} ${profile.last_name}`,
                subject: `Feedback for ${event.title}`,
                message: template,
                rating: Math.floor(Math.random() * 3) + 3, // 3, 4, or 5 stars
                status: Math.random() > 0.3 ? 'reviewed' : 'pending',
                event_id: event.id,
                created_at: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString()
            });
        }
    }

    console.log(`Inserting ${feedbackData.length} feedback records...`);
    const { error: insertError } = await supabase
        .from('alumni_feedback')
        .insert(feedbackData);

    if (insertError) {
        console.error('Error inserting feedback:', insertError);
    } else {
        console.log('Successfully seeded feedback data!');
    }
}

seedFeedback();
