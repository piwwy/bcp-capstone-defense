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

    console.log('Inserting events...');
    const { data: insertedEvents, error: eventError } = await supabase
        .from('alumni_events')
        .insert(events)
        .select();

    if (eventError) {
        console.error('Error inserting events:', eventError);
        // If events already exist, try to fetch them to continue seeding feedback
        const { data: existingEvents } = await supabase.from('alumni_events').select('*');
        if (existingEvents && existingEvents.length > 0) {
            console.log('Using existing events for feedback seeding.');
            var allEvents = existingEvents;
        } else {
            return;
        }
    } else {
        var allEvents = insertedEvents || [];
    }

    console.log(`Using ${allEvents.length} events.`);

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
        // Generate 12 feedbacks per event
        for (let i = 0; i < 12; i++) {
            const profile = profiles[Math.floor(Math.random() * profiles.length)];
            const template = feedbackTemplates[Math.floor(Math.random() * feedbackTemplates.length)];

            feedbackData.push({
                alumni_id: profile.id,
                alumni_name: `${profile.first_name || 'Alumni'} ${profile.last_name || 'Member'}`,
                subject: `Feedback for ${event.title}`,
                message: template,
                rating: Math.floor(Math.random() * 3) + 3, // 3, 4, or 5 stars
                status: Math.random() > 0.3 ? 'reviewed' : 'pending',
                event_id: event.id,
                created_at: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString()
            });
        }
    }

    console.log(`Inserting ${feedbackData.length} feedback records...`);
    // Insert in chunks
    for (let i = 0; i < feedbackData.length; i += 50) {
        const { error: insertError } = await supabase
            .from('alumni_feedback')
            .insert(feedbackData.slice(i, i + 50));

        if (insertError) {
            console.error('Error inserting feedback chunk:', insertError);
        }
    }

    console.log('Successfully seeded data!');
}

seedData();
