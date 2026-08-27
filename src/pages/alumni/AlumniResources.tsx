import { useEffect, useState } from 'react';
import { FileText, Download, BookOpen, GraduationCap, Loader2, File, Image, ExternalLink, Briefcase, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';
import PageTransition from '../../components/ui/PageTransition';
import { useToast } from '../../context/ToastContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
   const { showToast } = useToast();
   const [resources, setResources] = useState<Resource[]>([]);
   const [loading, setLoading] = useState(true);
   const [exporting, setExporting] = useState(false);
   const [updating, setUpdating] = useState(false);

   const [profileData, setProfileData] = useState<any>(null);
   const [editMode, setEditMode] = useState(false);
   const [newBatch, setNewBatch] = useState('');
   const [newCourse, setNewCourse] = useState('');

   useEffect(() => {
      const fetchData = async () => {
         try {
            setLoading(true);
            const { data: resData } = await supabase
               .from('alumni_resources')
               .select('*')
               .eq('status', 'published')
               .not('file_url', 'is', null)
               .order('created_at', { ascending: false });

            // Additional check for empty strings
            const validResources = (resData || []).filter(r => r.file_url && r.file_url.trim() !== '');
            setResources(validResources);

            if (user?.id) {
               const { data: pData } = await supabase
                  .from('profiles')
                  .select('first_name, last_name, batch_year, course, avatar_url')
                  .eq('id', user.id)
                  .single();
               setProfileData(pData);
               if (pData) {
                  setNewBatch(pData.batch_year || '');
                  setNewCourse(pData.course || '');
               }
            }
         } catch (err) {
            console.error('Error:', err);
         } finally {
            setLoading(false);
         }
      };
      fetchData();
   }, [user]);

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

   const handleDownloadID = async () => {
      const idElement = document.getElementById('digital-id-card');
      if (!idElement || !profileData) return;

      setExporting(true);
      try {
         const canvas = await html2canvas(idElement, {
            scale: 3,
            useCORS: true,
            backgroundColor: null,
         });

         const imgData = canvas.toDataURL('image/png');
         const pdf = new jsPDF('l', 'mm', [canvas.width * 0.264583, canvas.height * 0.264583]);
         pdf.addImage(imgData, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());

         const fileName = `LCP_AlumniID_${profileData.first_name}_${profileData.last_name}.pdf`.replace(/\s+/g, '_');
         pdf.save(fileName);
         showToast({ title: 'Success', message: 'Digital ID saved as PDF.', type: 'success' });
      } catch (err) {
         console.error('PDF Export Error:', err);
         showToast({ title: 'Export Failed', message: 'Could not generate PDF ID.', type: 'error' });
      } finally {
         setExporting(false);
      }
   };

   const handleUpdateProfile = async () => {
      if (!user?.id || !newBatch || !newCourse) return;
      setUpdating(true);
      try {
         const { error } = await supabase
            .from('profiles')
            .update({
               batch_year: newBatch,
               course: newCourse
            })
            .eq('id', user.id);

         if (error) throw error;
         setProfileData({ ...profileData, batch_year: newBatch, course: newCourse });
         setEditMode(false);
         showToast({ title: 'Updated', message: 'Profile details saved for ID.', type: 'success' });
      } catch (err) {
         showToast({ title: 'Update Failed', message: 'Could not save details.', type: 'error' });
      } finally {
         setUpdating(false);
      }
   };

   const ResourceSkeleton = () => (
      <div className="grid grid-cols-2 gap-4">
         {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100 animate-pulse">
               <div className="w-8 h-8 bg-slate-200 rounded-lg mx-auto mb-3" />
               <div className="h-3 bg-slate-200 rounded w-3/4 mx-auto mb-2" />
               <div className="h-2 bg-slate-100 rounded w-1/2 mx-auto" />
            </div>
         ))}
      </div>
   );

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
                        <div className="p-3 bg-red-100 rounded-xl"><GraduationCap className="w-6 h-6 text-red-600" /></div>
                        <div>
                           <h3 className="text-xl font-black text-slate-900 tracking-tight">Career Guides</h3>
                           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Downloadable Files</p>
                        </div>
                     </div>
                     {loading ? (
                        <ResourceSkeleton />
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
                        <div className="p-3 bg-emerald-100 rounded-xl"><Briefcase className="w-6 h-6 text-emerald-600" /></div>
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
                           <div className="p-3 bg-blue-100 rounded-xl"><BookOpen className="w-6 h-6 text-blue-600" /></div>
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
                  <div id="digital-id-card" className="bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden group min-h-[280px]">
                     <div className="absolute inset-0 bg-white/5 rounded-[2rem]" />
                     <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
                     <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl -ml-12 -mb-12" />

                     <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                           <img src="/images/bcplogo.png" alt="Logo" className="w-12 h-12 opacity-80 object-contain" />
                           <span className="bg-white/10 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border border-white/20 backdrop-blur-sm">Alumni ID</span>
                        </div>

                        <div className="flex items-end gap-5 mb-8">
                           <div className="w-24 h-24 bg-white/20 rounded-2xl overflow-hidden border-4 border-white/20 shadow-lg flex-shrink-0">
                              <img
                                 src={profileData?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData?.first_name || 'Alumni')}&background=0D8ABC&color=fff`}
                                 className="w-full h-full object-cover"
                                 alt="Profile"
                                 crossOrigin="anonymous"
                              />
                           </div>
                           <div className="min-w-0 flex-1">
                              <h2 className="text-2xl font-black tracking-wide leading-tight truncate">
                                 {profileData ? `${profileData.first_name} ${profileData.last_name}` : (user?.name || 'ALUMNI NAME')}
                              </h2>
                              <p className="text-sm text-blue-200 font-medium">ID: {user?.id?.slice(0, 8).toUpperCase() || '2026-0001'}</p>
                              <p className="text-xs text-blue-300 mt-1 truncate">
                                 Batch {profileData?.batch_year || '---'} • {profileData?.course || 'Not Specified'}
                              </p>
                           </div>
                        </div>

                        <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                           <p className="text-[10px] text-blue-300 font-bold uppercase tracking-widest">Valid Lifetime Membership</p>
                           {!editMode && (!profileData?.batch_year || !profileData?.course) && (
                              <button onClick={() => setEditMode(true)} className="text-[10px] font-black underline text-blue-400 hover:text-white transition-colors">Complete Details</button>
                           )}
                        </div>
                     </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="flex flex-col gap-3">
                     <button
                        onClick={handleDownloadID}
                        disabled={exporting}
                        className="flex items-center justify-center gap-2 bg-slate-900 text-white p-4 rounded-2xl font-black hover:bg-slate-800 shadow-xl transition-all active:scale-95 disabled:opacity-50"
                     >
                        {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                        {exporting ? 'Generating PDF...' : 'Download Alumni ID'}
                     </button>

                     {editMode && (
                        <div className="bg-white p-6 rounded-[2rem] border-2 border-blue-100 shadow-lg space-y-4 animate-in slide-in-from-bottom-5">
                           <div className="flex justify-between items-center">
                              <h4 className="font-black text-slate-800 text-sm">ID Details Setup</h4>
                              <button onClick={() => setEditMode(false)}><X className="w-4 h-4 text-slate-400" /></button>
                           </div>
                           <div className="grid grid-cols-2 gap-3">
                              <input
                                 type="text"
                                 placeholder="Batch Year"
                                 value={newBatch}
                                 onChange={e => setNewBatch(e.target.value)}
                                 className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold border-none focus:ring-2 focus:ring-blue-200"
                              />
                              <input
                                 type="text"
                                 placeholder="Course"
                                 value={newCourse}
                                 onChange={e => setNewCourse(e.target.value)}
                                 className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold border-none focus:ring-2 focus:ring-blue-200"
                              />
                           </div>
                           <button
                              onClick={handleUpdateProfile}
                              disabled={updating || !newBatch || !newCourse}
                              className="w-full py-3 bg-blue-600 text-white rounded-xl font-black text-xs hover:bg-blue-700 disabled:opacity-50"
                           >
                              {updating ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Apply to ID'}
                           </button>
                        </div>
                     )}
                  </div>

               </div>
            </div>
         </div>
      </PageTransition>
   );
};

export default AlumniResources;