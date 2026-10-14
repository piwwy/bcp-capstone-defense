import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  X, Users, Search, Mail, Linkedin, Sparkles, PlusCircle, 
  Loader2, CheckCircle2, Briefcase, Award, ExternalLink
} from 'lucide-react';

interface AlumniMentorshipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface AlumniMentorItem {
  id: string;
  user_id?: string;
  full_name: string;
  job_title: string;
  company?: string;
  expertise: string;
  contact_email: string;
  linkedin_url?: string;
  is_approved: boolean;
  created_at?: string;
}

const EXPERTISE_FILTERS = [
  'All',
  'Software & IT',
  'Business & Management',
  'Finance & Accounting',
  'HR & Talent Acquisition',
  'Marketing & Design',
  'Career & Interview Prep'
];

const INITIAL_DEMO_MENTORS: AlumniMentorItem[] = [
  {
    id: 'demo-1',
    full_name: 'Engr. Ronald Gutierrez',
    job_title: 'Senior Software Engineer',
    company: 'Accenture Philippines',
    expertise: 'Web Development, Cloud Computing, System Design',
    contact_email: 'ronald.gutierrez@alumni.bcp.edu.ph',
    linkedin_url: 'https://linkedin.com',
    is_approved: true
  },
  {
    id: 'demo-2',
    full_name: 'Maria Santos, CPA',
    job_title: 'Financial Audit Specialist',
    company: 'SGV & Co.',
    expertise: 'Auditing, Corporate Finance, Career Advice',
    contact_email: 'maria.santos@alumni.bcp.edu.ph',
    linkedin_url: 'https://linkedin.com',
    is_approved: true
  },
  {
    id: 'demo-3',
    full_name: 'Mark Alvin Bautista',
    job_title: 'HR Operations Manager',
    company: 'Teleperformance',
    expertise: 'Talent Acquisition, Resume Review, Interview Coaching',
    contact_email: 'mark.bautista@alumni.bcp.edu.ph',
    linkedin_url: 'https://linkedin.com',
    is_approved: true
  },
  {
    id: 'demo-4',
    full_name: 'Patricia Ann Gomez',
    job_title: 'Product Marketing Lead',
    company: 'Shopee Philippines',
    expertise: 'Digital Marketing, Brand Strategy, E-Commerce Growth',
    contact_email: 'patricia.gomez@alumni.bcp.edu.ph',
    linkedin_url: 'https://linkedin.com',
    is_approved: true
  }
];

