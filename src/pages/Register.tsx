import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient'; 
import { 
  User, BookOpen, Lock, ChevronRight, ChevronLeft, 
  CheckCircle, HelpCircle, X, AlertCircle, Shield, Home, LogIn, 
} from 'lucide-react';

// Types for validation errors
type Errors = { [key: string]: string };

// --- REUSABLE INPUT COMPONENT ---
interface InputFieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  options?: { value: string | number; label: string | number }[];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  error?: string;
}

const InputField: React.FC<InputFieldProps> = ({ 
  label, name, type = "text", placeholder, required = false, options = [], value, onChange, error 
}) => {
  const isError = !!error;
  
  return (
    <div className="space-y-1.5 min-h-[85px]"> 
      <label className="text-sm font-semibold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {type === 'select' ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          className={`w-full p-3 border rounded-lg outline-none transition-all ${
            isError ? 'border-red-500 bg-red-50 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:ring-2 focus:ring-blue-600'
          }`}
        >
          <option value="">Select {label}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={name === 'mobile' ? 11 : undefined}
          className={`w-full p-3 border rounded-lg outline-none transition-all ${
            isError ? 'border-red-500 bg-red-50 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:ring-2 focus:ring-blue-600'
          }`}
        />
      )}
      
      <div className={`flex items-center gap-1 text-red-500 text-xs transition-opacity duration-200 ${isError ? 'opacity-100' : 'opacity-0'}`}>
         <AlertCircle className="w-3 h-3" /> {error || "Error"} 
      </div>
    </div>
  );
};

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showGooglePrompt, setShowGooglePrompt] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowGooglePrompt(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Form Data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    suffix: '', // Changed from maidenName
    birthday: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    batchYear: '',
    course: '',
    // SPLIT CHALLENGE QUESTION
    adviserName: '',
    section: '',
    studentId: '',
    agreedToPrivacy: false,
  });

  const [errors, setErrors] = useState<Errors>({});
  
  // PASSWORD STRENGTH LOGIC
  const [passStrength, setPassStrength] = useState(0);
  const [passFeedback, setPassFeedback] = useState('');

  useEffect(() => {
    const p = formData.password;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    
    setPassStrength(score);

    if (score === 0) setPassFeedback('');
    else if (score <= 2) setPassFeedback('Weak');
    else if (score === 3) setPassFeedback('Fair');
    else setPassFeedback('Strong');

  }, [formData.password]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // VALIDATION: Letters Only for Names
    if (['firstName', 'lastName', 'middleName', 'suffix', 'adviserName'].includes(name)) {
      if (value !== '' && !/^[a-zA-Z\s.-]*$/.test(value)) return;
    }
    // VALIDATION: Numbers Only for Mobile, StudentID, Section
    if (['mobile', 'studentId', 'section'].includes(name)) {
      if (value !== '' && !/^[0-9]*$/.test(value)) return;
    }

    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({ ...prev, [name]: val }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/onboarding` },
      });
      if (error) throw error;
    } catch (error: any) {
      alert(error.message);
    }
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Errors = {};
    let isValid = true;

    if (currentStep === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First Name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last Name is required';
      if (!formData.birthday) newErrors.birthday = 'Birthday is required';
      if (!formData.mobile.trim()) newErrors.mobile = 'Mobile number is required';
      else if (formData.mobile.length !== 11) newErrors.mobile = 'Mobile number must be 11 digits';
    }

    if (currentStep === 2) {
      if (!formData.course) newErrors.course = 'Please select a course';
      if (!formData.batchYear) newErrors.batchYear = 'Please select a batch year';
      // SPLIT VALIDATION
      if (!formData.adviserName.trim()) newErrors.adviserName = 'Adviser name is required';
      if (!formData.section.trim()) newErrors.section = 'Section is required';
    }

    if (currentStep === 3) {
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
      
      if (!formData.password) newErrors.password = 'Password is required';
      else if (passStrength < 3) newErrors.password = 'Password is too weak';
      
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
      
      if (!formData.agreedToPrivacy) newErrors.agreedToPrivacy = 'You must agree to the Data Privacy Policy';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      isValid = false;
    }

    return isValid;
  };

  const handleNext = () => { if (validateStep(step)) setStep((prev) => prev + 1); };
  const handleBack = () => setStep((prev) => prev - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) return;
    setLoading(true);

    try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              first_name: formData.firstName,
              last_name: formData.lastName,
              role: 'alumni'
            }
          }
        });
  
        if (authError) throw authError;
  
        if (authData.user) {
          // Combined Answer
          const combinedVerification = `Adviser: ${formData.adviserName} | Section: ${formData.section}`;

          const { error: profileError } = await supabase
            .from('profiles')
            .insert([{
              id: authData.user.id,
              first_name: formData.firstName,
              last_name: formData.lastName,
              middle_name: formData.middleName,
              // Note: Assuming you have a 'suffix' column, or append to last_name
              // For now, let's append to last_name for simpler DB structure unless you added a column
              // last_name: `${formData.lastName} ${formData.suffix}`.trim(), 
              // Better if you have suffix column:
              // suffix: formData.suffix, 
              
              birthday: formData.birthday,
              mobile_number: formData.mobile,
              batch_year: formData.batchYear,
              course: formData.course,
              student_id: formData.studentId || null,
              verification_answer: combinedVerification, // SAVED AS COMBINED STRING
              role: 'alumni',
              status: 'pending_approval'
            }] as any);
  
          if (profileError) throw profileError;
          navigate('/pending-approval'); 
        }
      } catch (error: any) {
        console.error(error);
        alert(error.message || "Registration failed");
      } finally {
        setLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* --- FLOATING GOOGLE LOGIN PROMPT --- */}
      {showGooglePrompt && (
        <div className="fixed top-4 right-4 md:top-8 md:right-8 z-50 animate-in slide-in-from-right duration-700 fade-in">
          <div className="bg-white p-4 rounded-2xl shadow-2xl border border-gray-100 w-80 relative transform hover:scale-105 transition-transform duration-300">
            <button onClick={() => setShowGooglePrompt(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                 <svg className="w-6 h-6" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Quick Registration</h4>
                <p className="text-xs text-gray-500">Sign in with Google to skip forms.</p>
              </div>
            </div>
            <button onClick={handleGoogleLogin} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors">
              Continue as User
            </button>
          </div>
        </div>
      )}

      <div className="bg-white w-full max-w-5xl min-h-[700px] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative z-10">
        
        {/* Left Side (Dark Blue Card) */}
        <div className="md:w-1/3 bg-gray-900 p-8 text-white flex flex-col relative overflow-hidden">
           {/* ... (Same Left Side Content as before) ... */}
           <div className="relative z-10 flex-1">
            <Link to="/" className="flex items-center gap-3 mb-6 md:mb-10">
              <img src="/images/Linker College Of The Philippines.png" alt="LCP Logo" className="w-12 h-12 object-contain"/>
              <span className="font-bold text-lg tracking-wide">LCP ALUMNI</span>
            </Link>
            <div className="mb-8 md:mb-0">
              <h2 className="text-2xl md:text-3xl font-bold mb-2 md:mb-4">Welcome Home.</h2>
              <p className="text-blue-200 text-sm leading-relaxed">Join the official alumni network. Verify your records securely.</p>
            </div>
            
            <div className="relative z-10 mt-6 md:mt-16 flex md:flex-col justify-between md:justify-start gap-0 md:gap-8">
               <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-800 -z-10 md:w-0.5 md:h-full md:left-5 md:top-0 md:right-auto"></div>
               {[
                 { id: 1, title: 'Personal', icon: User },
                 { id: 2, title: 'Academic', icon: BookOpen },
                 { id: 3, title: 'Security', icon: Lock },
               ].map((s) => {
                 const isActive = step === s.id;
                 const isCompleted = step > s.id;
                 return (
                   <div key={s.id} className={`flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4 transition-all duration-300 ${isActive ? 'md:translate-x-2' : ''}`}>
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative z-10 bg-gray-900 
                       ${isActive ? 'border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.8)] scale-110' : isCompleted ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-700 text-gray-500'}`}>
                       {isCompleted ? <CheckCircle className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                     </div>
                     <div className={`flex flex-col items-center md:items-start ${isActive ? 'opacity-100' : 'opacity-60'} hidden md:flex`}>
                        <span className="text-sm font-bold uppercase tracking-wider">{s.title}</span>
                        <span className="text-xs text-gray-400">Step {s.id}</span>
                     </div>
                   </div>
                 );
               })}
            </div>
          </div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-600 rounded-full blur-[100px] opacity-20" />
        </div>

        {/* Right Side: Form Area */}
        <div className="md:w-2/3 p-6 md:p-12 bg-gray-50 flex flex-col">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900">
              {step === 1 && "Basic Information"}
              {step === 2 && "Verification Details"}
              {step === 3 && "Account Security"}
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between">
            <div className="space-y-4"> 
            
              {/* STEP 1 */}
              {step === 1 && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-300 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <InputField label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} error={errors.firstName} required />
                    <InputField label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} error={errors.lastName} required />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                     <InputField label="Middle Name" name="middleName" value={formData.middleName} onChange={handleChange} placeholder="Optional" />
                     {/* CHANGED FROM MAIDEN NAME TO SUFFIX */}
                     <InputField label="Suffix" name="suffix" value={formData.suffix} onChange={handleChange} placeholder="Jr., III, etc." />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <InputField type="date" label="Birthday" name="birthday" value={formData.birthday} onChange={handleChange} error={errors.birthday} required />
                    <InputField type="tel" label="Mobile Number" name="mobile" value={formData.mobile} onChange={handleChange} error={errors.mobile} required placeholder="09xxxxxxxxx" />
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-300 space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex gap-3 mb-2">
                    <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <p className="text-xs text-blue-800 leading-relaxed">
                      <strong>Manual Verification:</strong> Our Registrar will check your details against the physical records.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <InputField 
                      type="select" 
                      label="Course" 
                      name="course" 
                      required 
                      value={formData.course}
                      onChange={handleChange}
                      error={errors.course}
                      options={[
                        { value: 'BSIT', label: 'BS Information Technology' },
                        { value: 'BSCS', label: 'BS Computer Science' },
                        { value: 'BSBA', label: 'BS Business Administration' },
                        { value: 'BSED', label: 'Bachelor of Secondary Education' },
                      ]} 
                    />
                    <InputField 
                      type="select" 
                      label="Year Graduated" 
                      name="batchYear" 
                      required 
                      value={formData.batchYear}
                      onChange={handleChange}
                      error={errors.batchYear}
                      options={Array.from({length: 30}, (_, i) => ({ value: 2025 - i, label: 2025 - i }))} 
                    />
                  </div>
                  <InputField label="Student Number" name="studentId" value={formData.studentId} onChange={handleChange} placeholder="Optional (e.g. 1900123)" />
                  
                  {/* SPLIT CHALLENGE QUESTION */}
                  <div className="grid md:grid-cols-2 gap-4">
                     <InputField label="Thesis Adviser" name="adviserName" value={formData.adviserName} onChange={handleChange} error={errors.adviserName} required placeholder="e.g. Sir Pontillas" />
                     <InputField label="Section Number" name="section" value={formData.section} onChange={handleChange} error={errors.section} required placeholder="e.g. 4101" />
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-300 space-y-4">
                  <InputField type="email" label="Email Address" name="email" value={formData.email} onChange={handleChange} error={errors.email} required placeholder="active@email.com" />
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <InputField type="password" label="Password" name="password" value={formData.password} onChange={handleChange} error={errors.password} required />
                    <InputField type="password" label="Confirm Password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} required />
                  </div>

                  {/* PROGRESS BAR STRENGTH METER */}
                  <div className="space-y-1 mt-1">
                    <div className="flex justify-between text-xs">
                       <span className="text-gray-500 font-semibold">Password Strength</span>
                       <span className={`font-bold ${passFeedback === 'Strong' ? 'text-green-600' : passFeedback === 'Weak' ? 'text-red-500' : 'text-yellow-600'}`}>
                         {passFeedback}
                       </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                       <div 
                         className={`h-full transition-all duration-300 ${passStrength === 0 ? 'w-0' : passStrength <= 2 ? 'w-1/3 bg-red-500' : passStrength === 3 ? 'w-2/3 bg-yellow-500' : 'w-full bg-green-500'}`}
                       />
                    </div>
                  </div>
                  
                  <div className="pt-2 min-h-[50px]">
                    <div className="flex items-start gap-3">
                      <input 
                        type="checkbox" 
                        id="terms" 
                        name="agreedToPrivacy"
                        checked={formData.agreedToPrivacy}
                        onChange={(e) => {
                          setFormData({...formData, agreedToPrivacy: e.target.checked});
                          setErrors({...errors, agreedToPrivacy: ''});
                        }}
                        className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" 
                      />
                      <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer select-none">
                        I have read and agree to the <button type="button" onClick={() => setShowPrivacyModal(true)} className="text-blue-600 font-semibold hover:underline">Data Privacy Policy</button>.
                      </label>
                    </div>
                    <div className={`ml-7 text-red-500 text-xs mt-1 transition-opacity ${errors.agreedToPrivacy ? 'opacity-100' : 'opacity-0'}`}>
                      {errors.agreedToPrivacy || "Required"}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* BUTTONS AND FOOTER LINKS */}
            <div className="mt-auto">
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                {step > 1 ? (
                  <button type="button" onClick={handleBack} className="flex items-center gap-2 text-gray-600 font-medium hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                ) : <div />}

                {step < 3 ? (
                  <button type="button" onClick={handleNext} className="flex items-center gap-2 bg-blue-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                    Next Step <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button type="submit" disabled={loading} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-900 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed">
                    {loading ? 'Submitting...' : 'Submit Application'} <CheckCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
                 <div className="flex items-center gap-1">
                   Already have an account? 
                   <Link to="/login" className="text-blue-600 font-semibold hover:underline flex items-center gap-1">
                     Log in <LogIn className="w-3 h-3" />
                   </Link>
                 </div>
                 
                 <Link to="/" className="text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors">
                   <Home className="w-3 h-3" /> Back to Home
                 </Link>
              </div>

            </div>
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
                By submitting this form, you consent to the collection, generation, use, processing, storage, and retention of your personal data by <strong>Bestlink College of the Philippines</strong> for the purpose of:
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
                  setFormData({...formData, agreedToPrivacy: true});
                  setErrors({...errors, agreedToPrivacy: ''});
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

export default Register;