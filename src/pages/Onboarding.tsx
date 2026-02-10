import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import {
  GraduationCap, BookOpen, CheckCircle, Shield, X, LogOut, Loader2,
  AlertCircle, AlertTriangle, CheckCircle2, HelpCircle, Lock, Eye, EyeOff
} from 'lucide-react';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [toast, setToast] = useState<{ show: boolean; type: 'success' | 'error' | 'warning'; title: string; message: string } | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // User data from Google
  const [user, setUser] = useState<any>(null);
  const [googleName, setGoogleName] = useState({ firstName: '', lastName: '' });

  // Form fields
  const [formData, setFormData] = useState({
    course: '',
    batchYear: '',
    adviserName: '',
    section: '',
    studentId: '',
    password: '',
    confirmPassword: '',
    agreedToPrivacy: false,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Get current user on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/signup-options');
        return;
      }

      setUser(user);

      // Extract name from Google metadata
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
      const nameParts = fullName.split(' ');
      setGoogleName({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
      });

      setPageLoading(false);
    };

    getUser();
  }, [navigate]);

  const showToast = (type: 'success' | 'error' | 'warning', title: string, message: string) => {
    setToast({ show: true, type, title, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.course) newErrors.course = 'Please select your course';
    if (!formData.batchYear) newErrors.batchYear = 'Please select your graduation year';
    if (!formData.adviserName.trim()) newErrors.adviserName = 'Thesis adviser is required';
    if (!formData.section.trim()) newErrors.section = 'Section is required';

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Please create a password';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreedToPrivacy) newErrors.agreedToPrivacy = 'You must agree to the Data Privacy Policy';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (!user) return;

    setLoading(true);

    try {
      // 1. Try to update user password in Supabase Auth
      // Note: This might fail if password is the same - we handle it gracefully
      const { error: passwordError } = await supabase.auth.updateUser({
        password: formData.password
      });

      // Only throw if it's NOT the "same password" error
      if (passwordError && !passwordError.message.includes('different from the old')) {
        throw passwordError;
      }
      // If password was same, just continue (user can still use that password)

      // 2. Save profile data
      const combinedVerification = `Adviser: ${formData.adviserName} | Section: ${formData.section}`;

      const profileData = {
        id: user.id,
        email: user.email,
        first_name: googleName.firstName,
        last_name: googleName.lastName,
        batch_year: String(formData.batchYear),
        course: formData.course,
        student_id: formData.studentId || null,
        verification_answer: combinedVerification,
        role: 'alumni',
        status: 'pending_approval',
        auth_provider: 'google',
        avatar_url: user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${googleName.firstName}+${googleName.lastName}&background=random`,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' });

      if (error) throw error;

      showToast('success', 'Profile Completed!', 'Redirecting to status page...');

      setTimeout(() => {
        navigate('/pending-approval');
      }, 1500);

    } catch (error: any) {
      console.error("Onboarding Error:", error);
      showToast('error', 'System Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">

      {/* Toast Notification */}
      {toast && toast.show && (
        <div className={`fixed top-6 right-6 z-50 flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl border animate-in slide-in-from-right duration-300 max-w-sm w-full bg-white ${toast.type === 'success' ? 'border-green-500' :
          toast.type === 'warning' ? 'border-yellow-500' :
            'border-red-500'
          }`}>
          <div className={`mt-0.5 ${toast.type === 'success' ? 'text-green-600' :
            toast.type === 'warning' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> :
              toast.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> :
                <X className="w-5 h-5" />}
          </div>
          <div>
            <h4 className={`text-sm font-bold ${toast.type === 'success' ? 'text-green-800' :
              toast.type === 'warning' ? 'text-yellow-800' :
                'text-red-800'
              }`}>{toast.title}</h4>
            <p className="text-xs text-gray-600 mt-1">{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} className="ml-auto text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-white w-full max-w-4xl min-h-[650px] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative z-10">

        {/* Left Side (Dark Blue Card) */}
        <div className="md:w-2/5 bg-gray-900 p-8 text-white flex flex-col relative overflow-hidden">
          <div className="relative z-10 flex-1">
            <Link to="/" className="flex items-center gap-3 mb-8">
              <img src="/images/Linker College Of The Philippines.png" alt="LCP Logo" className="w-12 h-12 object-contain" />
              <span className="font-bold text-lg tracking-wide">LCP ALUMNI</span>
            </Link>

            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">Almost There!</h2>
              <p className="text-blue-200 text-sm leading-relaxed">Complete your profile to join the alumni network.</p>
            </div>

            {/* User Google Info Card */}
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${googleName.firstName}&background=random`}
                  alt="Profile"
                  className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
                />
                <div>
                  <p className="font-semibold">{googleName.firstName} {googleName.lastName}</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-green-400">
                <CheckCircle className="w-3 h-3" />
                Verified via Google
              </div>
            </div>

            {/* Steps Indicator */}
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Google Login</p>
                  <p className="text-xs text-gray-400">Complete</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.6)]">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Profile & Password</p>
                  <p className="text-xs text-gray-400">In Progress</p>
                </div>
              </div>
              <div className="flex items-center gap-3 opacity-50">
                <div className="w-8 h-8 rounded-full border-2 border-gray-600 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-400">Admin Verification</p>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="mt-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>

          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-600 rounded-full blur-[100px] opacity-20" />
        </div>

        {/* Right Side: Form Area */}
        <div className="md:w-3/5 p-6 md:p-8 bg-gray-50 flex flex-col overflow-y-auto max-h-[650px]">
          <div className="mb-5">
            <h3 className="text-xl font-bold text-gray-900">Complete Your Profile</h3>
            <p className="text-gray-500 text-sm mt-1">Academic info + Create your login password</p>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
            <div className="space-y-4 flex-1">

              {/* Course & Year */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-gray-400" />
                    Course <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    className={`w-full p-3 border rounded-xl outline-none transition-all bg-white ${errors.course ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:ring-2 focus:ring-blue-600'
                      }`}
                  >
                    <option value="">Select Course</option>
                    <option value="BSIT">BS Information Technology</option>
                    <option value="BSCS">BS Computer Science</option>
                    <option value="BSBA">BS Business Administration</option>
                    <option value="BSHM">BS Hospitality Management</option>
                    <option value="BSTM">BS Tourism Management</option>
                    <option value="BSOA">BS Office Administration</option>
                    <option value="BSCrim">BS Criminology</option>
                    <option value="BSEd">BS Education</option>
                    <option value="BSPsych">BS Psychology</option>
                    <option value="BSA">BS Accountancy</option>
                    <option value="BSEntrep">BS Entrepreneurship</option>
                    <option value="BSRealEstate">BS Real Estate Management</option>
                    <option value="BSCustoms">BS Customs Administration</option>
                  </select>
                  {errors.course && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.course}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    Year Graduated <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="batchYear"
                    value={formData.batchYear}
                    onChange={handleChange}
                    className={`w-full p-3 border rounded-xl outline-none transition-all bg-white ${errors.batchYear ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:ring-2 focus:ring-blue-600'
                      }`}
                  >
                    <option value="">Select Year</option>
                    {Array.from({ length: 31 }, (_, i) => 2026 - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  {errors.batchYear && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.batchYear}</p>}
                </div>
              </div>

              {/* Verification Details */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">
                    Thesis Adviser <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="adviserName"
                    value={formData.adviserName}
                    onChange={handleChange}
                    placeholder="e.g. Sir Pontillas"
                    className={`w-full p-3 border rounded-xl outline-none transition-all ${errors.adviserName ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:ring-2 focus:ring-blue-600'
                      }`}
                  />
                  {errors.adviserName && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.adviserName}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">
                    Section <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="section"
                    value={formData.section}
                    onChange={handleChange}
                    placeholder="e.g. 4101"
                    className={`w-full p-3 border rounded-xl outline-none transition-all ${errors.section ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:ring-2 focus:ring-blue-600'
                      }`}
                  />
                  {errors.section && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.section}</p>}
                </div>
              </div>

              {/* Student ID (Optional) */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  Student Number <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  placeholder="e.g. 1900123"
                  className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Create Password Section */}
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="w-4 h-4 text-blue-600" />
                  <p className="text-sm font-bold text-gray-700">Create Login Password</p>
                </div>
                <p className="text-xs text-gray-500 mb-3">This password will be used to login to your account.</p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Min. 6 characters"
                        className={`w-full p-3 pr-10 border rounded-xl outline-none transition-all ${errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:ring-2 focus:ring-blue-600'
                          }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.password}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Re-enter password"
                        className={`w-full p-3 pr-10 border rounded-xl outline-none transition-all ${errors.confirmPassword ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:ring-2 focus:ring-blue-600'
                          }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.confirmPassword}</p>}
                  </div>
                </div>
              </div>

              {/* Privacy Checkbox */}
              <div className="pt-2">
                <div className="flex items-start gap-3 p-3 bg-gray-100 rounded-xl border border-gray-200">
                  <input
                    type="checkbox"
                    id="privacy"
                    name="agreedToPrivacy"
                    checked={formData.agreedToPrivacy}
                    onChange={handleChange}
                    className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 cursor-pointer"
                  />
                  <label htmlFor="privacy" className="text-sm text-gray-600 cursor-pointer">
                    I agree to the collection of my data in compliance with the{' '}
                    <button type="button" onClick={() => setShowPrivacyModal(true)} className="text-blue-600 font-semibold hover:underline">
                      Data Privacy Act
                    </button>.
                  </label>
                </div>
                {errors.agreedToPrivacy && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.agreedToPrivacy}</p>}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-5 bg-gradient-to-r from-blue-600 to-blue-800 text-white py-4 rounded-xl font-bold hover:from-blue-700 hover:to-blue-900 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : <><CheckCircle className="w-5 h-5" /> Complete Registration</>}
            </button>
          </form>
        </div>
      </div>

      {/* DATA PRIVACY MODAL */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-2 text-blue-900">
                <Shield className="w-6 h-6" />
                <h3 className="text-xl font-bold">Data Privacy Act</h3>
              </div>
              <button onClick={() => setShowPrivacyModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto text-sm text-gray-600 leading-relaxed space-y-4">
              <p>
                <strong>Republic Act No. 10173</strong>, also known as the Data Privacy Act of 2012, protects individuals from unauthorized processing of personal information.
              </p>
              <p>
                By submitting this form, you consent to the collection, generation, use, processing, storage, and retention of your personal data by <strong>Linker College of the Philippines</strong> for the purpose of:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Alumni record verification and validation.</li>
                <li>Communication regarding alumni events and career opportunities.</li>
                <li>Statistical analysis and tracer studies.</li>
              </ul>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => {
                  setFormData({ ...formData, agreedToPrivacy: true });
                  setErrors({ ...errors, agreedToPrivacy: '' });
                  setShowPrivacyModal(false);
                }}
                className="w-full bg-blue-900 text-white py-3 rounded-xl font-semibold hover:bg-blue-800 transition-colors"
              >
                I Understand & Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;