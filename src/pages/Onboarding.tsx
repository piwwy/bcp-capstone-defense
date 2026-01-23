import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { 
  BookOpen, GraduationCap, Users,
  UserCheck, ShieldCheck, LogOut, RefreshCw, X, Check, Lock 
} from 'lucide-react';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Preview Name State (Para sa Card display)
  const [previewName, setPreviewName] = useState('');

  // Form Data
  const [formData, setFormData] = useState({
    course: '',
    batchYear: '',
    studentId: '',
    adviserName: '',
    section: '',
    isNameCorrect: true, 
    officialFirstName: '',
    officialMiddleName: '',
    officialLastName: '',
    officialSuffix: '' 
  });

  // Check Session
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/register'); 
      } else {
        setUser(user);
        
        // Initial setup
        const fullName = user.user_metadata.full_name || '';
        setPreviewName(fullName);

        const nameParts = fullName.split(' ');
        setFormData(prev => ({
          ...prev,
          officialFirstName: nameParts[0] || '',
          officialLastName: nameParts.slice(1).join(' ') || ''
        }));
      }
    };
    getUser();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Strict Input Validation
    if (['officialFirstName', 'officialMiddleName', 'officialLastName', 'officialSuffix', 'adviserName'].includes(name)) {
      if (value !== '' && !/^[a-zA-Z\s.-]*$/.test(value)) return; 
    }
    if (['studentId', 'section'].includes(name)) {
      if (value !== '' && !/^[0-9-]*$/.test(value)) return; 
    }
    setFormData({ ...formData, [name]: value });
  };

  // Function para i-update ang Preview Card manually
  const handleUpdatePreview = () => {
    const { officialFirstName, officialMiddleName, officialLastName, officialSuffix } = formData;
    const constructedName = `${officialFirstName} ${officialMiddleName} ${officialLastName} ${officialSuffix}`.replace(/\s+/g, ' ').trim();
    setPreviewName(constructedName);
  };

  const handleCancelEdit = () => {
    setFormData(prev => ({ ...prev, isNameCorrect: true }));
    setPreviewName(user.user_metadata.full_name); // Reset to Google Name
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!user) return;

    try {
      const combinedVerification = `Adviser: ${formData.adviserName} | Section: ${formData.section}`;

      const profileData = {
        id: user.id,
        first_name: formData.isNameCorrect ? user.user_metadata.full_name?.split(' ')[0] : formData.officialFirstName,
        last_name: formData.isNameCorrect ? user.user_metadata.full_name?.split(' ').slice(1).join(' ') : formData.officialLastName,
        middle_name: formData.officialMiddleName || null,
        email: user.email,
        batch_year: formData.batchYear,
        course: formData.course,
        student_id: formData.studentId || null,
        verification_answer: combinedVerification, 
        role: 'alumni',
        status: 'pending_approval',
        avatar_url: user.user_metadata.avatar_url 
      };

      const { error } = await supabase.from('profiles').upsert([profileData]); 
      if (error) throw error;
      navigate('/pending-approval');

    } catch (error: any) {
      console.error("Onboarding Error:", error);
      alert("Error saving profile: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (!user) return null; 

  const userImage = user.user_metadata.avatar_url || `https://ui-avatars.com/api/?name=${user.email}&background=0D8ABC&color=fff`;

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col relative">
        
        {/* --- BLUE HEADER --- */}
        <div className="relative h-44 bg-gradient-to-r from-blue-900 to-blue-800 overflow-hidden">
           {/* Subtle Patterns */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-16 blur-2xl" />
           
           {/* Top Row: Logo & Logout */}
           <div className="relative z-10 flex justify-between items-start p-6">
             <div className="flex items-center gap-2 text-white/90">
                <img src="/images/Linker College Of The Philippines.png" alt="Logo" className="w-8 h-8 object-contain" />
                <span className="font-bold tracking-wide text-xs uppercase opacity-90">LCP Alumni</span>
             </div>
             <button onClick={handleLogout} className="text-white/70 hover:text-white flex items-center gap-1.5 text-xs transition-colors hover:bg-white/10 px-3 py-1.5 rounded-full">
               <LogOut className="w-3.5 h-3.5" /> Sign Out
             </button>
           </div>
        </div>

        {/* --- PROFILE SECTION (Fixed Alignment) --- */}
        <div className="relative px-8 flex items-end gap-5 -mt-16 mb-8">
           {/* Profile Picture */}
           <div className="w-28 h-28 rounded-full border-[5px] border-white shadow-xl overflow-hidden bg-white z-10 flex-shrink-0">
              <img src={userImage} alt="User" className="w-full h-full object-cover" />
           </div>

           {/* Name & Greeting (Adjusted to avoid overflow) */}
           <div className="pb-1 z-10 flex-1 flex flex-col justify-end h-28 min-w-0">
             <h1 className="text-2xl font-bold text-gray-900 leading-tight truncate">
               Hi, {user.user_metadata.full_name?.split(' ')[0]}!
             </h1>
             <p className="text-gray-500 text-sm mt-0.5 truncate">Please finalize your alumni details.</p>
           </div>
        </div>

        {/* --- FORM BODY --- */}
        <div className="px-8 pb-4">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* 1. Name Verification Card */}
            <div className={`border rounded-xl p-6 shadow-sm relative overflow-hidden transition-all duration-300 ${!formData.isNameCorrect ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200 bg-white'}`}>
               
               {/* Question Header */}
               <div className="flex items-start gap-3 mb-5">
                 <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                    <UserCheck className="w-5 h-5" />
                 </div>
                 <div>
                   <h3 className="text-sm font-bold text-gray-900">Name Verification</h3>
                   <p className="text-xs text-gray-500 mt-1">
                     Does this name match your school records?
                   </p>
                 </div>
               </div>

               {/* PREVIEW CARD (Updates dynamically) */}
               <div className="flex items-center gap-4 p-4 rounded-xl border bg-white border-gray-200 shadow-sm mb-6">
                  <img src={userImage} className="w-10 h-10 rounded-full border border-gray-100" alt="Profile" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Profile Name Preview</p>
                    <p className="font-bold text-gray-800 truncate text-lg">{previewName}</p>
                  </div>
                  <div className="text-blue-600"><ShieldCheck className="w-5 h-5" /></div>
               </div>

               {/* Radio Options (Fixed Selection Color) */}
               {formData.isNameCorrect ? (
                 <div className="flex gap-6 pl-1 animate-in fade-in">
                    <label className="flex items-center gap-2 text-sm cursor-pointer group">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${formData.isNameCorrect ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                        {formData.isNameCorrect && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <input 
                        type="radio" 
                        name="isNameCorrect" 
                        checked={formData.isNameCorrect} 
                        onChange={() => setFormData({...formData, isNameCorrect: true})}
                        className="sr-only"
                      />
                      <span className="font-medium text-gray-700">Yes, it matches</span>
                    </label>

                    <label className="flex items-center gap-2 text-sm cursor-pointer group">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${!formData.isNameCorrect ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                        {!formData.isNameCorrect && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <input 
                        type="radio" 
                        name="isNameCorrect" 
                        checked={!formData.isNameCorrect} 
                        onChange={() => setFormData({...formData, isNameCorrect: false})}
                        className="sr-only"
                      />
                      <span className="font-medium text-gray-700 group-hover:text-blue-600">No, I'll edit it</span>
                    </label>
                 </div>
               ) : (
                 /* EDIT MODE AREA */
                 <div className="animate-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                       <div className="space-y-1">
                         <span className="text-[10px] uppercase font-bold text-gray-400 pl-1">First Name</span>
                         <input type="text" name="officialFirstName" value={formData.officialFirstName} onChange={handleChange} className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
                       </div>
                       <div className="space-y-1">
                         <span className="text-[10px] uppercase font-bold text-gray-400 pl-1">Middle Name</span>
                         <input type="text" name="officialMiddleName" value={formData.officialMiddleName} onChange={handleChange} className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                       </div>
                       <div className="space-y-1">
                         <span className="text-[10px] uppercase font-bold text-gray-400 pl-1">Last Name</span>
                         <input type="text" name="officialLastName" value={formData.officialLastName} onChange={handleChange} className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
                       </div>
                       <div className="space-y-1">
                         <span className="text-[10px] uppercase font-bold text-gray-400 pl-1">Suffix</span>
                         <input type="text" name="officialSuffix" value={formData.officialSuffix} onChange={handleChange} className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Jr" />
                       </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button 
                        type="button" 
                        onClick={handleUpdatePreview}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Update Preview
                      </button>
                      <button 
                        type="button" 
                        onClick={handleCancelEdit}
                        className="flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                    </div>
                 </div>
               )}
            </div>

            {/* 2. Academic Info */}
            <div className="grid md:grid-cols-2 gap-5">
               <div className="space-y-2">
                 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                   <GraduationCap className="w-4 h-4" /> Course <span className="text-red-500">*</span>
                 </label>
                 <select name="course" value={formData.course} onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 bg-white">
                    <option value="">Select Course</option>
                    <option value="BSIT">BS Information Technology</option>
                    <option value="BSCS">BS Computer Science</option>
                    <option value="BSBA">BS Business Administration</option>
                    <option value="BSED">Bachelor of Secondary Education</option>
                 </select>
               </div>

               <div className="space-y-2">
                 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                   <BookOpen className="w-4 h-4" /> Year Graduated <span className="text-red-500">*</span>
                 </label>
                  <select name="batchYear" value={formData.batchYear} onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 bg-white">
                      <option value="">Select Year</option>
                      {Array.from({length: 30}, (_, i) => (
                        <option key={i} value={2025 - i}>{2025 - i}</option>
                      ))}
                  </select>
               </div>
            </div>

            {/* 3. Challenge Question */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4" /> Security Check <span className="text-red-500">*</span>
              </label>
              
              <div className="grid md:grid-cols-2 gap-4">
                 <div className="relative">
                    <input type="text" name="adviserName" placeholder="Thesis Adviser Name" value={formData.adviserName} onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600" />
                    <p className="text-[10px] text-gray-400 absolute -bottom-5 left-1">Ex: Sir Pontillas (Letters only)</p>
                 </div>
                 <div className="relative">
                    <input type="text" name="section" placeholder="Section Number" value={formData.section} onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600" />
                    <p className="text-[10px] text-gray-400 absolute -bottom-5 left-1">Ex: 4101 (Numbers only)</p>
                 </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-700 to-blue-900 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-blue-900/30 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Complete Profile'} <Check className="w-5 h-5" />
              </button>
            </div>
            
          </form>
        </div>

        {/* --- FOOTER: DPA 2012 --- */}
        <div className="bg-slate-50 border-t border-slate-200 p-6 text-center">
           <div className="flex items-center justify-center gap-2 text-gray-400 mb-2">
              <Lock className="w-3 h-3" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Data Privacy Protected</span>
           </div>
           <p className="text-[10px] text-gray-500 leading-relaxed max-w-md mx-auto">
             By proceeding, you agree to the collection and processing of your personal data in compliance with the 
             <strong> Data Privacy Act of 2012 (RA 10173)</strong> for alumni verification and school record purposes only.
           </p>
        </div>

      </div>
    </div>
  );
};

export default Onboarding;