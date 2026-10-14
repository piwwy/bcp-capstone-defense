import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useToast } from '../context/ToastContext';
import {
  User, BookOpen, Lock, ChevronRight, ChevronLeft,
  CheckCircle, HelpCircle, AlertCircle, Shield, Home, LogIn, CheckCircle2, Loader2, RefreshCw, Eye, EyeOff, Check, ExternalLink
} from 'lucide-react';

// Types for validation errors
type Errors = { [key: string]: string };

interface InputFieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  options?: { value: string | number; label: string | number }[];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => void;
  error?: string;
  helperText?: string;
  inputMode?: 'text' | 'numeric' | 'tel' | 'email' | 'search' | 'none';
}

const InputField: React.FC<InputFieldProps> = ({
  label, name, type = "text", placeholder, required = false, options = [], value, onChange, onBlur, error, helperText, inputMode
}) => {
  const isError = !!error;

  return (
    <div className="space-y-1.5 min-h-[85px]">
      <label className="text-sm font-semibold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {type === 'select' ? (
        <div className="relative">
          <select
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            className={`w-full p-3 border rounded-lg outline-none transition-all appearance-none ${
              isError ? 'border-red-500 bg-red-50 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:ring-2 focus:ring-blue-600'
            }`}
          >
            <option value="">Select {label}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <div className="absolute right-3 top-3.5 pointer-events-none text-gray-400">
            <ChevronRight className="w-4 h-4 rotate-90" />
          </div>
        </div>
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          inputMode={inputMode}
          maxLength={name === 'mobile' ? 11 : name === 'birthday' ? 10 : undefined}
          className={`w-full p-3 border rounded-lg outline-none transition-all ${
            isError ? 'border-red-500 bg-red-50 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:ring-2 focus:ring-blue-600'
          }`}
        />
      )}

      {helperText && !isError && (
        <p className="text-[11px] text-gray-400">{helperText}</p>
      )}

      <div className={`flex items-center gap-1 text-red-500 text-xs transition-opacity duration-200 ${isError ? 'opacity-100' : 'opacity-0'}`}>
        <AlertCircle className="w-3 h-3 flex-shrink-0" /> {error || "Error"}
      </div>
    </div>
  );
};

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const DRAFT_KEY = 'bcp_alumni_register_draft_v2';

  // Form Data (persisted in localStorage so session never loses inputs)
  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          firstName: parsed.firstName || '',
          lastName: parsed.lastName || '',
          middleName: parsed.middleName || '',
          suffix: parsed.suffix || '',
          birthday: parsed.birthday || '',
          email: parsed.email || '',
          mobile: parsed.mobile || '',
          password: '',
          confirmPassword: '',
          batchYear: parsed.batchYear || '',
          course: parsed.course || '',
          adviserName: parsed.adviserName || '',
          section: parsed.section || '',
          studentId: parsed.studentId || '',
          agreedToPrivacy: Boolean(parsed.agreedToPrivacy),
        };
      }
    } catch {
      // ignore
    }
    return {
      firstName: '', lastName: '', middleName: '', suffix: '',
      birthday: '', email: '', mobile: '',
      password: '', confirmPassword: '',
      batchYear: '', course: '',
      adviserName: '', section: '', studentId: '',
      agreedToPrivacy: false,
    };
  });

  // Auto-save form draft to localStorage (safe: no passwords)
  useEffect(() => {
    try {
      const { password, confirmPassword, ...safeDraft } = formData;
      localStorage.setItem(DRAFT_KEY, JSON.stringify(safeDraft));
    } catch {
      // ignore
    }
  }, [formData]);

  const [errors, setErrors] = useState<Errors>({});
  const [passStrength, setPassStrength] = useState(0);
  const [passFeedback, setPassFeedback] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [copiedChar, setCopiedChar] = useState('');
  const [lastValidationToastKey, setLastValidationToastKey] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Live real-time cooldown countdown ticker
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    const p = formData.password;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[a-z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    setPassStrength(score);
    if (score === 0) setPassFeedback('');
    else if (score <= 2) setPassFeedback('Weak');
    else if (score <= 4) setPassFeedback('Fair');
    else setPassFeedback('Strong');
  }, [formData.password]);

  // Strict regex patterns
  const NAME_REGEX = /^[A-Za-z\u00C0-\u024F\s.'-]*$/;
  const DIGITS_ONLY = /^[0-9]*$/;
  const EMAIL_REGEX = /\S+@\S+\.\S+/;

  const FIELD_LABELS: Record<string, string> = {
    firstName: 'First Name',
    lastName: 'Last Name',
    middleName: 'Middle Name',
    suffix: 'Suffix',
    birthday: 'Birthday',
    mobile: 'Mobile Number',
    course: 'Course',
    batchYear: 'Year Graduated',
    adviserName: 'Thesis Adviser',
    section: 'Section Number',
    studentId: 'Student Number',
    email: 'Email Address',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    agreedToPrivacy: 'Data Privacy Consent'
  };

  const triggerValidationToast = (fieldName: string, message: string) => {
    const toastKey = `${fieldName}:${message}`;
    if (lastValidationToastKey === toastKey) return;

    showToast({
      type: 'warning',
      title: `Check ${FIELD_LABELS[fieldName] || fieldName}`,
      message,
      durationMs: 2800,
      silent: true
    });
    setLastValidationToastKey(toastKey);
  };

  const getFieldError = (fieldName: string, value: string) => {
    const trimmedValue = value.trim();

    switch (fieldName) {
      case 'firstName':
      case 'lastName':
        return trimmedValue ? '' : `${FIELD_LABELS[fieldName]} is required`;
      case 'birthday': {
        if (!trimmedValue) return 'Birthday is required';
        if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
          return 'Please enter birthday in YYYY-MM-DD format (e.g. 2001-10-24)';
        }
        const [y, m, d] = trimmedValue.split('-').map(Number);
        const currentYear = new Date().getFullYear();
        if (y < 1940 || y > currentYear - 15) return `Birth year must be between 1940 and ${currentYear - 15}`;
        if (m < 1 || m > 12) return 'Invalid month (01-12)';
        if (d < 1 || d > 31) return 'Invalid day (01-31)';
        return '';
      }
      case 'mobile':
        if (!trimmedValue) return 'Mobile number is required';
        return value.length === 11 ? '' : 'Mobile number must be 11 digits (09xxxxxxxxx)';
      case 'course':
        return value ? '' : 'Please select a course';
      case 'batchYear':
        return value ? '' : 'Please select a batch year';
      case 'adviserName':
        return trimmedValue ? '' : 'Adviser name is required';
      case 'section':
        return trimmedValue ? '' : 'Section is required';
      case 'email':
        if (!trimmedValue) return 'Email is required';
        return EMAIL_REGEX.test(value) ? '' : 'Invalid email format';
      case 'password':
        if (!value) return 'Password is required';
        return passStrength < 3 ? 'Password is too weak' : '';
      case 'confirmPassword':
        return value === formData.password ? '' : 'Passwords do not match';
      default:
        return '';
    }
  };

  const handleFieldBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const fieldError = getFieldError(name, value);

    if (!fieldError) return;

    setErrors((prev) => ({ ...prev, [name]: fieldError }));
    triggerValidationToast(name, fieldError);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    // Handle checkbox separately
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
      if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
      return;
    }

    // Birthday: Pure numbers typed, auto-inserts hyphens (YYYY-MM-DD)
    if (name === 'birthday') {
      const isDeleting = value.length < formData.birthday.length;
      let digits = value.replace(/\D/g, '').slice(0, 8);

      // If user backspaced past a hyphen, also delete the preceding number
      if (isDeleting && formData.birthday.endsWith('-') && !value.endsWith('-')) {
        digits = digits.slice(0, -1);
      }

      let formatted = digits;
      if (digits.length > 4 && digits.length <= 6) {
        formatted = `${digits.slice(0, 4)}-${digits.slice(4)}`;
      } else if (digits.length > 6) {
        formatted = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
      }

      setFormData(prev => ({ ...prev, birthday: formatted }));
      if (errors.birthday) setErrors(prev => ({ ...prev, birthday: '' }));
      return;
    }

    // STRICT INPUT FILTERING
    // Name fields: block numbers
    if (['firstName', 'lastName', 'middleName', 'suffix', 'adviserName'].includes(name)) {
      if (!NAME_REGEX.test(value)) return;
    }

    // Mobile & Section & StudentId: digits only
    if (name === 'mobile' || name === 'section' || name === 'studentId') {
      if (!DIGITS_ONLY.test(value)) return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // ñ/Ñ copy helper
  const handleCopyChar = (char: string) => {
    navigator.clipboard.writeText(char);
    setCopiedChar(char);
    showToast({ type: 'info', title: 'Character Copied', message: `${char} copied to clipboard.` });
    setTimeout(() => setCopiedChar(''), 1500);
  };

  const checkEmailAvailability = async () => {
    if (!formData.email || !formData.email.includes('@')) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', formData.email.trim().toLowerCase())
        .maybeSingle();

      if (error) return;

      if (data) {
        setErrors(prev => ({ ...prev, email: "This email is already registered." }));
        showToast({ type: 'warning', title: 'Email Taken', message: 'This email is already linked to an account.' });
      }
    } catch {
      // ignore
    }
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Errors = {};
    let isValid = true;

    if (currentStep === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First Name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last Name is required';
      if (!formData.birthday.trim()) {
        newErrors.birthday = 'Birthday is required';
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.birthday.trim())) {
        newErrors.birthday = 'Please use YYYY-MM-DD format (e.g. 2001-10-24)';
      }
      if (!formData.mobile.trim()) newErrors.mobile = 'Mobile number is required';
      else if (formData.mobile.length !== 11) newErrors.mobile = 'Mobile number must be 11 digits';
    }

    if (currentStep === 2) {
      if (!formData.course) newErrors.course = 'Please select a course';
      if (!formData.batchYear) newErrors.batchYear = 'Please select a batch year';
      if (!formData.adviserName.trim()) newErrors.adviserName = 'Adviser name is required';
      if (!formData.section.trim()) newErrors.section = 'Section is required';
    }

    if (currentStep === 3) {
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!EMAIL_REGEX.test(formData.email)) newErrors.email = 'Invalid email format';
      if (!formData.password) newErrors.password = 'Password is required';
      else if (passStrength < 3) newErrors.password = 'Password is too weak';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
      if (!formData.agreedToPrivacy) newErrors.agreedToPrivacy = 'You must agree to the Data Privacy Policy';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const [firstErrorField] = Object.keys(newErrors);
      if (firstErrorField) {
        if (firstErrorField === 'agreedToPrivacy') {
          showToast({
            type: 'error',
            title: 'DPA 2012 Required',
            message: 'You must check the Data Privacy Act of 2012 consent before submitting.'
          });
        } else {
          triggerValidationToast(firstErrorField, newErrors[firstErrorField]);
        }
      }
      isValid = false;
    }
    return isValid;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
      showToast({
        type: 'info',
        title: 'Step Updated',
        message: `Moved to Step ${step + 1}.`,
        durationMs: 2200,
        silent: true
      });
      return;
    }

    showToast({
      type: 'error',
      title: 'Cannot Continue',
      message: `Please complete required fields in Step ${step} before proceeding.`
    });
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
    showToast({
      type: 'info',
      title: 'Step Updated',
      message: `Returned to Step ${Math.max(1, step - 1)}.`,
      durationMs: 2200,
      silent: true
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading) {
      showToast({ type: 'warning', title: 'Submission in Progress', message: 'Please wait while we process your application.' });
      return;
    }

    // Validate Step 3 first
    if (!validateStep(3)) return;

    setLoading(true);
    const normalizedEmail = formData.email.trim().toLowerCase();

    try {
      // Step 1: Check if a profile with this email already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('email, auth_provider, status')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (existingProfile) {
        if (existingProfile.auth_provider === 'google' || existingProfile.auth_provider === 'linkedin') {
          throw new Error(`This email is already linked to a ${existingProfile.auth_provider === 'google' ? 'Google' : 'LinkedIn'} account. Please log in using that provider instead.`);
        }
        throw new Error("This email is already registered. Please log in instead.");
      }

      // Step 2: Register with Supabase Auth (with graceful fallback on rate limits)
      let authUserId: string | null = null;
      let hitRateLimit = false;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: formData.password,
        options: {
          data: {
            full_name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
          }
        }
      });

      if (authError) {
        if (authError.message?.includes('already registered') || (authError as any).status === 422) {
          throw new Error('This email already has an account. Please log in instead.');
        }

        // Supabase Auth rate limiting (e.g. "For security purposes, you can only request this after XX seconds")
        if (
          authError.message?.includes('security purposes') ||
          authError.message?.includes('rate limit') ||
          authError.message?.includes('after') ||
          (authError as any).status === 429
        ) {
          const match = authError.message.match(/after\s+(\d+)\s+seconds/i);
          const seconds = match ? parseInt(match[1], 10) : 15;
          setCooldown(seconds);
          throw new Error(`Security Cooldown: May security cooldown ang pag-submit. Paki-antay ng ${seconds} segundo (makikita sa button) bago mag-submit muli.`);
        } else {
          throw authError;
        }
      }

      if (!authData?.user) {
        throw new Error('Unable to create user account. Please try again.');
      }

      authUserId = authData.user.id;

      // Step 3: Upsert into profiles table (Official source of truth for Alumni Verification & Admin Dashboard)
      await new Promise(resolve => setTimeout(resolve, 800));
      const profilePayload = {
        id: authUserId,
        email: normalizedEmail,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        middle_name: formData.middleName.trim() || null,
        suffix: formData.suffix.trim() || null,
        birthday: formData.birthday.trim(),
        mobile_number: formData.mobile.trim(),
        batch_year: String(formData.batchYear),
        course: formData.course,
        student_id: formData.studentId.trim() || null,
        verification_answer: `Adviser: ${formData.adviserName.trim()} | Section: ${formData.section.trim()}`,
        role: 'alumni',
        status: 'pending_approval',
        auth_provider: 'email',
        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.firstName)}+${encodeURIComponent(formData.lastName)}&background=random`
      };

      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert([profilePayload], { onConflict: 'id' });
        if (profileError) {
          console.warn('Profile upsert warning:', profileError.message);
        }
      } catch (err) {
        console.warn('Profile upsert notice:', err);
      }

      // Step 4: Optional subscription_applications mirror (non-blocking so RLS won't fail registration)
      try {
        const { error: subErr } = await supabase
          .from('subscription_applications')
          .insert([{
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
            middle_name: formData.middleName.trim() || null,
            suffix: formData.suffix.trim() || null,
            birthday: formData.birthday.trim(),
            email: normalizedEmail,
            mobile_number: formData.mobile.trim(),
            batch_year: String(formData.batchYear),
            course: formData.course,
            student_id: formData.studentId.trim() || null,
            adviser_name: formData.adviserName.trim(),
            section: formData.section.trim(),
            subscription_plan: 'Standard Alumni',
            status: 'pending'
          }]);

        if (subErr) {
          console.warn('Subscription application table note (RLS):', subErr.message);
        }
      } catch (subErr) {
        console.warn('Subscription application table note:', subErr);
      }

      // Clear draft since submission is successful
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        // ignore
      }

      // Sign out auth session so unapproved users don't access portal directly
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }

      showToast({ 
        type: 'success', 
        title: 'Application Submitted', 
        message: 'Your record was saved and is now pending admin verification.' 
      });

      navigate('/pending-approval', { 
        replace: true,
        state: { name: `${formData.firstName.trim()} ${formData.lastName.trim()}`, email: normalizedEmail }
      });

    } catch (error: any) {
      if (error.message?.includes('already') || error.message?.includes('linked') || error.status === 422) {
        showToast({ type: 'error', title: 'Account Exists', message: error.message || 'This email is taken. Please Log In.' });
      } else if (error.message?.includes('Security Cooldown')) {
        showToast({ type: 'warning', title: 'Security Cooldown', message: error.message });
      } else {
        showToast({ type: 'error', title: 'Registration Failed', message: error.message || 'Unable to complete registration.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="bg-white w-full max-w-5xl min-h-[700px] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative z-10">

        {/* Left Side (Dark Blue Card) */}
        <div className="md:w-1/3 bg-gray-900 p-8 text-white flex flex-col relative overflow-hidden">
          <div className="relative z-10 flex-1">
            <Link to="/" className="flex items-center gap-3 mb-6 md:mb-10">
              <img src="/images/bcplogo.png" alt="BCP Logo" className="w-12 h-12 object-contain" />
              <span className="font-bold text-lg tracking-wide">BCP ALUMNI</span>
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
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-600 rounded-full blur-[100px] opacity-20 pointer-events-none" />
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
                  {/* ñ/Ñ Helper */}
                  <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                    <span className="text-xs text-amber-700 font-medium">May ñ/Ñ sa name mo?</span>
                    <button type="button" onClick={() => handleCopyChar('ñ')} className={`px-2.5 py-1 rounded-md text-sm font-bold transition-all ${copiedChar === 'ñ' ? 'bg-green-500 text-white' : 'bg-white border border-amber-300 text-amber-800 hover:bg-amber-100'}`}>
                      {copiedChar === 'ñ' ? <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Copied!</span> : 'ñ'}
                    </button>
                    <button type="button" onClick={() => handleCopyChar('Ñ')} className={`px-2.5 py-1 rounded-md text-sm font-bold transition-all ${copiedChar === 'Ñ' ? 'bg-green-500 text-white' : 'bg-white border border-amber-300 text-amber-800 hover:bg-amber-100'}`}>
                      {copiedChar === 'Ñ' ? <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Copied!</span> : 'Ñ'}
                    </button>
                    <span className="text-[10px] text-amber-500 ml-1">Click to copy, then paste (Ctrl+V)</span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <InputField label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} onBlur={handleFieldBlur} error={errors.firstName} required placeholder="Letters only" />
                    <InputField label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} onBlur={handleFieldBlur} error={errors.lastName} required placeholder="Letters only" />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <InputField label="Middle Name" name="middleName" value={formData.middleName} onChange={handleChange} onBlur={handleFieldBlur} placeholder="Optional (letters only)" />
                    <InputField label="Suffix" name="suffix" value={formData.suffix} onChange={handleChange} onBlur={handleFieldBlur} placeholder="Jr., III, etc." />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <InputField
                      type="text"
                      inputMode="numeric"
                      label="Birthday"
                      name="birthday"
                      value={formData.birthday}
                      onChange={handleChange}
                      onBlur={handleFieldBlur}
                      error={errors.birthday}
                      required
                      placeholder="YYYY-MM-DD (hal. 2001-10-24)"
                      helperText="Numero lang ang i-type (hal. 20011024), kusa itong maglalagay ng '-'"
                    />
                    <InputField type="tel" label="Mobile Number" name="mobile" value={formData.mobile} onChange={handleChange} onBlur={handleFieldBlur} error={errors.mobile} required placeholder="09xxxxxxxxx (digits only)" />
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
                      onBlur={handleFieldBlur}
                      error={errors.course}
                      options={[
                        { value: 'BSIT', label: 'BS Information Technology' },
                        { value: 'BSCS', label: 'BS Computer Science' },
                        { value: 'BSBA', label: 'BS Business Administration' },
                        { value: 'BSHM', label: 'BS Hospitality Management' },
                        { value: 'BSTM', label: 'BS Tourism Management' },
                        { value: 'BSOA', label: 'BS Office Administration' },
                        { value: 'BSCrim', label: 'BS Criminology' },
                        { value: 'BSEd', label: 'BS Education' },
                        { value: 'BSPsych', label: 'BS Psychology' },
                        { value: 'BSA', label: 'BS Accountancy' },
                        { value: 'BSEntrep', label: 'BS Entrepreneurship' },
                        { value: 'BSRealEstate', label: 'BS Real Estate Management' },
                        { value: 'BSCustoms', label: 'BS Customs Administration' },
                      ]}
                    />
                    <InputField
                      type="select"
                      label="Year Graduated"
                      name="batchYear"
                      required
                      value={formData.batchYear}
                      onChange={handleChange}
                      onBlur={handleFieldBlur}
                      error={errors.batchYear}
                      options={Array.from({ length: 31 }, (_, i) => ({ value: 2026 - i, label: 2026 - i }))}
                    />
                  </div>
                  <InputField label="Student Number" name="studentId" value={formData.studentId} onChange={handleChange} onBlur={handleFieldBlur} placeholder="Optional — digits only (e.g. 1900123)" />

                  <div className="grid md:grid-cols-2 gap-4">
                    <InputField label="Thesis Adviser" name="adviserName" value={formData.adviserName} onChange={handleChange} onBlur={handleFieldBlur} error={errors.adviserName} required placeholder="e.g. Sir Pontillas" />
                    <InputField label="Section Number" name="section" value={formData.section} onChange={handleChange} onBlur={handleFieldBlur} error={errors.section} required placeholder="Digits only (e.g. 4101)" />
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-300 space-y-4">
                  <InputField type="email" label="Email Address" name="email" value={formData.email} onChange={handleChange} onBlur={(e) => {
                    handleFieldBlur(e);
                    checkEmailAvailability();
                  }} error={errors.email} required placeholder="active@email.com" />

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 min-h-[85px]">
                      <label className="text-sm font-semibold text-gray-700">Password <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          onBlur={handleFieldBlur}
                          autoComplete="new-password"
                          className={`w-full p-3 pr-10 border rounded-lg outline-none transition-all ${errors.password ? 'border-red-500 bg-red-50 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:ring-2 focus:ring-blue-600'}`}
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                          title={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className={`flex items-center gap-1 text-red-500 text-xs transition-opacity duration-200 ${errors.password ? 'opacity-100' : 'opacity-0'}`}>
                        <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.password || "Error"}
                      </div>
                    </div>

                    <div className="space-y-1.5 min-h-[85px]">
                      <label className="text-sm font-semibold text-gray-700">Confirm Password <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          onBlur={handleFieldBlur}
                          autoComplete="new-password"
                          className={`w-full p-3 pr-10 border rounded-lg outline-none transition-all ${errors.confirmPassword ? 'border-red-500 bg-red-50 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:ring-2 focus:ring-blue-600'}`}
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                          title={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className={`flex items-center gap-1 text-red-500 text-xs transition-opacity duration-200 ${errors.confirmPassword ? 'opacity-100' : 'opacity-0'}`}>
                        <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.confirmPassword || "Error"}
                      </div>
                    </div>
                  </div>

                  {/* PASSWORD REQUIREMENTS CHECKLIST */}
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Password Requirements</p>
                    {[
                      { label: 'At least 8 characters', met: formData.password.length >= 8 },
                      { label: 'At least 1 uppercase letter (A-Z)', met: /[A-Z]/.test(formData.password) },
                      { label: 'At least 1 lowercase letter (a-z)', met: /[a-z]/.test(formData.password) },
                      { label: 'At least 1 number (0-9)', met: /[0-9]/.test(formData.password) },
                      { label: 'At least 1 special character (!@#$%...)', met: /[^A-Za-z0-9]/.test(formData.password) },
                    ].map((req, i) => (
                      <div key={i} className={`flex items-center gap-2 text-xs font-medium transition-colors ${req.met ? 'text-green-600' : 'text-gray-400'}`}>
                        {req.met ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300" />}
                        {req.label}
                      </div>
                    ))}
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
                      <span className="text-xs text-gray-500 font-semibold">Strength:</span>
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-300 ${passStrength === 0 ? 'w-0' : passStrength <= 2 ? 'w-1/3 bg-red-500' : passStrength <= 4 ? 'w-2/3 bg-yellow-500' : 'w-full bg-green-500'}`} />
                      </div>
                      <span className={`text-xs font-bold ${passFeedback === 'Strong' ? 'text-green-600' : passFeedback === 'Weak' ? 'text-red-500' : 'text-yellow-600'}`}>{passFeedback}</span>
                    </div>
                  </div>

                  <div className="pt-2 min-h-[50px]">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="terms"
                        name="agreedToPrivacy"
                        checked={formData.agreedToPrivacy}
                        onChange={handleChange}
                        className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer select-none">
                        I have read and agree to the{' '}
                        <a
                          href="/privacy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-1"
                          title="Open full Data Privacy Policy in a new tab"
                        >
                          Data Privacy Policy <ExternalLink className="w-3.5 h-3.5 inline text-blue-600" />
                        </a>.
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
                  <button
                    type="submit"
                    disabled={loading || cooldown > 0}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-900 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                    ) : cooldown > 0 ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> Wait {cooldown}s to Submit</>
                    ) : (
                      <>Submit Application <CheckCircle className="w-4 h-4" /></>
                    )}
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
    </div>
  );
};

export default Register;