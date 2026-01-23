import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { 
  BookOpen, GraduationCap, Users,
  AlertCircle, ChevronRight, LogOut 
} from 'lucide-react';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Form Data for Missing Info
  const [formData, setFormData] = useState({
    course: '',
    batchYear: '',
    studentId: '',
    verificationAnswer: '',
    isNameCorrect: true, // Ask if Google name matches School Record
    officialFirstName: '',
    officialLastName: ''
  });

  // Check User Session on Load
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/register'); // Kick out if not logged in
      } else {
        setUser(user);
        // Pre-fill official names from Google data
        setFormData(prev => ({
          ...prev,
          officialFirstName: user.user_metadata.full_name?.split(' ')[0] || '',
          officialLastName: user.user_metadata.full_name?.split(' ').slice(1).join(' ') || ''
        }));
      }
    };
    getUser();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!user) return;

    try {
      // 1. Prepare Profile Data
      const profileData = {
        id: user.id,
        first_name: formData.isNameCorrect ? user.user_metadata.full_name?.split(' ')[0] : formData.officialFirstName,
        last_name: formData.isNameCorrect ? user.user_metadata.full_name?.split(' ').slice(1).join(' ') : formData.officialLastName,
        email: user.email,
        batch_year: formData.batchYear,
        course: formData.course,
        student_id: formData.studentId || null,
        verification_answer: formData.verificationAnswer,
        role: 'alumni',
        status: 'pending_approval', // Need admin/AI approval
        avatar_url: user.user_metadata.avatar_url // Get Google Pic
      };

      // 2. Insert into Supabase Profiles
      const { error } = await supabase
        .from('profiles')
        .upsert([profileData]); // Upsert incase record exists partially

      if (error) throw error;

      // 3. Success Redirect
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

  if (!user) return null; // or a loading spinner

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col relative">
        
        {/* Header Background */}
        <div className="h-32 bg-blue-900 relative overflow-hidden">
           <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500 rounded-full blur-[50px] opacity-50" />
           <div className="absolute top-5 left-5 text-white/80 flex items-center gap-2">
             <img src="/images/Linker College Of The Philippines.png" alt="Logo" className="w-8 h-8 object-contain" />
             <span className="font-bold tracking-wide text-sm">LCP ALUMNI</span>
           </div>
           
           <button onClick={handleLogout} className="absolute top-5 right-5 text-white/60 hover:text-white flex items-center gap-1 text-xs transition-colors">
             <LogOut className="w-4 h-4" /> Sign Out
           </button>
        </div>

        {/* User Avatar (Floating) */}
        <div className="relative px-8 -mt-12 flex justify-between items-end">
           <div className="flex items-end gap-4">
             <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-200">
               {user.user_metadata.avatar_url ? (
                 <img src={user.user_metadata.avatar_url} alt="User" className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-gray-400 text-3xl font-bold">
                   {user.email?.charAt(0).toUpperCase()}
                 </div>
               )}
             </div>
             <div className="mb-3">
               <h2 className="text-2xl font-bold text-gray-900">
                 Hi, {user.user_metadata.full_name?.split(' ')[0]}! 👋
               </h2>
               <p className="text-sm text-gray-500">Let's finish setting up your profile.</p>
             </div>
           </div>
        </div>

        {/* Form Body */}
        <div className="p-8 pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. Name Verification */}
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl space-y-3">
               <div className="flex items-start gap-3">
                 <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                 <div>
                   <label className="text-sm font-semibold text-gray-800">Is this your name in school records?</label>
                   <p className="text-xs text-gray-500">{user.user_metadata.full_name}</p>
                 </div>
               </div>
               
               <div className="flex gap-4 pl-8">
                 <label className="flex items-center gap-2 text-sm cursor-pointer">
                   <input 
                     type="radio" 
                     name="isNameCorrect" 
                     checked={formData.isNameCorrect} 
                     onChange={() => setFormData({...formData, isNameCorrect: true})}
                     className="text-blue-600 focus:ring-blue-500"
                   />
                   Yes, that's correct
                 </label>
                 <label className="flex items-center gap-2 text-sm cursor-pointer">
                   <input 
                     type="radio" 
                     name="isNameCorrect" 
                     checked={!formData.isNameCorrect} 
                     onChange={() => setFormData({...formData, isNameCorrect: false})}
                     className="text-blue-600 focus:ring-blue-500"
                   />
                   No, I'll edit it
                 </label>
               </div>

               {/* Manual Name Input if "No" */}
               {!formData.isNameCorrect && (
                 <div className="grid grid-cols-2 gap-3 pl-8 animate-in fade-in slide-in-from-top-2">
                   <input 
                     type="text" 
                     name="officialFirstName"
                     placeholder="Official First Name"
                     value={formData.officialFirstName}
                     onChange={handleChange}
                     className="p-2 border rounded text-sm outline-none focus:ring-2 focus:ring-blue-500"
                     required
                   />
                   <input 
                     type="text" 
                     name="officialLastName"
                     placeholder="Official Last Name"
                     value={formData.officialLastName}
                     onChange={handleChange}
                     className="p-2 border rounded text-sm outline-none focus:ring-2 focus:ring-blue-500"
                     required
                   />
                 </div>
               )}
            </div>

            {/* 2. Academic Info */}
            <div className="grid md:grid-cols-2 gap-4">
               <div className="space-y-1.5">
                 <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                   <GraduationCap className="w-4 h-4" /> Course <span className="text-red-500">*</span>
                 </label>
                 <select 
                   name="course" 
                   value={formData.course} 
                   onChange={handleChange}
                   required
                   className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                 >
                    <option value="">Select Course</option>
                    <option value="BSIT">BS Information Technology</option>
                    <option value="BSCS">BS Computer Science</option>
                    <option value="BSBA">BS Business Administration</option>
                    <option value="BSED">Bachelor of Secondary Education</option>
                 </select>
               </div>

               <div className="space-y-1.5">
                 <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                   <BookOpen className="w-4 h-4" /> Year Graduated <span className="text-red-500">*</span>
                 </label>
                 <select 
                   name="batchYear" 
                   value={formData.batchYear} 
                   onChange={handleChange}
                   required
                   className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                 >
                    <option value="">Select Year</option>
                    {Array.from({length: 30}, (_, i) => (
                      <option key={i} value={2025 - i}>{2025 - i}</option>
                    ))}
                 </select>
               </div>
            </div>

            {/* 3. Challenge Question */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Users className="w-4 h-4" /> Challenge: Thesis Adviser / Section <span className="text-red-500">*</span>
              </label>
              <input 
                 type="text" 
                 name="verificationAnswer"
                 placeholder="e.g. Sir Pontillas / Section 4101"
                 value={formData.verificationAnswer}
                 onChange={handleChange}
                 required
                 className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
              />
              <p className="text-xs text-gray-500">This helps us manually verify your alumni status.</p>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-700 to-blue-900 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Complete Profile'} <ChevronRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;