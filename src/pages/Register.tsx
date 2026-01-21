import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, BookOpen, Lock, ChevronRight, ChevronLeft, CheckCircle, HelpCircle } from 'lucide-react';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Updated Data Structure based on "Real Alumni" feedback
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    maidenName: '', // Important for female alumni who got married
    birthday: '',   // CRITICAL for verifying against manual records
    studentId: '',  // Optional now
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    batchYear: '',
    course: '',
    verificationAnswer: '', // "Who was your thesis adviser?" or "Section"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // TODO: Send data to backend (Supabase/Firebase)
    // Backend Status will be set to: "PENDING_MANUAL_VERIFICATION"
    console.log('Registering User for Manual Check:', formData);

    setTimeout(() => {
      setLoading(false);
      navigate('/pending-approval'); 
    }, 1500);
  };

  // Steps Configuration (Removed "Documents")
  const steps = [
    { id: 1, title: 'Personal', icon: User },
    { id: 2, title: 'Academic', icon: BookOpen },
    { id: 3, title: 'Security', icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      
      {/* Main Card */}
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side: Context */}
        <div className="md:w-1/3 bg-blue-900 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-3 mb-10">
              <img src="/images/bcplogo.png" alt="BCP Logo" className="w-10 h-10" />
              <span className="font-bold text-lg tracking-wide">BCP ALUMNI</span>
            </Link>
            <h2 className="text-3xl font-bold mb-4">Welcome Home, Alumni.</h2>
            <p className="text-blue-200 text-sm leading-relaxed">
              Reconnect with your batchmates, find career opportunities, and request documents online. 
            </p>
            <p className="text-blue-200 text-sm mt-4 italic opacity-80">
              "No need to scan documents. Just provide your details, and we'll verify it with our records."
            </p>
          </div>
          
          {/* Progress Indicators */}
          <div className="relative z-10 mt-10 space-y-4">
             {steps.map((s) => (
               <div key={s.id} className={`flex items-center gap-3 ${step === s.id ? 'text-white' : 'text-blue-400'}`}>
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${step === s.id ? 'bg-white text-blue-900 border-white' : 'border-blue-700'}`}>
                   <s.icon className="w-4 h-4" />
                 </div>
                 <span className="text-sm font-medium">{s.title}</span>
               </div>
             ))}
          </div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-600 rounded-full blur-3xl opacity-20" />
        </div>

        {/* Right Side: Form Area */}
        <div className="md:w-2/3 p-8 md:p-12 bg-gray-50">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900">
              {step === 1 && "Basic Information"}
              {step === 2 && "Verification Details"}
              {step === 3 && "Account Security"}
            </h3>
            <p className="text-gray-500 text-sm">
              {step === 1 && "Please use your legal name as it appeared in school records."}
              {step === 2 && "Help us locate your record in the Alumni Logbook."}
              {step === 3 && "Secure your account."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* STEP 1: Personal Info (Expanded for Manual Check) */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">First Name</label>
                    <input name="firstName" type="text" onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Last Name</label>
                    <input name="lastName" type="text" onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none" required />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                   <div>
                    <label className="text-sm font-medium text-gray-700">Middle Name (Optional)</label>
                    <input name="middleName" type="text" onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none" />
                  </div>
                   <div>
                    <label className="text-sm font-medium text-gray-700">Maiden Name (If Married)</label>
                    <input name="maidenName" type="text" onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none" placeholder="For female alumni" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Birthday <span className="text-red-500">*</span></label>
                    <input name="birthday" type="date" onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none" required />
                    <p className="text-[10px] text-gray-500 mt-1">Required to distinguish same names.</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Mobile Number</label>
                    <input name="mobile" type="tel" onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none" required />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Academic Info (The Verification Challenge) */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex gap-3 mb-4">
                  <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <p className="text-sm text-blue-800">
                    We manually check the <strong>Record Book</strong>. Please provide details that match your graduation year.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Course Graduated</label>
                    <select name="course" onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white">
                      <option value="">Select Course</option>
                      <option value="BSIT">BS Information Technology</option>
                      <option value="BSCS">BS Computer Science</option>
                      <option value="BSBA">BS Business Administration</option>
                      <option value="BSED">Bachelor of Secondary Education</option>
                      <option value="BSCrim">BS Criminology</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Year Graduated</label>
                    <select name="batchYear" onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white">
                      <option value="">Select Year</option>
                      {Array.from({length: 30}, (_, i) => 2025 - i).map(year => (
                         <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                   <label className="text-sm font-medium text-gray-700">Student Number (Optional)</label>
                   <input name="studentId" type="text" onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none" placeholder="If you remember it (e.g., 1900123)" />
                </div>

                <div className="space-y-2">
                   <label className="text-sm font-medium text-gray-700">Challenge Question: Thesis Adviser or Section?</label>
                   <input name="verificationAnswer" type="text" onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none" placeholder="e.g. Sir Pontillas / Section 4101" />
                   <p className="text-xs text-gray-500">This helps us verify you are a real student from that batch.</p>
                </div>
              </div>
            )}

            {/* STEP 3: Security */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email Address</label>
                  <input name="email" type="email" onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none" placeholder="Active email address" required />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Password</label>
                    <input name="password" type="password" onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none" placeholder="••••••••" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                    <input name="confirmPassword" type="password" onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none" placeholder="••••••••" required />
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-4">
                  <input type="checkbox" id="terms" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" required />
                  <label htmlFor="terms" className="text-sm text-gray-600">
                    I agree to the <a href="#" className="text-blue-600 hover:underline">Data Privacy Policy</a>.
                  </label>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-6">
              {step > 1 ? (
                <button type="button" onClick={handleBack} className="flex items-center gap-2 text-gray-600 font-medium hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              ) : <div />}

              {step < 3 ? (
                <button type="button" onClick={handleNext} className="flex items-center gap-2 bg-blue-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-all shadow-lg">
                  Next Step <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button type="submit" disabled={loading} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-900 transition-all shadow-lg">
                  {loading ? 'Submitting...' : 'Submit Application'} <CheckCircle className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account? <Link to="/login" className="text-blue-600 font-medium hover:underline">Sign In</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;