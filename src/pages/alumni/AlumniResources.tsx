import React, { useEffect, useState } from 'react';
import { FileText, Download, BookOpen, GraduationCap, Loader2, File, Image, ExternalLink, Briefcase } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';
import PageTransition from '../../components/ui/PageTransition';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

const AlumniResources = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const { data, error } = await supabase
          .from('alumni_resources')
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setResources(data || []);
      } catch (err) {
        console.error('Error fetching resources:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, []);

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    if (type?.includes('image')) return <Image className="w-8 h-8 text-pink-500" />;
    if (type?.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
    return <File className="w-8 h-8 text-blue-500" />;
  };

  const careerGuides = resources.filter(r => r.category === 'Career Guides');
  const otherResources = resources.filter(r => r.category !== 'Career Guides');

  return (
    <PageTransition>
    <div className="space-y-8">

       {/* Hero Banner */}
       <div className="relative h-[200px] rounded-[2.5rem] bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 overflow-hidden shadow-2xl flex items-center px-10">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-white/5 rounded-full -mb-24" />
          <div className="absolute top-1/2 right-20 w-32 h-32 bg-white/5 rounded-full -mt-16" />
          <div className="relative z-10">
             <div className="flex items-center gap-2 mb-3">
                <span className="bg-white/10 border border-white/20 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Resources</span>
             </div>
             <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Alumni Resources</h1>
             <p className="text-blue-100 text-sm font-medium max-w-md">Access your digital ID, download career guides, and browse resources shared by the alumni office.</p>
          </div>
          <BookOpen className="absolute right-12 bottom-6 w-28 h-28 text-white/5" strokeWidth={1} />
       </div>

       <div className="grid md:grid-cols-2 gap-8">

       {/* Left Column: Career Guides & Other Resources */}
       <div className="space-y-8">
          {/* Career Guides */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500">
             <div className="flex items-center gap-3 mb-5">
                <div className="p-3 bg-red-100 rounded-xl"><GraduationCap className="w-6 h-6 text-red-600"/></div>
                <div>
                   <h3 className="text-xl font-black text-slate-900 tracking-tight">Career Guides</h3>
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Downloadable Files</p>
                </div>
             </div>
             {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin w-6 h-6 text-blue-500" /></div>
             ) : careerGuides.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No career guides available yet.</p>
             ) : (
                <div className="grid grid-cols-2 gap-4">
                   {careerGuides.map(guide => (
                      <a key={guide.id} href={guide.file_url} target="_blank" rel="noopener noreferrer" className="group p-5 rounded-[1.5rem] border border-slate-100 text-center hover:border-blue-200 hover:shadow-lg transition-all duration-500 cursor-pointer block">
                         {getFileIcon(guide.file_type)}
                         <p className="text-xs font-black text-slate-700 mb-1 mt-3 line-clamp-2">{guide.title}</p>
                         <span className="px-2 py-0.5 bg-slate-100 rounded-full text-[10px] font-black text-slate-400">
                            {guide.file_type?.includes('pdf') ? 'PDF' : 'FILE'} {formatFileSize(guide.file_size) ? `• ${formatFileSize(guide.file_size)}` : ''}
                         </span>
                      </a>
                   ))}
                </div>
             )}
          </div>

          {/* Post-Grad Career Links */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500">
             <div className="flex items-center gap-3 mb-5">
                <div className="p-3 bg-emerald-100 rounded-xl"><Briefcase className="w-6 h-6 text-emerald-600"/></div>
                <div>
                   <h3 className="text-xl font-black text-slate-900 tracking-tight">Post-Grad Career Links</h3>
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Explore Opportunities</p>
                </div>
             </div>
             <div className="space-y-2">
                {[
                   { name: 'LinkedIn', url: 'https://www.linkedin.com/jobs/', desc: 'Professional networking & job search', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: '💼' },
                   { name: 'Upwork', url: 'https://www.upwork.com/', desc: 'Freelance & remote work opportunities', color: 'bg-green-50 text-green-600 border-green-100', icon: '🌐' },
                   { name: 'Indeed Philippines', url: 'https://ph.indeed.com/', desc: 'Job listings across all industries', color: 'bg-indigo-50 text-indigo-600 border-indigo-100', icon: '🔍' },
                   { name: 'JobStreet', url: 'https://www.jobstreet.com.ph/', desc: 'Top PH job board for fresh grads', color: 'bg-purple-50 text-purple-600 border-purple-100', icon: '📋' },
                   { name: 'OnlineJobs.ph', url: 'https://www.onlinejobs.ph/', desc: 'Remote jobs for Filipino professionals', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: '🏠' },
                   { name: 'Coursera', url: 'https://www.coursera.org/', desc: 'Free & paid online certifications', color: 'bg-cyan-50 text-cyan-600 border-cyan-100', icon: '🎓' },
                   { name: 'Google Certificates', url: 'https://grow.google/certificates/', desc: 'Industry-recognized Google certs', color: 'bg-red-50 text-red-600 border-red-100', icon: '📜' },
                   { name: 'Civil Service Exam', url: 'https://www.csc.gov.ph/', desc: 'Government career eligibility', color: 'bg-slate-50 text-slate-600 border-slate-100', icon: '🏛️' },
                ].map(link => (
                   <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${link.color}`}>
                      <span className="text-lg">{link.icon}</span>
                      <div className="flex-1 min-w-0">
                         <p className="text-xs font-black">{link.name}</p>
                         <p className="text-[10px] opacity-70 truncate">{link.desc}</p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />
                   </a>
                ))}
             </div>
          </div>

          {/* Other Resources */}
          {otherResources.length > 0 && (
             <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500">
                <div className="flex items-center gap-3 mb-5">
                   <div className="p-3 bg-blue-100 rounded-xl"><BookOpen className="w-6 h-6 text-blue-600"/></div>
                   <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">Other Resources</h3>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">From Alumni Office</p>
                   </div>
                </div>
                <div className="space-y-3">
                   {otherResources.map(res => (
                      <a key={res.id} href={res.file_url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all duration-300">
                         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                            {getFileIcon(res.file_type)}
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="font-black text-slate-700 text-sm truncate">{res.title}</p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                               <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{res.category}</span>
                               <span>{formatFileSize(res.file_size)}</span>
                            </div>
                         </div>
                         <Download className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-all flex-shrink-0" />
                      </a>
                   ))}
                </div>
             </div>
          )}
       </div>

       {/* Right Column: Digital ID */}
       <div className="space-y-8">

          {/* DIGITAL ID CARD (Glassmorphism) */}
          <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden group">
             <div className="absolute inset-0 bg-white/5 rounded-[2rem]" />
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
             <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl -ml-12 -mb-12" />

             <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                   <img src="/images/Linker College Of The Philippines.png" alt="Logo" className="w-12 h-12 opacity-80"/>
                   <span className="bg-white/10 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border border-white/20 backdrop-blur-sm">Alumni ID</span>
                </div>

                <div className="flex items-end gap-5 mb-8">
                   <div className="w-24 h-24 bg-white/20 rounded-2xl overflow-hidden border-4 border-white/20 shadow-lg">
                      <img src={`https://ui-avatars.com/api/?name=${user?.name || 'Alumni'}&background=random`} className="w-full h-full object-cover"/>
                   </div>
                   <div>
                      <h2 className="text-2xl font-black tracking-wide">{user?.name || 'ALUMNI NAME'}</h2>
                      <p className="text-sm text-blue-200 font-medium">ID: {user?.id?.slice(0,8).toUpperCase() || '2026-0001'}</p>
                      <p className="text-xs text-blue-300 mt-1">Batch 2026 • BS Information Technology</p>
                   </div>
                </div>

                <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                   <p className="text-[10px] text-blue-300 font-bold uppercase tracking-widest">Valid Lifetime Membership</p>
                   <button className="flex items-center gap-2 bg-white/90 backdrop-blur text-blue-900 px-5 py-2.5 rounded-2xl text-xs font-black hover:bg-white hover:shadow-lg transition-all">
                      <Download className="w-3.5 h-3.5"/> Download ID
                   </button>
                </div>
             </div>
          </div>

       </div>
       </div>
    </div>
    </PageTransition>
  );
};

export default AlumniResources;