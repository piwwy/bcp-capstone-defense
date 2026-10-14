import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../../context/ToastContext';
import { logAudit, AUDIT_ACTIONS } from '../../services/auditLogger';
import AdminPageLayout from './AdminPageLayout';
import { 
  Users, Search, Loader2, Plus, CheckCircle2, XCircle, 
  Trash2, Mail, Linkedin, Briefcase, Award, X, Save
} from 'lucide-react';

interface MentorRecord {
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

const INITIAL_DEMO_MENTORS: MentorRecord[] = [
  {
    id: 'demo-1',
    full_name: 'Engr. Ronald Gutierrez',
    job_title: 'Senior Software Engineer',
    company: 'Accenture Philippines',
    expertise: 'Web Development, Cloud Computing, System Design',
    contact_email: 'ronald.gutierrez@alumni.bcp.edu.ph',
    linkedin_url: 'https://linkedin.com',
    is_approved: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'demo-2',
    full_name: 'Maria Santos, CPA',
    job_title: 'Financial Audit Specialist',
    company: 'SGV & Co.',
    expertise: 'Auditing, Corporate Finance, Career Advice',
    contact_email: 'maria.santos@alumni.bcp.edu.ph',
    linkedin_url: 'https://linkedin.com',
    is_approved: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'demo-3',
    full_name: 'Mark Alvin Bautista',
    job_title: 'HR Operations Manager',
    company: 'Teleperformance',
    expertise: 'Talent Acquisition, Resume Review, Interview Coaching',
    contact_email: 'mark.bautista@alumni.bcp.edu.ph',
    linkedin_url: 'https://linkedin.com',
    is_approved: true,
    created_at: new Date().toISOString()
  }
];

const ManageMentorship: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [mentors, setMentors] = useState<MentorRecord[]>(INITIAL_DEMO_MENTORS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending'>('all');

  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [expertise, setExpertise] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMentors();
  }, []);

  const fetchMentors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('alumni_mentors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Could not fetch mentors:', error.message);
        setMentors(INITIAL_DEMO_MENTORS);
      } else if (data && data.length > 0) {
        setMentors(data as MentorRecord[]);
      } else {
        setMentors(INITIAL_DEMO_MENTORS);
      }
    } catch {
      setMentors(INITIAL_DEMO_MENTORS);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleApproval = async (mentor: MentorRecord) => {
    const nextStatus = !mentor.is_approved;
    try {
      const { error } = await supabase
        .from('alumni_mentors')
        .update({ is_approved: nextStatus })
        .eq('id', mentor.id);

      if (error) throw error;

      await logAudit({
        action: AUDIT_ACTIONS.UPDATE,
        module: 'Alumni Mentorship',
        details: `${nextStatus ? 'Approved' : 'Deactivated'} mentor listing for ${mentor.full_name}`,
      }).catch(() => {});

      showToast({
        title: 'Status Updated',
        message: `${mentor.full_name} is now ${nextStatus ? 'approved and visible' : 'hidden from public view'}.`,
        type: 'success',
      });

      setMentors(prev =>
        prev.map(m => (m.id === mentor.id ? { ...m, is_approved: nextStatus } : m))
      );
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message || 'Could not update status.', type: 'error' });
    }
  };

  const handleDeleteMentor = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from the Mentorship Directory?`)) return;

    try {
      const { error } = await supabase.from('alumni_mentors').delete().eq('id', id);
      if (error) throw error;

      showToast({ title: 'Deleted', message: 'Mentor profile has been removed.', type: 'info' });
      setMentors(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      showToast({ title: 'Delete Failed', message: err.message, type: 'error' });
    }
  };

  const handleAddMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !jobTitle.trim() || !expertise.trim() || !contactEmail.trim()) {
      showToast({ title: 'Validation Error', message: 'Please fill in all required fields.', type: 'warning' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        full_name: fullName.trim(),
        job_title: jobTitle.trim(),
        company: company.trim() || null,
        expertise: expertise.trim(),
        contact_email: contactEmail.trim(),
        linkedin_url: linkedinUrl.trim() || null,
        is_approved: true,
      };

      const { data, error } = await supabase
        .from('alumni_mentors')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      showToast({
        title: 'Mentor Added!',
        message: `${fullName} has been added to the Alumni Mentorship Directory.`,
        type: 'success',
      });

      if (data) {
        setMentors(prev => [data as MentorRecord, ...prev]);
      } else {
        fetchMentors();
      }

      // Reset
      setFullName('');
      setJobTitle('');
      setCompany('');
      setExpertise('');
      setContactEmail('');
      setLinkedinUrl('');
      setShowAddModal(false);
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message || 'Could not add mentor.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const filteredMentors = useMemo(() => {
    return mentors.filter(m => {
      const matchesSearch =
        m.full_name.toLowerCase().includes(search.toLowerCase()) ||
        m.job_title.toLowerCase().includes(search.toLowerCase()) ||
        (m.company && m.company.toLowerCase().includes(search.toLowerCase())) ||
        m.expertise.toLowerCase().includes(search.toLowerCase());

      if (statusFilter === 'approved') return matchesSearch && m.is_approved;
      if (statusFilter === 'pending') return matchesSearch && !m.is_approved;
      return matchesSearch;
    });
  }, [mentors, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: mentors.length,
      approved: mentors.filter(m => m.is_approved).length,
      pending: mentors.filter(m => !m.is_approved).length,
    };
  }, [mentors]);

  return (
    <AdminPageLayout
      title="Alumni Mentorship Directory"
      subtitle="Manage registered alumni mentors, coach profiles, and career guidance volunteers"
      icon={Users}
      action={
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-md shadow-amber-600/30 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Featured Mentor
        </button>
      }
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Total Mentors</span>
            <h4 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{stats.total}</h4>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 shadow-sm">
            <span className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-300 tracking-wider">Approved & Live</span>
            <h4 className="text-2xl font-black text-emerald-800 dark:text-emerald-200 mt-1">{stats.approved}</h4>
          </div>
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 shadow-sm">
            <span className="text-xs font-bold uppercase text-amber-700 dark:text-amber-300 tracking-wider">Pending Review</span>
            <h4 className="text-2xl font-black text-amber-800 dark:text-amber-200 mt-1">{stats.pending}</h4>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search mentors by name, role, company, or domain..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            {(['all', 'approved', 'pending'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all capitalize ${
                  statusFilter === st
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Mentors Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Mentor Name & Role</th>
                <th className="py-3.5 px-4">Company</th>
                <th className="py-3.5 px-4">Specialization</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
                    Loading mentor records...
                  </td>
                </tr>
              ) : filteredMentors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No mentors found matching your search.
                  </td>
                </tr>
              ) : (
                filteredMentors.map(mentor => (
                  <tr key={mentor.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-sm border border-amber-300 dark:border-amber-700 flex-shrink-0">
                          {mentor.full_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{mentor.full_name}</div>
                          <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">{mentor.job_title}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {mentor.company || '—'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {mentor.expertise.split(',').slice(0, 3).map((exp, i) => (
                          <span key={i} className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {exp.trim()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <div className="space-y-1">
                        <a href={`mailto:${mentor.contact_email}`} className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {mentor.contact_email}
                        </a>
                        {mentor.linkedin_url && (
                          <a href={mentor.linkedin_url} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-blue-600 flex items-center gap-1">
                            <Linkedin className="w-3 h-3" /> LinkedIn Profile
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {mentor.is_approved ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                          <XCircle className="w-3.5 h-3.5" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleApproval(mentor)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                            mentor.is_approved
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                          }`}
                        >
                          {mentor.is_approved ? 'Hide' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleDeleteMentor(mentor.id, mentor.full_name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Remove Mentor"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Mentor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Add Featured Alumni Mentor</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMentor} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Mentor Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. John Doe, MIT"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Job Title / Role *
                  </label>
                  <input
                    type="text"
                    required
                    value={jobTitle}
                    onChange={e => setJobTitle(e.target.value)}
                    placeholder="e.g. Lead Architect"
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Company / Organization
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    placeholder="e.g. Google / Globe"
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Core Skills / Focus Areas (Comma-separated) *
                </label>
                <input
                  type="text"
                  required
                  value={expertise}
                  onChange={e => setExpertise(e.target.value)}
                  placeholder="e.g. Python, Machine Learning, Resume Review"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                    placeholder="mentor@company.com"
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={e => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md shadow-amber-600/30 flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Mentor Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
};

export default ManageMentorship;