const AlumniMentorshipModal: React.FC<AlumniMentorshipModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'find' | 'become'>('find');
  const [mentors, setMentors] = useState<AlumniMentorItem[]>(INITIAL_DEMO_MENTORS);
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Become a mentor form state
  const [submitting, setSubmitting] = useState(false);
  const [fullName, setFullName] = useState(user?.name || '');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [expertise, setExpertise] = useState('');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [linkedinUrl, setLinkedinUrl] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    fetchMentors();
  }, [isOpen]);

  const fetchMentors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('alumni_mentors')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Could not fetch mentors from db, using fallback demo list:', error.message);
        setMentors(INITIAL_DEMO_MENTORS);
      } else if (data && data.length > 0) {
        setMentors(data as AlumniMentorItem[]);
      } else {
        setMentors(INITIAL_DEMO_MENTORS);
      }
    } catch {
      setMentors(INITIAL_DEMO_MENTORS);
    } finally {
      setLoading(false);
    }
  };

  const handleBecomeMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !jobTitle.trim() || !expertise.trim() || !contactEmail.trim()) {
      showToast({
        title: 'Missing Fields',
        message: 'Please fill in all required fields.',
        type: 'warning'
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        user_id: user?.id,
        full_name: fullName.trim(),
        job_title: jobTitle.trim(),
        company: company.trim() || null,
        expertise: expertise.trim(),
        contact_email: contactEmail.trim(),
        linkedin_url: linkedinUrl.trim() || null,
        is_approved: true
      };

      const { data, error } = await supabase
        .from('alumni_mentors')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      showToast({
        title: 'Mentor Profile Registered!',
        message: 'Thank you for giving back! Your mentorship listing is now live in the network.',
        type: 'success'
      });

      if (data) {
        setMentors(prev => [data as AlumniMentorItem, ...prev]);
      } else {
        fetchMentors();
      }

      setActiveTab('find');
    } catch (err: any) {
      console.error('Error becoming a mentor:', err);
      showToast({
        title: 'Registration Error',
        message: err.message || 'Unable to register as a mentor right now.',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const filteredMentors = mentors.filter((m) => {
    const matchesSearch =
      m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.company && m.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      m.expertise.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedFilter === 'All') return matchesSearch;

    const expertiseLower = m.expertise.toLowerCase();
    const filterLower = selectedFilter.toLowerCase();
    const matchesFilter = filterLower.split('&').some(term => expertiseLower.includes(term.trim()));

    return matchesSearch && (matchesFilter || expertiseLower.includes(filterLower.replace('all', '')));
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-amber-600 to-orange-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight">BCP Alumni Mentorship Network</h3>
              <p className="text-xs text-amber-100 mt-0.5">Connect with experienced alumni leaders & guide future graduates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50 dark:bg-slate-950/40">
          <button
            type="button"
            onClick={() => setActiveTab('find')}
            className={`py-3.5 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'find'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Search className="w-4 h-4" /> Find a Mentor ({filteredMentors.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('become')}
            className={`py-3.5 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'become'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <PlusCircle className="w-4 h-4" /> Become a Mentor
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'find' ? (
            <div className="space-y-5">
              {/* Search & Filter Bar */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search mentors by name, role, company, or domain..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-white"
                  />
                </div>

                {/* Filter tags */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                  {EXPERTISE_FILTERS.map((f) => (
                    <button
                      key={f}
                      onClick={() => setSelectedFilter(f)}
                      className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all ${
                        selectedFilter === f
                          ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mentors Grid */}
              {loading ? (
                <div className="flex justify-center items-center py-12 text-slate-400">
                  <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
                </div>
              ) : filteredMentors.length === 0 ? (
                <div className="text-center py-12 px-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <Users className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 text-base">No Mentors Found</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    Try adjusting your search criteria or volunteer to be the first mentor in this category!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredMentors.map((mentor) => (
                    <div
                      key={mentor.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100/90 dark:hover:bg-slate-800/90 transition-all flex flex-col justify-between group shadow-sm"
                    >
                      <div>
                        <div className="flex items-start gap-3.5 mb-3">
                          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 flex items-center justify-center font-black text-lg flex-shrink-0 shadow-sm">
                            {mentor.full_name.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight truncate">
                              {mentor.full_name}
                            </h4>
                            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 truncate mt-0.5">
                              {mentor.job_title}
                            </p>
                            {mentor.company && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                                <Briefcase className="w-3 h-3 flex-shrink-0" /> {mentor.company}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Expertise Pills */}
                        <div className="mb-4">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                            Focus Areas
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {mentor.expertise.split(',').map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                              >
                                {skill.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Reach out CTA buttons */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
                        <a
                          href={`mailto:${mentor.contact_email}?subject=BCP%20Alumni%20Mentorship%20Inquiry`}
                          className="flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-amber-600/20 transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5" /> Email Mentor
                        </a>
                        {mentor.linkedin_url && (
                          <a
                            href={mentor.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
                            title="LinkedIn Profile"
                          >
                            <Linkedin className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleBecomeMentor} className="space-y-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex items-start gap-3">
                <Award className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                  Join fellow Bestlink alumni who are mentoring students and recent graduates with resume tips, career coaching, and industry connections.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Maria Santos, CPA"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Current Job Title / Role *
                  </label>
                  <input
                    type="text"
                    required
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Lead QA Engineer"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Company / Employer
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Accenture / Freelance"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="e.g. mentor@gmail.com"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Core Skills & Expertise (Comma-separated) *
                </label>
                <input
                  type="text"
                  required
                  value={expertise}
                  onChange={(e) => setExpertise(e.target.value)}
                  placeholder="e.g. React, Node.js, Cloud Architecture, Interview Prep, Resume Review"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  LinkedIn Profile URL (Optional)
                </label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md shadow-amber-600/30 flex items-center gap-2 disabled:opacity-50 transition-all"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Registering...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Join as Mentor
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlumniMentorshipModal;
