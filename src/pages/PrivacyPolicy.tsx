import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Printer, Lock, CheckCircle2, FileText, Building2, Mail, Phone, MapPin, Scale, Eye } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header Bar */}
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img src="/images/bcplogo.png" alt="BCP Logo" className="w-10 h-10 object-contain group-hover:scale-105 transition-transform" />
            <div>
              <h1 className="font-black text-white text-base tracking-wide leading-tight">BESTLINK COLLEGE OF THE PHILIPPINES</h1>
              <p className="text-[11px] text-blue-300 font-medium">Alumni Relations & Data Protection Office</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> Print Policy
            </button>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/30"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Register
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-950/50 via-slate-900 to-slate-900 border-b border-white/10 py-16 px-4 sm:px-6">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-6">
            <Shield className="w-4 h-4 text-blue-400" /> Republic Act No. 10173 Compliance
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Institutional Data Privacy Notice & Policy
          </h1>
          <p className="mt-4 text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Bestlink College of the Philippines is fully committed to upholding and respecting your fundamental rights to personal data privacy in compliance with the Philippine Data Privacy Act of 2012 (RA 10173).
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
            <span><strong>Document Code:</strong> BCP-DPA-ALUMNI-2026-V2</span>
            <span>•</span>
            <span><strong>Effective Date:</strong> January 2026</span>
            <span>•</span>
            <span><strong>Review Cycle:</strong> Annual</span>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-10 backdrop-blur-xl shadow-2xl space-y-10 text-slate-300 leading-relaxed text-sm">

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5 border-b border-white/10 pb-2.5">
              <Building2 className="w-5 h-5 text-blue-400" /> 1. Institutional Privacy Statement
            </h2>
            <p>
              Bestlink College of the Philippines (BCP), an educational institution duly recognized by the Commission on Higher Education (CHED) and the Technical Education and Skills Development Authority (TESDA), recognizes its responsibilities under Republic Act No. 10173, otherwise known as the <strong>Data Privacy Act of 2012 (DPA)</strong>, its Implementing Rules and Regulations (IRR), and all applicable issuances of the National Privacy Commission (NPC).
            </p>
            <p>
              This Privacy Notice informs all alumni, former students, graduates, and portal users how their personal and sensitive personal information is collected, generated, processed, stored, and protected when accessing and utilizing the <strong>BCP Alumni Portal</strong>.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5 border-b border-white/10 pb-2.5">
              <FileText className="w-5 h-5 text-blue-400" /> 2. Personal Information Collected
            </h2>
            <p>
              In order to provide verification services, graduate tracer surveys, and alumni engagement opportunities, BCP collects and processes the following categories of information:
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mt-3">
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-2">
                <h3 className="font-bold text-blue-300 text-xs uppercase tracking-wider">A. Personal Identifiers</h3>
                <ul className="text-xs space-y-1 list-disc pl-4 text-slate-300">
                  <li>Full legal name (including Middle Name and Suffix)</li>
                  <li>Date of birth & gender</li>
                  <li>Official Student Identification Number (if applicable)</li>
                  <li>Contact details (Active Email Address and Mobile Number)</li>
                  <li>Profile avatar or uploaded identification photograph</li>
                </ul>
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-2">
                <h3 className="font-bold text-blue-300 text-xs uppercase tracking-wider">B. Academic & Institutional Records</h3>
                <ul className="text-xs space-y-1 list-disc pl-4 text-slate-300">
                  <li>Degree Program / Course completed at BCP</li>
                  <li>Year of Graduation (Batch Year)</li>
                  <li>Section number, thesis adviser, or academic verification data</li>
                  <li>Honors, institutional awards, and extracurricular affiliations</li>
                </ul>
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-2">
                <h3 className="font-bold text-blue-300 text-xs uppercase tracking-wider">C. Career & Tracer Information</h3>
                <ul className="text-xs space-y-1 list-disc pl-4 text-slate-300">
                  <li>Current employment status (Employed, Self-employed, Seeking, Further Studies)</li>
                  <li>Employer / Company name, job title, and industry classification</li>
                  <li>Professional certifications, licensure details, and skills</li>
                  <li>Alumni feedback, tracer survey responses, and mentorship participation</li>
                </ul>
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-2">
                <h3 className="font-bold text-blue-300 text-xs uppercase tracking-wider">D. System & Transaction Records</h3>
                <ul className="text-xs space-y-1 list-disc pl-4 text-slate-300">
                  <li>Login timestamps, IP addresses, and user-agent logs</li>
                  <li>Two-factor authentication (2FA) verification audits</li>
                  <li>Voluntary alumni donation, giving transactions, and payment receipts</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5 border-b border-white/10 pb-2.5">
              <Scale className="w-5 h-5 text-blue-400" /> 3. Purpose & Legal Basis for Processing
            </h2>
            <p>
              Your personal data is collected and processed based on your explicit consent and the legitimate educational, administrative, and institutional interests of the College, specifically to:
            </p>
            <ul className="space-y-2 list-none pl-0">
              {[
                { title: 'Identity & Alumni Verification', desc: 'Cross-reference registration claims against official Registrar permanent physical archives and student master records.' },
                { title: 'Statutory & Regulatory Compliance', desc: 'Comply with mandatory annual CHED Institutional Sustainability Assessment (ISA), PACUCOA accreditation, and Tracer Study requirements.' },
                { title: 'Employment & Career Opportunities', desc: 'Facilitate job postings, career mentorship, industry matching, and referral services tailored to your completed course.' },
                { title: 'Alumni Network & Community Engagement', desc: 'Distribute official campus updates, homecoming invitations, emergency bulletins, and batch reunion activities.' },
                { title: 'Institutional Philanthropy', desc: 'Issue official electronic certificates of donation, donor recognition, and scholarship sponsorship tracking.' },
              ].map((p, idx) => (
                <li key={idx} className="flex items-start gap-2.5 bg-slate-950/40 p-3 rounded-xl border border-white/5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white text-xs">{p.title}:</strong>{' '}
                    <span className="text-slate-300 text-xs">{p.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5 border-b border-white/10 pb-2.5">
              <Lock className="w-5 h-5 text-blue-400" /> 4. Information Security & Storage Safeguards
            </h2>
            <p>
              Bestlink College of the Philippines enforces rigorous organizational, physical, and technical measures to guarantee the confidentiality, integrity, and availability of personal records:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li><strong>Transport & At-Rest Encryption:</strong> All data transmissions are secured using Transport Layer Security (TLS 1.3 / SSL). Sensitive credentials and passwords are irreversibly hashed using industry-standard bcrypt and PBKDF2 algorithms.</li>
              <li><strong>Role-Based Access Control (RBAC):</strong> Access to personal records is restricted exclusively to authorized Registrar officers and Alumni Affairs personnel with verified non-disclosure agreements.</li>
              <li><strong>Continuous Audit Logging:</strong> Every administrative action, record review, status approval, or data access is logged with immutable timestamps and administrator identifiers in an enterprise audit trail.</li>
              <li><strong>Two-Factor Authentication (2FA):</strong> Alumni logins are protected by automated 6-digit One-Time Password verification codes to prevent unauthorized account access.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5 border-b border-white/10 pb-2.5">
              <Eye className="w-5 h-5 text-blue-400" /> 5. Data Subject Rights
            </h2>
            <p>
              As a registered data subject under Section 16 of Republic Act No. 10173, you retain the following enforceable rights:
            </p>
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="font-bold text-white">1. Right to be Informed:</span> You have the right to know how your personal data is collected and processed.
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="font-bold text-white">2. Right to Access:</span> You may request reasonable access to your personal information stored within the portal.
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="font-bold text-white">3. Right to Rectification:</span> You may correct or dispute inaccurate, outdated, or incomplete records through your profile or the Registrar.
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="font-bold text-white">4. Right to Erasure or Blocking:</span> You may suspend, withdraw, or request removal of non-mandatory alumni engagement data.
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="font-bold text-white">5. Right to Data Portability:</span> You may obtain an electronic copy of your submitted alumni profile data in a structured format.
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="font-bold text-white">6. Right to File a Complaint:</span> You have the right to seek redress with the National Privacy Commission (NPC) if your rights are infringed.
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5 border-b border-white/10 pb-2.5">
              <Mail className="w-5 h-5 text-blue-400" /> 6. Data Protection Officer (DPO) Contact Information
            </h2>
            <p>
              For inquiries, requests to exercise your data privacy rights, or reports regarding the processing of your personal information, you may contact the BCP Data Protection Office:
            </p>
            <div className="bg-gradient-to-r from-blue-900/40 to-slate-900 p-5 rounded-2xl border border-blue-500/30 text-xs space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-white">Data Protection Office — Bestlink College of the Philippines</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span>#1071 Brgy. Kaligayahan / Quirino Highway, Novaliches, Quezon City, Metro Manila, Philippines</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400" />
                <span>Email: <a href="mailto:dpo@bcp.edu.ph" className="text-blue-400 underline">dpo@bcp.edu.ph</a> / <a href="mailto:alumni@bcp.edu.ph" className="text-blue-400 underline">alumni@bcp.edu.ph</a></span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-400" />
                <span>Telephone: (02) 8930-8771 / (02) 8930-8772</span>
              </div>
            </div>
          </section>

          {/* Acknowledgement Footer */}
          <div className="pt-6 border-t border-white/10 text-center space-y-4">
            <p className="text-xs text-slate-400">
              By checking the consent box on the registration form, you confirm that you have read, understood, and consented to the policies herein set forth by Bestlink College of the Philippines.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-lg shadow-blue-600/30"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Alumni Registration
            </Link>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-950 py-8 px-4 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Bestlink College of the Philippines. All rights reserved.</p>
        <p className="mt-1">Protected by Republic Act No. 10173 • National Privacy Commission Registered</p>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
