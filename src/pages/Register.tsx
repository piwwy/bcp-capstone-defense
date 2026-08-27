import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useToast } from '../context/ToastContext';
import {
  User, BookOpen, ChevronRight,
  CheckCircle, HelpCircle, X, AlertCircle, Shield, Home, LogIn, Loader2, RefreshCw, Check, Upload, FileText, Trash2
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
}

const InputField: React.FC<InputFieldProps> = ({
  label, name, type = "text", placeholder, required = false, options = [], value, onChange, onBlur, error
}) => {
  const isError = !!error;

  return (
    <div className="space-y-1.5 min-h-[85px]">
      <label className="text-sm font-semibold text-blue-200/80">
        {label} {required && <span className="text-red-400">*</span>}
      </label>

      {type === 'select' ? (
        <div className="relative">
          <select
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            className={`w-full p-3 border rounded-lg outline-none transition-all appearance-none bg-white/5 text-white ${isError ? 'border-red-500 focus:ring-2 focus:ring-red-400/30' : 'border-white/10 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50'}`}
          >
            <option value="" className="bg-[#111827] text-gray-300">Select {label}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#111827] text-white">{opt.label}</option>
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
          maxLength={name === 'mobile' ? 11 : undefined}
          className={`w-full p-3 border rounded-lg outline-none transition-all bg-white/5 text-white placeholder-gray-500 ${isError ? 'border-red-500 focus:ring-2 focus:ring-red-400/30' : 'border-white/10 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50'}`}
        />
      )}

      <div className={`flex items-center gap-1 text-red-400 text-xs transition-opacity duration-200 ${isError ? 'opacity-100' : 'opacity-0'}`}>
        <AlertCircle className="w-3 h-3" /> {error || "Error"}
      </div>
    </div>
  );
};

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // --- MATH CAPTCHA STATE ---
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, answer: '' });
  const [captchaInput, setCaptchaInput] = useState('');

  useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    const n1 = Math.floor(Math.random() * 10) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    setCaptcha({ num1: n1, num2: n2, answer: (n1 + n2).toString() });
    setCaptchaInput('');
  };

  // Form Data (no password fields)
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', middleName: '', suffix: '',
    birthday: '', email: '', mobile: '',
    batchYear: '', course: '',
    adviserName: '', section: '', studentId: '',
    subscriptionPlan: '',
    agreedToPrivacy: false,
  });

  // File upload state
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');

  const [errors, setErrors] = useState<Errors>({});
  const [copiedChar, setCopiedChar] = useState('');
  const [lastValidationToastKey, setLastValidationToastKey] = useState('');

  // Regex patterns for strict validation
  const NAME_REGEX = /^[A-Za-zÑñ\s.'-]*$/;  // Letters, ñ, spaces, dots, hyphens, apostrophes
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
    subscriptionPlan: 'Subscription Plan',
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
      case 'birthday':
        return value ? '' : 'Birthday is required';
      case 'mobile':
        if (!trimmedValue) return 'Mobile number is required';
        return value.length === 11 ? '' : 'Mobile number must be 11 digits';
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
      case 'subscriptionPlan':
        return value ? '' : 'Please select a subscription plan';
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

    // STRICT INPUT FILTERING
    // Name fields: block numbers
    if (['firstName', 'lastName', 'middleName', 'suffix', 'adviserName'].includes(name)) {
      if (!NAME_REGEX.test(value)) return; // silently block invalid chars
    }

    // Mobile & Section: digits only
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError('');

    if (!file) {
      setReceiptFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError('File size exceeds 100MB limit.');
      showToast({ type: 'error', title: 'File Too Large', message: 'Receipt file must be under 100MB.' });
      setReceiptFile(null);
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setFileError('Only JPG, PNG, WebP, GIF, or PDF files are accepted.');
      showToast({ type: 'error', title: 'Invalid File Type', message: 'Only image or PDF files allowed.' });
      setReceiptFile(null);
      return;
    }

    setReceiptFile(file);
    showToast({ type: 'success', title: 'File Attached', message: `${file.name} ready to upload.`, durationMs: 2200, silent: true });
  };

  const removeFile = () => {
    setReceiptFile(null);
    setFileError('');
  };

  const checkEmailAvailability = async () => {
    if (!formData.email || !formData.email.includes('@')) return;
    try {
      const { data, error } = await supabase
        .from('subscription_applications')
        .select('id')
        .eq('email', formData.email.trim().toLowerCase())
        .eq('status', 'pending')
        .maybeSingle();

      if (error) {
        // Table may not exist yet, silently continue
        return;
      }

      if (data) {
        setErrors(prev => ({ ...prev, email: "You already have a pending application with this email." }));
        showToast({ type: 'warning', title: 'Pending Application', message: 'This email already has a pending subscription application.' });
      }
    } catch (err: any) {
      // silently continue
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Errors = {};

    // Personal info
    if (!formData.firstName.trim()) newErrors.firstName = 'First Name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last Name is required';
    if (!formData.birthday) newErrors.birthday = 'Birthday is required';
    if (!formData.mobile.trim()) newErrors.mobile = 'Mobile number is required';
    else if (formData.mobile.length !== 11) newErrors.mobile = 'Mobile number must be 11 digits';

    // Academic info
    if (!formData.course) newErrors.course = 'Please select a course';
    if (!formData.batchYear) newErrors.batchYear = 'Please select a batch year';
    if (!formData.adviserName.trim()) newErrors.adviserName = 'Adviser name is required';
    if (!formData.section.trim()) newErrors.section = 'Section is required';

    // Account info
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!EMAIL_REGEX.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.subscriptionPlan) newErrors.subscriptionPlan = 'Please select a subscription plan';
    if (!formData.agreedToPrivacy) newErrors.agreedToPrivacy = 'You must agree to the Data Privacy Policy';

    // Receipt file
    if (!receiptFile) newErrors.receiptFile = 'Please attach your payment receipt';

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
        } else if (firstErrorField === 'receiptFile') {
          showToast({
            type: 'error',
            title: 'Receipt Required',
            message: 'Please attach your payment receipt before submitting.'
          });
        } else {
          triggerValidationToast(firstErrorField, newErrors[firstErrorField]);
        }
      }
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading) {
      showToast({ type: 'warning', title: 'Submission in Progress', message: 'Please wait while we process your application.' });
      return;
    }

    // Validate all fields
    if (!validateForm()) return;

    setLoading(true);

    // Math Captcha Check: strict integer parsing
    const userCaptchaAnswer = parseInt(captchaInput, 10);
    const correctCaptchaAnswer = parseInt(captcha.answer, 10);
    if (isNaN(userCaptchaAnswer) || userCaptchaAnswer !== correctCaptchaAnswer) {
      showToast({ type: 'error', title: 'Wrong Captcha', message: 'Please solve the math problem correctly.' });
      generateCaptcha();
      setLoading(false);
      return;
    }

    const normalizedEmail = formData.email.trim().toLowerCase();

    try {
      // Step 0: Refresh session to prevent stale-session upload hangs
      try {
        await supabase.auth.refreshSession();
      } catch {
        // Continue even if refresh fails — anonymous submission is fine
      }

      // Step 1: Upload receipt file to Supabase Storage bucket (receipts)
      // Wrapped in a 20s timeout so it never hangs the submit button forever
      let receiptUrl = '';
      if (receiptFile) {
        const fileExt = receiptFile.name.split('.').pop();
        const fileName = `subscription_receipts/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        try {
          const uploadPromise = supabase.storage
            .from('receipts')
            .upload(fileName, receiptFile, { upsert: false });

          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Upload timed out. Submitting without receipt URL — admin will follow up.')), 20000)
          );

          const { data: uploadData, error: uploadError } = await Promise.race([uploadPromise, timeoutPromise]) as any;

          if (uploadError) {
            // Non-fatal: show warning but continue submission
            showToast({ type: 'warning', title: 'Receipt Upload Issue', message: `File could not be uploaded: ${uploadError.message}. Your application will still be submitted.` });
          } else if (uploadData?.path) {
            const { data: urlData } = supabase.storage
              .from('receipts')
              .getPublicUrl(uploadData.path);
            receiptUrl = urlData.publicUrl;
          }
        } catch (uploadErr: any) {
          // Timeout or unexpected error — warn but don't block submission
          showToast({ type: 'warning', title: 'Receipt Upload Skipped', message: uploadErr.message || 'File upload failed. Proceeding with application.' });
        }
      }

      // Step 2: Insert into subscription_applications table
      const applicationPayload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        middle_name: formData.middleName || null,
        suffix: formData.suffix || null,
        birthday: formData.birthday,
        email: normalizedEmail,
        mobile_number: formData.mobile,
        batch_year: String(formData.batchYear),
        course: formData.course,
        student_id: formData.studentId || null,
        adviser_name: formData.adviserName,
        section: formData.section,
        subscription_plan: formData.subscriptionPlan,
        receipt_url: receiptUrl || null,
        status: 'pending',
      };

      const { error: insertError } = await supabase
        .from('subscription_applications')
        .insert([applicationPayload]);

      if (insertError) {
        throw new Error(`Submission Error: ${insertError.message}`);
      }

      showToast({ type: 'success', title: 'Application Submitted', message: 'Your subscription application has been sent and is now pending admin approval.' });
      navigate('/pending-approval', {
        replace: true,
        state: { name: `${formData.firstName} ${formData.lastName}`, email: normalizedEmail }
      });

    } catch (error: any) {
      showToast({ type: 'error', title: 'Submission Failed', message: error.message || 'Unable to submit your application.' });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#0a0c18] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[500px] bg-blue-600/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative z-10">

        {/* Left Side (Dark Blue Card) */}
        <div className="md:w-1/3 bg-gray-900 p-8 text-white flex flex-col relative overflow-hidden">
          <div className="relative z-10 flex-1">
            <Link to="/" className="flex items-center gap-3 mb-6 md:mb-10">
              <img src="/images/bcplogo.png" alt="BCP Logo" className="w-12 h-12 object-contain" />
              <span className="font-bold text-lg tracking-wide">BCP ALUMNI</span>
            </Link>
            <div className="mb-8 md:mb-0">
              <h2 className="text-2xl md:text-3xl font-bold mb-2 md:mb-4">Subscribe Now.</h2>
              <p className="text-blue-200 text-sm leading-relaxed">Join the official BCP alumni network. Fill out the form and attach your payment receipt to get started.</p>
            </div>

            <div className="relative z-10 mt-6 md:mt-16 flex md:flex-col justify-between md:justify-start gap-0 md:gap-8">
              {[
                { title: 'Personal Info', icon: User, desc: 'Name, birthday, contact' },
                { title: 'Academic Info', icon: BookOpen, desc: 'Course, batch, adviser' },
                { title: 'Plan & Receipt', icon: Upload, desc: 'Choose plan, attach proof' },
              ].map((s, idx) => (
                <div key={idx} className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 bg-blue-600 border-blue-600 text-white">
                    <s.icon className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col items-center md:items-start hidden md:flex">
                    <span className="text-sm font-bold uppercase tracking-wider">{s.title}</span>
                    <span className="text-xs text-gray-400">{s.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-600 rounded-full blur-[100px] opacity-20" />
        </div>

        {/* Right Side: Form Area */}
        <div className="md:w-2/3 p-6 md:p-10 bg-[#0d1117] flex flex-col overflow-y-auto max-h-[90vh]">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-white">Subscription Application</h3>
            <p className="text-sm text-blue-200/50 mt-1">Complete all fields below to submit your subscription application.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
            <div className="space-y-6">

              {/* ═══ SECTION 1: PERSONAL INFO ═══ */}
              <div className="bg-white/5 border border-white/10 p-5 rounded-xl space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-5 h-5 text-blue-400" />
                  <h4 className="text-sm font-black text-blue-200/80 uppercase tracking-wider">Personal Information</h4>
                </div>

                {/* ñ/Ñ Helper */}
                <div className="flex items-center gap-2 p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <span className="text-xs text-blue-300 font-medium">May ñ/Ñ sa name mo?</span>
                  <button type="button" onClick={() => handleCopyChar('ñ')} className={`px-2.5 py-1 rounded-md text-sm font-bold transition-all ${copiedChar === 'ñ' ? 'bg-green-500 text-white' : 'bg-white/10 border border-white/20 text-blue-200 hover:bg-white/20'}`}>
                    {copiedChar === 'ñ' ? <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Copied!</span> : 'ñ'}
                  </button>
                  <button type="button" onClick={() => handleCopyChar('Ñ')} className={`px-2.5 py-1 rounded-md text-sm font-bold transition-all ${copiedChar === 'Ñ' ? 'bg-green-500 text-white' : 'bg-white/10 border border-white/20 text-blue-200 hover:bg-white/20'}`}>
                    {copiedChar === 'Ñ' ? <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Copied!</span> : 'Ñ'}
                  </button>
                  <span className="text-[10px] text-blue-300/50 ml-1">Click to copy, then paste (Ctrl+V)</span>
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
                  <InputField type="date" label="Birthday" name="birthday" value={formData.birthday} onChange={handleChange} onBlur={handleFieldBlur} error={errors.birthday} required />
                  <InputField type="tel" label="Mobile Number" name="mobile" value={formData.mobile} onChange={handleChange} onBlur={handleFieldBlur} error={errors.mobile} required placeholder="09xxxxxxxxx (digits only)" />
                </div>
                <InputField type="email" label="Email Address" name="email" value={formData.email} onChange={handleChange} onBlur={(e) => {
                  handleFieldBlur(e);
                  checkEmailAvailability();
                }} error={errors.email} required placeholder="active@email.com" />
              </div>

              {/* ═══ SECTION 2: ACADEMIC INFO ═══ */}
              <div className="bg-white/5 border border-white/10 p-5 rounded-xl space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                  <h4 className="text-sm font-black text-blue-200/80 uppercase tracking-wider">Academic Verification</h4>
                </div>

                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex gap-3 mb-2">
                  <HelpCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <p className="text-xs text-blue-200/80 leading-relaxed">
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

              {/* ═══ SECTION 3: SUBSCRIPTION PLAN & RECEIPT ═══ */}
              <div className="bg-white/5 border border-white/10 p-5 rounded-xl space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Upload className="w-5 h-5 text-blue-400" />
                  <h4 className="text-sm font-black text-blue-200/80 uppercase tracking-wider">Subscription &amp; Payment</h4>
                </div>

                <InputField
                  type="select"
                  label="Subscription Plan"
                  name="subscriptionPlan"
                  required
                  value={formData.subscriptionPlan}
                  onChange={handleChange}
                  onBlur={handleFieldBlur}
                  error={errors.subscriptionPlan}
                  options={[
                    { value: 'MONTHLY', label: 'Monthly Plan' },
                    { value: 'SEMI_ANNUAL', label: 'Semi-Annual Plan' },
                    { value: 'ANNUAL', label: 'Annual Plan' },
                    { value: 'LIFETIME', label: 'Lifetime Plan' },
                  ]}
                />

                {/* File Upload Area */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-blue-200/80">
                    Payment Receipt <span className="text-red-400">*</span>
                  </label>

                  {!receiptFile ? (
                    <label
                      htmlFor="receipt-upload"
                      className={`flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all hover:bg-blue-500/10 hover:border-blue-500/50 ${errors.receiptFile ? 'border-red-500/50 bg-red-500/10' : 'border-white/20 bg-white/5'}`}
                    >
                      <Upload className={`w-10 h-10 mb-3 ${errors.receiptFile ? 'text-red-400' : 'text-blue-400/60'}`} />
                      <p className="text-sm font-semibold text-blue-200/70">Click to upload your payment receipt</p>
                      <p className="text-xs text-blue-300/40 mt-1">JPG, PNG, WebP, GIF, or PDF • Max 100MB</p>
                      <input
                        id="receipt-upload"
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                        onChange={handleFileChange}
                      />
                    </label>
                  ) : (
                    <div className="flex items-center gap-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <div className="p-3 bg-emerald-100 rounded-lg">
                        <FileText className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-emerald-800 truncate">{receiptFile.name}</p>
                        <p className="text-xs text-emerald-600">{(receiptFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <button type="button" onClick={removeFile} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Remove file">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  {fileError && (
                    <div className="flex items-center gap-1 text-red-500 text-xs">
                      <AlertCircle className="w-3 h-3" /> {fileError}
                    </div>
                  )}
                  {errors.receiptFile && !fileError && (
                    <div className="flex items-center gap-1 text-red-500 text-xs">
                      <AlertCircle className="w-3 h-3" /> {errors.receiptFile}
                    </div>
                  )}
                </div>
              </div>

              {/* ═══ SECTION 4: CONSENT & CAPTCHA ═══ */}
              <div className="bg-white/5 border border-white/10 p-5 rounded-xl space-y-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="terms"
                    name="agreedToPrivacy"
                    checked={formData.agreedToPrivacy}
                    onChange={handleChange}
                    className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="terms" className="text-sm text-blue-200/70 cursor-pointer select-none">
                    I have read and agree to the <button type="button" onClick={() => {
                      setShowPrivacyModal(true);
                      showToast({ type: 'info', title: 'Policy Opened', message: 'Please review the Data Privacy Act of 2012 before checking consent.', silent: true });
                    }} className="text-blue-400 font-semibold hover:underline">Data Privacy Policy</button>.
                  </label>
                </div>
                <div className={`ml-7 text-red-500 text-xs mt-1 transition-opacity ${errors.agreedToPrivacy ? 'opacity-100' : 'opacity-0'}`}>
                  {errors.agreedToPrivacy || "Required"}
                </div>

                {/* MATH CAPTCHA */}
                <div className="pt-4 border-t border-white/10 mt-4">
                  <label className="block text-sm font-semibold text-blue-200/80 mb-2">
                    Security Check: What is {captcha.num1} + {captcha.num2}?
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      className="w-full p-3 border border-white/10 bg-white/5 text-white placeholder-gray-500 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="Enter answer"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        generateCaptcha();
                        showToast({ type: 'info', title: 'Captcha Refreshed', message: 'A new security challenge has been generated.', durationMs: 2200, silent: true });
                      }}
                      className="p-3 bg-white/10 rounded-lg text-blue-300 hover:bg-white/20 transition-colors"
                      title="Refresh Captcha"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SUBMIT BUTTON & FOOTER LINKS */}
            <div className="mt-8">
              <div className="flex items-center justify-between pt-6 border-t border-white/10">
                <div />
                <button type="submit" disabled={loading} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <>Submit Application <CheckCircle className="w-4 h-4" /></>}
                </button>
              </div>

              <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-blue-200/50">
                <div className="flex items-center gap-1">
                  Already have an account?
                  <Link to="/login" className="text-blue-400 font-semibold hover:underline flex items-center gap-1">
                    Log in <LogIn className="w-3 h-3" />
                  </Link>
                </div>

                <Link to="/" className="text-blue-300/40 hover:text-blue-300 flex items-center gap-1 transition-colors">
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

export default Register;