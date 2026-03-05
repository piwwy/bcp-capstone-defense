
-- SQL to populate past events with feedback from alumni
-- This script associates feedback with existing alumni and past events.

DO $$
DECLARE
    event_rec RECORD;
    alumni_rec RECORD;
    feedback_messages TEXT[] := ARRAY[
        'The event was very well-organized. I enjoyed catching up with my classmates.',
        'Great speakers and very relevant topics for our career growth.',
        'I hope we have more events like this in the future. BCP is doing a great job!',
        'The venue was a bit crowded, but the energy was amazing.',
        'Excellent networking opportunity. I met several potential partners today.',
        'The food was great and the program flowed very well. Thank you!',
        'A very sentimental homecoming. It was nice to see the new campus developments.',
        'Thank you for organizing this. It makes me proud to be a BCPian.',
        'Looking forward to the next reunion! More power to the alumni association.',
        'Technical topics discussed were very up-to-date and useful for my current role.'
    ];
    feedback_subjects TEXT[] := ARRAY[
        'Wonderful Experience',
        'Great Homecoming',
        'Insightful Topics',
        'Well Organized',
        'Memorable Reunion',
        'Excellent Networking',
        'Proud Alumni',
        'Feedback on Event',
        'Great Job!',
        'Thank You BCP'
    ];
    v_msg TEXT;
    v_subj TEXT;
    v_rating INTEGER;
    v_date TIMESTAMP;
BEGIN
    FOR event_rec IN SELECT id, title, date FROM alumni_events WHERE date < NOW() LOOP
        -- For each past event, add 3-5 feedbacks
        FOR alumni_rec IN SELECT id, first_name, last_name FROM profiles WHERE role = 'alumni' ORDER BY RANDOM() LIMIT (FLOOR(RANDOM() * 3) + 3) LOOP
            v_msg := feedback_messages[FLOOR(RANDOM() * 10) + 1];
            v_subj := feedback_subjects[FLOOR(RANDOM() * 10) + 1];
            v_rating := FLOOR(RANDOM() * 2) + 4; -- 4 or 5 stars
            v_date := event_rec.date + interval '1 day' + (RANDOM() * interval '7 days'); -- submitted within a week after event
            
            -- Insert into alumni_feedback if not already exists for this alumni and event
            IF NOT EXISTS (SELECT 1 FROM alumni_feedback WHERE alumni_id = alumni_rec.id AND event_id = event_rec.id) THEN
                INSERT INTO alumni_feedback (
                    alumni_id,
                    alumni_name,
                    subject,
                    message,
                    rating,
                    status,
                    event_id,
                    created_at
                ) VALUES (
                    alumni_rec.id,
                    alumni_rec.first_name || ' ' || alumni_rec.last_name,
                    v_subj,
                    v_msg,
                    v_rating,
                    'reviewed',
                    event_rec.id,
                    v_date
                );
            END IF;
        END LOOP;
    END LOOP;
END $$;
