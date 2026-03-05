import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mexfpnvdeiuqdotzrqyi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1leGZwbnZkZWl1cWRvdHpycXlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNTAxNjQsImV4cCI6MjA4NDcyNjE2NH0.1enUWKVd-uuG8Ju1pJmIrp55zcXyAM1-_VLOShY0UBg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedData() {
    // 1. Seed Events
    const events = [
        { title: 'Grand Alumni Homecoming 2024', description: 'Reconnecting with old friends and celebrating achievements.', date: '2024-12-15', location: 'Main Campus', category: 'Socials', status: 'active', is_featured: false },
        { title: 'Career Development Webinar: AI in 2024', description: 'Exploring the impact of AI on various industries.', date: '2024-05-10', location: 'Zoom Meetings', category: 'Webinars', status: 'active', is_featured: false },
        { title: 'Networking Night: Tech & Business', description: 'A night of professional networking for alumni.', date: '2024-06-20', location: 'Grand Ballroom', category: 'Socials', status: 'active', is_featured: false },
        { title: 'Annual Charity Golf Tournament', description: 'Supporting alumni scholarship funds.', date: '2024-08-05', location: 'Golf Club', category: 'Fundraising', status: 'active', is_featured: false },
        { title: 'Mentorship Program Kickoff', description: 'Matching alumni mentors with students.', date: '2024-03-12', location: 'Function Hall', category: 'Workshops', status: 'active', is_featured: false }
    ];

    console.log('Deleting existing events...');
    const { error: deleteEventsError } = await supabase
        .from('alumni_events')
        .delete()
        .neq('title', ''); // Delete all events with a title (which is all of them)

    if (deleteEventsError) {
        console.error('Error deleting existing events:', deleteEventsError);
        return;
    }
    console.log('Existing events deleted.');

    console.log('Inserting events...');
    const { data: insertedEvents, error: eventError } = await supabase
        .from('alumni_events')
        .insert(events)
        .select();

    if (eventError) {
        console.error('Error inserting events:', eventError);
        return;
    }

    const allEvents = insertedEvents || [];
    console.log(`Seeded ${allEvents.length} events.`);

    // 2. Get some Alumni Profiles
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .limit(50);

    if (profileError) {
        console.error('Error fetching profiles:', profileError);
        return;
    }

    if (profiles.length === 0) {
        console.log('No profiles found. Cannot seed feedback.');
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

    for (const event of allEvents) {
        // Generate 10-15 feedbacks per event
        const count = 12; // Fixed 12 per event for consistency
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
                created_at: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString()
            });
        }
    }

    console.log('Deleting existing feedback...');
    const { error: deleteFeedbackError } = await supabase
        .from('alumni_feedback')
        .delete()
        .neq('subject', '');

    if (deleteFeedbackError) {
        console.error('Error deleting existing feedback:', deleteFeedbackError);
    }
    console.log('Existing feedback deleted.');

    console.log(`Inserting ${feedbackData.length} feedback records...`);
    // Insert in chunks to avoid any pool/size limits
    const chunk = 50;
    for (let i = 0; i < feedbackData.length; i += chunk) {
        const { error: insertError } = await supabase
            .from('alumni_feedback')
            .insert(feedbackData.slice(i, i + chunk));

        if (insertError) {
            console.error('Error inserting feedback chunk:', insertError);
        }
    }

    console.log('Successfully seeded events and feedback data!');
}

seedData();
