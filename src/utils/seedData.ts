import { supabase } from '../services/supabaseClient';

/**
 * Seed sample data into all admin modules for analytics/demo purposes.
 * Call this once from admin settings or console.
 */
export async function seedAllModules(onProgress?: (msg: string) => void) {
  const log = (msg: string) => {
    console.log(`[SEED] ${msg}`);
    onProgress?.(msg);
  };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Must be logged in to seed data.');
  const adminId = user.id;

  // ========== 1. JOBS (7 entries) ==========
  log('Seeding jobs...');
  const jobs = [
    { title: 'Software Engineer', company: 'Accenture Philippines', location: 'BGC, Taguig', type: 'Full-time', work_type: 'Hybrid', category: 'BSIT', description: 'Develop enterprise web applications using React and Node.js. Must have 1-2 years experience.', salary_range: '₱35,000 - ₱55,000', target_courses: ['BSIT', 'BSCS'], status: 'active', posted_by: adminId },
    { title: 'Junior Data Analyst', company: 'Converge ICT', location: 'Quezon City', type: 'Full-time', work_type: 'On-site', category: 'BSIT', description: 'Analyze network performance data and generate weekly reports. SQL and Excel proficiency required.', salary_range: '₱25,000 - ₱35,000', target_courses: ['BSIT', 'BSCS', 'BSBA'], status: 'active', posted_by: adminId },
    { title: 'Marketing Associate', company: 'SM Supermalls', location: 'Pasay City', type: 'Full-time', work_type: 'On-site', category: 'BSBA', description: 'Plan and execute marketing campaigns for mall events. Fresh graduates welcome.', salary_range: '₱22,000 - ₱30,000', target_courses: ['BSBA', 'BSTM'], status: 'active', posted_by: adminId },
    { title: 'Hotel Front Desk Officer', company: 'Marriott Manila', location: 'Pasay City', type: 'Full-time', work_type: 'On-site', category: 'BSHM', description: 'Handle guest check-in/check-out, reservations, and concierge services.', salary_range: '₱20,000 - ₱28,000', target_courses: ['BSHM', 'BSTM'], status: 'active', posted_by: adminId },
    { title: 'Freelance Web Developer', company: 'Remote PH', location: 'Remote', type: 'Freelance', work_type: 'Remote', category: 'BSIT', description: 'Build responsive websites for international clients. WordPress and Shopify experience preferred.', salary_range: '₱40,000 - ₱70,000', target_courses: ['BSIT', 'BSCS'], status: 'active', posted_by: adminId },
    { title: 'Accounting Staff', company: 'SGV & Co.', location: 'Makati City', type: 'Full-time', work_type: 'On-site', category: 'BSA', description: 'Assist in audit engagements and financial statement preparation. CPA board passer preferred.', salary_range: '₱25,000 - ₱35,000', target_courses: ['BSA', 'BSBA'], status: 'active', posted_by: adminId },
    { title: 'Tourism Officer', company: 'DOT Region III', location: 'Clark, Pampanga', type: 'Contract', work_type: 'On-site', category: 'BSTM', description: 'Coordinate tourism programs and events in the region. Government position with benefits.', salary_range: '₱28,000 - ₱38,000', target_courses: ['BSTM', 'BSHM'], status: 'active', posted_by: adminId },
  ];
  const { error: jobErr } = await supabase.from('jobs').insert(jobs);
  if (jobErr) log(`Jobs error: ${jobErr.message}`);
  else log('Jobs seeded: 7 entries');

  // ========== 2. EVENTS (6 entries) ==========
  log('Seeding events...');
  const now = new Date();
  const futureDate = (daysAhead: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString();
  };
  const events = [
    { title: 'LCP Alumni Homecoming 2026', description: 'Annual homecoming celebration for all LCP alumni. Featuring performances, awards, and networking.', date: futureDate(30), location: 'LCP Main Campus Gymnasium', category: 'Reunions', status: 'active', is_featured: true },
    { title: 'Tech Career Fair', description: 'Connect with top IT companies hiring LCP graduates. Bring your resume and portfolio!', date: futureDate(14), location: 'LCP Auditorium', category: 'Career', status: 'active', is_featured: true },
    { title: 'Webinar: Financial Literacy for Young Professionals', description: 'Learn budgeting, investing, and financial planning tips from alumni who are now financial advisors.', date: futureDate(7), location: 'Zoom Meeting (link will be sent)', category: 'Webinars', status: 'active', is_featured: false },
    { title: 'BSIT Batch 2024 Reunion', description: 'Exclusive reunion for BSIT Batch 2024 graduates. Dinner and program at a restaurant in QC.', date: futureDate(45), location: 'Vikings Luxury Buffet, SM North EDSA', category: 'Reunions', status: 'active', is_featured: false },
    { title: 'Community Service: Tree Planting', description: 'Give back to the community! Join fellow alumni in a tree planting activity in La Mesa Eco Park.', date: futureDate(21), location: 'La Mesa Eco Park, Quezon City', category: 'Community', status: 'active', is_featured: false },
    { title: 'Workshop: Resume Building & Interview Tips', description: 'Hands-on workshop to improve your resume and ace job interviews. Open to all alumni.', date: futureDate(10), location: 'LCP Room 301', category: 'Workshops', status: 'active', is_featured: false },
  ];
  const { error: evtErr } = await supabase.from('alumni_events').insert(events);
  if (evtErr) log(`Events error: ${evtErr.message}`);
  else log('Events seeded: 6 entries');

  // ========== 3. NEWS ARTICLES (6 entries) ==========
  log('Seeding news articles...');
  const articles = [
    { title: 'LCP Ranks Top 5 in National IT Competition', content: 'Linker College of the Philippines BSIT students secured 5th place in the National IT Skills Olympics held in Manila. The team showcased their web development and cybersecurity skills against 50+ schools nationwide. Congratulations to our talented students and their mentors!', excerpt: 'LCP BSIT students place 5th in National IT Skills Olympics.', category: 'Achievement', is_published: true, published_at: new Date().toISOString(), author_id: adminId },
    { title: 'New Partnership with Accenture for OJT Program', content: 'LCP has signed a memorandum of agreement with Accenture Philippines to provide on-the-job training opportunities for BSIT and BSCS students. Starting next semester, selected students will undergo a 3-month immersive program at Accenture BGC office.', excerpt: 'Accenture partners with LCP for student OJT program.', category: 'Partnership', is_published: true, published_at: new Date().toISOString(), author_id: adminId },
    { title: 'Alumni Spotlight: Maria Santos — From LCP to Google', content: 'Maria Santos, BSCS Batch 2020, recently joined Google as a Software Engineer in Singapore. In an exclusive interview, she shares her journey from being a working student at LCP to landing her dream job at one of the world\'s biggest tech companies.', excerpt: 'BSCS alumna Maria Santos joins Google Singapore.', category: 'Alumni Spotlight', is_published: true, published_at: new Date().toISOString(), author_id: adminId },
    { title: 'Enrollment for 2nd Semester Now Open', content: 'Online enrollment for the 2nd semester of AY 2025-2026 is now open. Visit the registrar portal or the main campus for assistance. Early bird discounts available until March 15.', excerpt: 'Second semester enrollment is now open with early bird discounts.', category: 'Announcement', is_published: true, published_at: new Date().toISOString(), author_id: adminId },
    { title: 'LCP Donates Computers to Barangay Learning Center', content: 'As part of its community outreach program, LCP donated 15 refurbished computers to the Barangay Commonwealth Learning Center. The computers will be used for digital literacy programs for out-of-school youth.', excerpt: 'LCP donates 15 computers to community learning center.', category: 'Community', is_published: true, published_at: new Date().toISOString(), author_id: adminId },
    { title: 'Upcoming: Grand Alumni Ball 2026', content: 'Save the date! The Grand Alumni Ball 2026 will be held on December 15 at the Manila Hotel. This year\'s theme is "Golden Legacy." Early bird tickets are available at ₱1,500. Contact the alumni office for group reservations.', excerpt: 'Grand Alumni Ball 2026 announced for December 15.', category: 'Event', is_published: true, published_at: new Date().toISOString(), author_id: adminId },
  ];
  const { error: newsErr } = await supabase.from('news_articles').insert(articles);
  if (newsErr) log(`News error: ${newsErr.message}`);
  else log('News articles seeded: 6 entries');

  // ========== 4. DONATION CAMPAIGNS (5 entries) ==========
  log('Seeding donation campaigns...');
  const campaigns = [
    { title: 'Scholarship Fund for Working Students', target_amount: 100000, category: 'Scholarship', description: 'Help deserving working students complete their education. Every peso counts toward tuition assistance.', status: 'active' },
    { title: 'Computer Lab Upgrade Project', target_amount: 250000, category: 'Infrastructure', description: 'Upgrade the main computer laboratory with new workstations and high-speed internet for students.', status: 'active' },
    { title: 'LCP Sports Equipment Fund', target_amount: 50000, category: 'Sports', description: 'Provide quality sports equipment for the LCP varsity teams and intramural activities.', status: 'active' },
    { title: 'Emergency Relief Fund', target_amount: 75000, category: 'Disaster Relief', description: 'Standby fund for alumni and students affected by natural disasters and emergencies.', status: 'active' },
    { title: 'Library Book Drive 2026', target_amount: 30000, category: 'Education', description: 'Expand the LCP library collection with new textbooks, reference materials, and digital resources.', status: 'active' },
  ];
  const { error: campErr } = await supabase.from('donation_campaigns').insert(campaigns);
  if (campErr) log(`Campaigns error: ${campErr.message}`);
  else log('Donation campaigns seeded: 5 entries');

  // ========== 5. FEEDBACK (6 entries) ==========
  log('Seeding feedback...');
  const feedbacks = [
    { alumni_id: adminId, category: 'Platform', subject: 'Great new dashboard design!', message: 'The new alumni portal looks amazing. Very modern and easy to navigate. Keep up the great work!', rating: 5, status: 'pending' },
    { alumni_id: adminId, category: 'Events', subject: 'More networking events please', message: 'I would love to see more industry-specific networking events, especially for IT professionals. Maybe quarterly meetups?', rating: 4, status: 'pending' },
    { alumni_id: adminId, category: 'Jobs', subject: 'Job board needs more filters', message: 'The job board is useful but it would be better if we could filter by salary range and work arrangement (remote/hybrid/onsite).', rating: 3, status: 'pending' },
    { alumni_id: adminId, category: 'General', subject: 'Alumni ID card request', message: 'Is it possible to get a digital alumni ID card through the portal? It would be useful for discounts and verification.', rating: 4, status: 'pending' },
    { alumni_id: adminId, category: 'Platform', subject: 'Mobile app suggestion', message: 'A mobile app version of this portal would be very convenient. I mostly browse on my phone during commute.', rating: 4, status: 'pending' },
    { alumni_id: adminId, category: 'Donations', subject: 'GCash payment option', message: 'Please add GCash and Maya as payment options for donations. Bank transfer is inconvenient for small amounts.', rating: 3, status: 'pending' },
  ];
  const { error: fbErr } = await supabase.from('alumni_feedback').insert(feedbacks);
  if (fbErr) log(`Feedback error: ${fbErr.message}`);
  else log('Feedback seeded: 6 entries');

  // ========== 6. CONTACT INQUIRIES (5 entries) ==========
  log('Seeding contact inquiries...');
  const inquiries = [
    { inquiry_type: 'general', name: 'Juan Dela Cruz', email: 'juan@gmail.com', message: 'How can I update my alumni records? I changed my name after marriage.', status: 'pending', routed_to_osa: false, routed_to_hr: false },
    { inquiry_type: 'general', name: 'Ana Reyes', email: 'ana.reyes@yahoo.com', message: 'I lost my diploma. What is the process for requesting a replacement?', status: 'pending', routed_to_osa: false, routed_to_hr: false },
    { inquiry_type: 'company', company_name: 'TechVentures Inc.', contact_person: 'Mark Lim', company_email: 'hr@techventures.ph', company_phone: '(02) 8123-4567', position_offered: 'Junior Developer, QA Tester', company_message: 'We are looking to hire 5 fresh IT graduates for our Quezon City office.', status: 'pending', routed_to_osa: false, routed_to_hr: false },
    { inquiry_type: 'company', company_name: 'CloudStaff PH', contact_person: 'Sarah Garcia', company_email: 'recruitment@cloudstaff.com', company_phone: '(02) 8555-1234', position_offered: 'Virtual Assistant, Customer Support', company_message: 'Remote positions available for graduates of any course. Competitive salary and HMO.', status: 'pending', routed_to_osa: false, routed_to_hr: false },
    { inquiry_type: 'general', name: 'Carlos Mendoza', email: 'carlos.m@outlook.com', message: 'I would like to volunteer as a guest speaker for career orientation. Who should I contact?', status: 'pending', routed_to_osa: false, routed_to_hr: false },
  ];
  const { error: inqErr } = await supabase.from('contact_inquiries').insert(inquiries);
  if (inqErr) log(`Inquiries error: ${inqErr.message}`);
  else log('Contact inquiries seeded: 5 entries');

  // ========== 7. SURVEYS (2 entries) ==========
  log('Seeding surveys...');
  const surveys = [
    { title: 'Graduate Employment Survey 2026', description: 'Help us understand the employment landscape of our graduates.', questions: [{ question: 'Are you currently employed?', type: 'choice', options: ['Yes - Full-time', 'Yes - Part-time', 'Self-employed', 'Freelancing', 'Not yet employed'] }, { question: 'How long did it take you to find your first job after graduation?', type: 'choice', options: ['Before graduation', 'Less than 3 months', '3-6 months', '6-12 months', 'More than 1 year'] }, { question: 'Is your current job related to your course?', type: 'choice', options: ['Yes, directly related', 'Somewhat related', 'Not related'] }, { question: 'What is your current monthly salary range?', type: 'choice', options: ['Below ₱15,000', '₱15,000-₱25,000', '₱25,000-₱40,000', '₱40,000-₱60,000', 'Above ₱60,000'] }, { question: 'What skills from LCP helped you the most in your career?', type: 'text', options: [] }], status: 'active' },
    { title: 'Alumni Satisfaction Survey', description: 'Rate your experience with the alumni portal and services.', questions: [{ question: 'How would you rate the alumni portal overall?', type: 'choice', options: ['Excellent', 'Good', 'Average', 'Needs Improvement', 'Poor'] }, { question: 'Which feature do you use the most?', type: 'choice', options: ['Job Board', 'Events', 'News Feed', 'Directory', 'Donations'] }, { question: 'What new feature would you like to see?', type: 'text', options: [] }], status: 'active' },
  ];
  const { error: survErr } = await supabase.from('alumni_surveys').insert(surveys);
  if (survErr) log(`Surveys error: ${survErr.message}`);
  else log('Surveys seeded: 2 entries');

  // ========== 8. SURVEY RESPONSES (seed after surveys exist) ==========
  log('Seeding survey responses...');
  try {
    // Fetch the surveys we just created (or existing ones)
    const { data: existingSurveys } = await supabase
      .from('alumni_surveys')
      .select('id, title, questions')
      .eq('status', 'active')
      .limit(2);

    if (existingSurveys && existingSurveys.length > 0) {
      // Fetch some alumni profiles to use as respondents
      const { data: alumniProfiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'alumni')
        .limit(8);

      const respondentIds = (alumniProfiles || []).map(p => p.id);
      // Fallback: use admin as respondent if no alumni exist
      const ids = respondentIds.length > 0 ? respondentIds : [adminId];

      const responseRecords: any[] = [];

      for (const survey of existingSurveys) {
        const questions = survey.questions || [];
        // Create responses from different "alumni"
        const sampleAnswerSets = [
          // Response set 1
          Object.fromEntries(questions.map((q: any) => {
            if (q.type === 'choice' && q.options?.length) return [q.question, q.options[0]];
            if (q.type === 'rating') return [q.question, '5'];
            return [q.question, 'Programming and critical thinking skills were very helpful.'];
          })),
          // Response set 2
          Object.fromEntries(questions.map((q: any) => {
            if (q.type === 'choice' && q.options?.length) return [q.question, q.options[Math.min(1, q.options.length - 1)]];
            if (q.type === 'rating') return [q.question, '4'];
            return [q.question, 'The OJT program gave me real-world experience that helped me land my first job.'];
          })),
          // Response set 3
          Object.fromEntries(questions.map((q: any) => {
            if (q.type === 'choice' && q.options?.length) return [q.question, q.options[Math.min(2, q.options.length - 1)]];
            if (q.type === 'rating') return [q.question, '3'];
            return [q.question, 'Communication skills and teamwork from group projects.'];
          })),
          // Response set 4
          Object.fromEntries(questions.map((q: any) => {
            if (q.type === 'choice' && q.options?.length) return [q.question, q.options[Math.min(3, q.options.length - 1)]];
            if (q.type === 'rating') return [q.question, '4'];
            return [q.question, 'Database management and system analysis courses were the most useful.'];
          })),
          // Response set 5
          Object.fromEntries(questions.map((q: any) => {
            if (q.type === 'choice' && q.options?.length) return [q.question, q.options[Math.floor(Math.random() * q.options.length)]];
            if (q.type === 'rating') return [q.question, '5'];
            return [q.question, 'Networking with classmates who are now in the industry opened many doors for me.'];
          })),
        ];

        for (let i = 0; i < Math.min(ids.length, sampleAnswerSets.length); i++) {
          responseRecords.push({
            survey_id: survey.id,
            alumni_id: ids[i % ids.length],
            answers: sampleAnswerSets[i],
          });
        }
      }

      if (responseRecords.length > 0) {
        const { error: respErr } = await supabase.from('alumni_survey_responses').insert(responseRecords);
        if (respErr) log(`Survey responses error: ${respErr.message}`);
        else log(`Survey responses seeded: ${responseRecords.length} entries`);
      }
    } else {
      log('No active surveys found — skipping response seeding.');
    }
  } catch (err: any) {
    log(`Survey responses error: ${err.message}`);
  }

  // ========== 9. NOTIFICATIONS (seed sample notifications for admin) ==========
  log('Seeding notifications...');
  const notifications = [
    { user_id: adminId, title: 'New Survey Response', message: 'An alumni has responded to "Graduate Employment Survey 2026".', type: 'survey', is_read: false },
    { user_id: adminId, title: 'New Feedback Received', message: 'A new feedback has been submitted: "Great new dashboard design!"', type: 'message', is_read: false },
    { user_id: adminId, title: 'Event RSVP', message: '3 alumni have registered for "Tech Career Fair".', type: 'event_reminder', is_read: false },
    { user_id: adminId, title: 'New Job Application', message: 'An alumni applied for "Software Engineer" at Accenture.', type: 'job_alert', is_read: false },
    { user_id: adminId, title: 'Donation Received', message: 'A ₱500 donation was made to "Scholarship Fund for Working Students".', type: 'donation', is_read: false },
    { user_id: adminId, title: 'New Partner Inquiry', message: 'TechVentures Inc. submitted a company inquiry for hiring.', type: 'message', is_read: false },
  ];
  const { error: notifErr } = await supabase.from('notifications').insert(notifications);
  if (notifErr) log(`Notifications error: ${notifErr.message}`);
  else log('Notifications seeded: 6 entries');

  log('Seed complete!');
  return true;
}
