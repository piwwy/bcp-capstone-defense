import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient'; // Ensure this path is correct
import { 
  User, BookOpen, Lock, ChevronRight, ChevronLeft, 
  CheckCircle, HelpCircle, X, AlertCircle, Shield 
} from 'lucide-react';
import ReCAPTCHA from "react-google-recaptcha";

// Types for validation errors
type Errors = { [key: string]: string };

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [captchaValue, setCaptchaValue] = useState<string | null>(null);

  // Form Data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    maidenName: '',
    birthday: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    batchYear: '',
    course: '',
    verificationAnswer: '',
    agreedToPrivacy: false,
  });

  // Validation State
  const [errors, setErrors] = useState<Errors>({});
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Calculate Password Strength
  useEffect(() => {
    const pass = formData.password;
    let score = 0;
    if (!pass) {
      setPasswordStrength(0);
      return;
    }
    if (pass.length > 7) score += 1;
    if (/[A-Z]/.test(pass)) score += 1; // Has Uppercase
    if (/[0-9]/.test(pass)) score += 1; // Has Number
    if (/[^A-Za-z0-9]/.test(pass)) score += 1; // Has Symbol
    setPasswordStrength(score);
  }, [formData.password]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // Handle Checkbox vs Text
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData({ ...formData, [name]: val });

    // Clear error when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  // VALIDATION LOGIC
  const validateStep = (currentStep: number): boolean => {
    const newErrors: Errors = {};
    let isValid = true;

    if (currentStep === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First Name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last Name is required';
      if (!formData.birthday) newErrors.birthday = 'Birthday is required';
      if (!formData.mobile.trim()) newErrors.mobile = 'Mobile number is required';
    }

    if (currentStep === 2) {
      if (!formData.course) newErrors.course = 'Please select a course';
      if (!formData.batchYear) newErrors.batchYear = 'Please select a batch year';
      if (!formData.verificationAnswer.trim()) newErrors.verificationAnswer = 'This verification answer is required';
    }

    if (currentStep === 3) {
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
      
      if (!formData.password) newErrors.password = 'Password is required';
      else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
      
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
      
      if (!formData.agreedToPrivacy) newErrors.agreedToPrivacy = 'You must agree to the Data Privacy Policy';
      
      // Captcha Validation (Optional: Remove if not testing yet)
      // if (!captchaValue) newErrors.captcha = "Please verify you are human";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      isValid = false;
    }

    return isValid;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => setStep((prev) => prev - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(3)) return;

    setLoading(true);

    try {
      // --- SUPABASE INTEGRATION START ---
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
        // Save profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: authData.user.id,
            first_name: formData.firstName,
            last_name: formData.lastName,
            middle_name: formData.middleName,
            maiden_name: formData.maidenName,
            birthday: formData.birthday,
            mobile_number: formData.mobile,
            batch_year: formData.batchYear,
            course: formData.course,
            student_id: formData.studentId || null,
            verification_answer: formData.verificationAnswer,
            role: 'alumni',
            status: 'pending_approval'
          }] as any);

        if (profileError) throw profileError;

        navigate('/pending-approval'); 
      }
      // --- SUPABASE INTEGRATION END ---
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // Reusable Input Component with Validation Styles
  const InputField = ({ label, name, type = "text", placeholder, required = false, options = [] }: any) => {
    const isError = !!errors[name];
    
    return (
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        
        {type === 'select' ? (
          <select
            name={name}
            value={formData[name as keyof typeof formData] as string}
            onChange={handleChange}
            className={`w-full p-3 border rounded-lg outline-none transition-all ${
              isError ? 'border-red-500 bg-red-50 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:ring-2 focus:ring-blue-600'
            }`}
          >
            <option value="">Select {label}</option>
            {options.map((opt: any) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            name={name}
            value={formData[name as keyof typeof formData] as string}
            onChange={handleChange}
            placeholder={placeholder}
            className={`w-full p-3 border rounded-lg outline-none transition-all ${
              isError ? 'border-red-500 bg-red-50 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:ring-2 focus:ring-blue-600'
            }`}
          />
        )}
        
        {isError && (
          <div className="flex items-center gap-1 text-red-500 text-xs animate-pulse">
            <AlertCircle className="w-3 h-3" /> {errors[name]}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      
      {/* Main Card: Flex-col for mobile (Top/Bottom), Flex-row for desktop (Left/Right) */}
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side (Header on Mobile) */}
        <div className="md:w-1/3 bg-gray-900 p-8 text-white flex flex-col justify-between relative overflow-hidden min-h-[200px] md:min-h-auto">
          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-3 mb-6 md:mb-10">
              <img src="/logosms.png" alt="LCP Logo" className="w-10 h-10 object-contain" />
              <span className="font-bold text-lg tracking-wide">LCP ALUMNI</span>
            </Link>
            
            <div className="hidden md:block">
              <h2 className="text-3xl font-bold mb-4">Welcome Home.</h2>
              <p className="text-blue-200 text-sm leading-relaxed">
                Join the official alumni network. Verify your records securely.
              </p>
            </div>
          </div>
          
          {/* Progress Indicators (Horizontal on Mobile, Vertical on Desktop) */}
          <div className="relative z-10 mt-4 md:mt-10 flex md:flex-col gap-4 overflow-x-auto pb-2 md:pb-0">
             {[
               { id: 1, title: 'Personal', icon: User },
               { id: 2, title: 'Academic', icon: BookOpen },
               { id: 3, title: 'Security', icon: Lock },
             ].map((s) => (
               <div key={s.id} className={`flex items-center gap-3 flex-shrink-0 ${step === s.id ? 'text-white' : 'text-gray-500'}`}>
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${step >= s.id ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-600'}`}>
                   {step > s.id ? <CheckCircle className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                 </div>
                 <span className={`text-sm font-medium ${step === s.id ? 'block' : 'hidden md:block'}`}>{s.title}</span>
               </div>
             ))}
          </div>
          
          {/* Decoration */}
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-600 rounded-full blur-3xl opacity-20" />
        </div>

        {/* Right Side: Form Area */}
        <div className="md:w-2/3 p-6 md:p-12 bg-gray-50 flex flex-col justify-center">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900">
              {step === 1 && "Basic Information"}
              {step === 2 && "Verification Details"}
              {step === 3 && "Account Security"}
            </h3>
            <p className="text-gray-500 text-sm mt-1">
              {step === 1 && "Please use your legal name as it appears in school records."}
              {step === 2 && "We compare this with the Alumni Logbook manually."}
              {step === 3 && "Create a strong password to protect your data."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* STEP 1: Personal Info */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid md:grid-cols-2 gap-4">
                  <InputField label="First Name" name="firstName" required />
                  <InputField label="Last Name" name="lastName" required />
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                   <InputField label="Middle Name" name="middleName" placeholder="Optional" />
                   <InputField label="Maiden Name" name="maidenName" placeholder="If married (Female)" />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <InputField type="date" label="Birthday" name="birthday" required />
                  <InputField type="tel" label="Mobile Number" name="mobile" required placeholder="09xxxxxxxxx" />
                </div>
              </div>
            )}

            {/* STEP 2: Academic Info */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex gap-3 mb-4">
                  <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <p className="text-xs text-blue-800 leading-relaxed">
                    <strong>Manual Verification:</strong> Our Registrar will check your Thesis Adviser or Section to confirm your identity.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <InputField 
                    type="select" 
                    label="Course" 
                    name="course" 
                    required 
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
                    options={Array.from({length: 30}, (_, i) => ({ value: 2025 - i, label: 2025 - i }))} 
                  />
                </div>

                <InputField label="Student Number" name="studentId" placeholder="Optional (e.g. 1900123)" />
                <InputField label="Challenge: Thesis Adviser / Section" name="verificationAnswer" required placeholder="e.g. Sir Pontillas / Section 4101" />
              </div>
            )}

            {/* STEP 3: Security */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <InputField type="email" label="Email Address" name="email" required placeholder="active@email.com" />
                
                <div className="grid md:grid-cols-2 gap-4">
                  <InputField type="password" label="Password" name="password" required />
                  <InputField type="password" label="Confirm Password" name="confirmPassword" required />
                </div>

                {/* Password Strength Meter */}
                {formData.password && (
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="flex justify-between text-xs mb-1 font-semibold text-gray-500">
                      <span>Strength</span>
                      <span>
                        {passwordStrength === 0 && "Weak"}
                        {passwordStrength === 1 && "Fair"}
                        {passwordStrength === 2 && "Good"}
                        {passwordStrength >= 3 && "Strong"}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-300 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ease-out ${
                          passwordStrength <= 1 ? 'bg-red-500' :
                          passwordStrength === 2 ? 'bg-yellow-500' :
                          passwordStrength === 3 ? 'bg-blue-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${(passwordStrength / 4) * 100}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2">
                      Must contain: 8+ chars, Uppercase, Number, Symbol
                    </p>
                  </div>
                )}
                
                {/* Terms Checkbox */}
                <div className="pt-2">
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
                  {errors.agreedToPrivacy && (
                    <div className="flex items-center gap-1 text-red-500 text-xs mt-1 ml-7">
                      <AlertCircle className="w-3 h-3" /> {errors.agreedToPrivacy}
                    </div>
                  )}
                </div>

                {/* Recaptcha Placeholder */}
                <div className="flex justify-center pt-2">
                   {/* Uncomment when you have Site Key */}
                   {/* <ReCAPTCHA sitekey="YOUR_KEY" onChange={(val) => setCaptchaValue(val)} /> */}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-6">
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
              <p>
                Your information will be kept strictly confidential and will not be shared with third parties without your consent, except as required by law.
              </p>
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