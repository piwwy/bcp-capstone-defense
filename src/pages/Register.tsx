import React, { useState } from "react";
import { Eye, EyeOff, Upload, ChevronDown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const Register: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [yearGraduated, setYearGraduated] = useState("");
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [torFile, setTorFile] = useState<File | null>(null);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [captchaAgreed, setCaptchaAgreed] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState("General Fund");
  const [loading, setLoading] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const navigate = useNavigate();

  const years = Array.from({ length: 26 }, (_, i) => 2025 - i);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== repeatPassword) {
      alert("❌ Passwords do not match!");
      return;
    }

    if (!certificateFile || !torFile) {
      alert("❌ Please upload both Certificate/Diploma and TOR files.");
      return;
    }

    if (!termsAgreed || !captchaAgreed) {
      alert("❌ Please agree to the terms and complete the captcha.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("name", fullName);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("repeatPassword", repeatPassword);
    formData.append("studentNumber", studentNumber);
    formData.append("yearGraduated", yearGraduated);
    formData.append("certificate", certificateFile);
    formData.append("tor", torFile);

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        alert("✅ Registration successful! Please wait for approval by the Alumni Head. You will receive an email once your account is approved.");
        navigate("/login");
      } else {
        alert(data.message || "❌ Registration failed. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("⚠️ Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const faqs = [
    {
      q: "Who can register?",
      a: "All BCP alumni who have graduated and possess valid credentials (TOR, diploma/certificate) can register."
    },
    {
      q: "How long does verification take?",
      a: "Account verification by the Alumni Head typically takes 1-3 business days after email confirmation."
    },
    {
      q: "What file formats are accepted?",
      a: "We accept PDF, JPG, PNG, and GIF files for certificates and TOR (max 10MB each)."
    },
    {
      q: "Is my data secure?",
      a: "Yes, all data is encrypted and stored securely. We comply with data privacy regulations."
    }
  ];

  return (
<div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-black py-8 px-4 relative overflow-hidden">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-emerald-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Main Registration Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="grid lg:grid-cols-5 gap-0">
            {/* Left: Registration Form (60%) */}
            <div className="lg:col-span-3 p-8 md:p-12">
              <div className="text-center mb-8">
                <img
                  src="public/images/bcplogo.png"
                  alt="BCP Logo"
                  className="w-24 h-24 md:w-28 md:h-28 mx-auto drop-shadow-lg mb-4"
                />
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent mb-2">
                  BCP Alumni Register
                </h1>
                <p className="text-gray-600 text-sm">
                  Join the BCP Alumni Community
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white/60 backdrop-blur-sm outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white/60 backdrop-blur-sm outline-none transition-all"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Create password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white/60 backdrop-blur-sm outline-none transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Repeat Password
                    </label>
                    <div className="relative">
                      <input
                        type={showRepeatPassword ? "text" : "password"}
                        placeholder="Repeat password"
                        value={repeatPassword}
                        onChange={(e) => setRepeatPassword(e.target.value)}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white/60 backdrop-blur-sm outline-none transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showRepeatPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Student Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 2020-12345"
                      value={studentNumber}
                      onChange={(e) => setStudentNumber(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white/60 backdrop-blur-sm outline-none transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Year Graduated
                    </label>
                    <select
                      value={yearGraduated}
                      onChange={(e) => setYearGraduated(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white/60 backdrop-blur-sm outline-none transition-all"
                      required
                    >
                      <option value="">Select year</option>
                      {years.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Certificate/Diploma
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.gif"
                      onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="certificate"
                      required
                    />
                    <label
                      htmlFor="certificate"
                      className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 transition-all bg-white/40"
                    >
                      <Upload className="w-5 h-5 mr-2 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {certificateFile ? certificateFile.name : "Upload Certificate (PDF/Image, max 10MB)"}
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Transcript of Records (TOR)
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.gif"
                      onChange={(e) => setTorFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="tor"
                      required
                    />
                    <label
                      htmlFor="tor"
                      className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 transition-all bg-white/40"
                    >
                      <Upload className="w-5 h-5 mr-2 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {torFile ? torFile.name : "Upload TOR (PDF/Image, max 10MB)"}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={termsAgreed}
                      onChange={(e) => setTermsAgreed(e.target.checked)}
                      className="mt-1 mr-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      required
                    />
                    <span className="text-sm text-gray-700">
                      I agree to the{" "}
                      <Link to="/privacy" className="text-blue-600 hover:underline">
                        Privacy Policy
                      </Link>{" "}
                      and{" "}
                      <Link to="/terms" className="text-blue-600 hover:underline">
                        Terms of Use
                      </Link>
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={captchaAgreed}
                      onChange={(e) => setCaptchaAgreed(e.target.checked)}
                      className="mr-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      required
                    />
                    <span className="text-sm text-gray-700">I'm not a robot ✓</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  } text-white py-3 px-4 rounded-xl font-semibold focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 transform hover:scale-[1.02] shadow-lg`}
                >
                  {loading ? "Processing..." : "Register"}
                </button>
              </form>

              <div className="text-center mt-6 space-y-2">
                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link to="/login" className="text-blue-600 font-semibold hover:underline">
                    Login
                  </Link>
                </p>
                <Link to="/forgot-password" className="block text-sm text-gray-500 hover:text-blue-600">
                  Forgot Password?
                </Link>
                <Link to="/" className="block text-blue-500 hover:underline text-xs font-medium">
                  ← Back to Home
                </Link>
              </div>
            </div>

            {/* Right: BCP Pledge & Donation (40%) */}
            <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 to-purple-700 p-8 md:p-12 text-white">
              <h1 className="text-3xl font-bold mb-6">BCP Pledge</h1>
              <p className="text-blue-100 mb-6 text-sm leading-relaxed">
                Support our alma mater's mission to provide quality education and empower future generations. Your contribution makes a difference.
              </p>

              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-sm font-semibold mb-2">Select Campaign</label>
                  <div className="relative">
                    <select
                      value={selectedCampaign}
                      onChange={(e) => setSelectedCampaign(e.target.value)}
                      className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white outline-none focus:ring-2 focus:ring-white/50 appearance-none"
                    >
                      <option value="General Fund" className="text-gray-900">General Fund</option>
                      <option value="Scholarship Fund" className="text-gray-900">Scholarship Fund</option>
                      <option value="Infrastructure" className="text-gray-900">Infrastructure Development</option>
                      <option value="Research" className="text-gray-900">Research & Innovation</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none" />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => alert(`Thank you for your interest in supporting ${selectedCampaign}! Donation portal coming soon.`)}
                  className="w-full bg-white text-blue-700 py-3 px-6 rounded-xl font-semibold hover:bg-blue-50 transition-all shadow-lg transform hover:scale-105"
                >
                  Donate Now
                </button>
              </div>

              <div className="border-t border-white/20 pt-6 space-y-4 text-sm">
                <div>
                  <h3 className="font-semibold mb-2">Our Mission</h3>
                  <p className="text-blue-100 text-xs leading-relaxed">
                    To foster a vibrant alumni community that supports BCP's vision of academic excellence and holistic development.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Our Vision</h3>
                  <p className="text-blue-100 text-xs leading-relaxed">
                    A globally recognized institution producing competent, ethical, and socially responsible graduates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Below Card: Privacy Note & FAQs */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          {/* Privacy Note */}
          <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Privacy Note</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              Your personal information is protected and will only be used for alumni verification and communication purposes. We comply with data privacy regulations.
            </p>
            <Link to="/privacy-policy" className="text-blue-600 text-sm font-semibold hover:underline">
              Read Full Privacy Policy →
            </Link>
          </div>

          {/* FAQs */}
          <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">FAQs for BCP Alumni</h3>
            <div className="space-y-2">
              {faqs.map((faq, idx) => (
                <div key={idx} className="border-b border-gray-200 last:border-0 pb-2">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                    className="w-full text-left flex justify-between items-center py-2 text-sm font-semibold text-gray-800 hover:text-blue-600 transition-colors"
                  >
                    {faq.q}
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        expandedFaq === idx ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {expandedFaq === idx && (
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">{faq.a}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center mt-6 text-sm text-gray-500">
          Accounts will be validated by the Alumni Head
        </p>
      </div>
    </div>
  );
};

export default Register;
