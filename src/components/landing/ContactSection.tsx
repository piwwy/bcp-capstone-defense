import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, Facebook, Linkedin, Twitter, Clock, Building2, Globe, ShieldCheck, Users, Briefcase, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../../context/ToastContext';

const ContactSection: React.FC = () => {
  const { showToast } = useToast();
  const [formTab, setFormTab] = useState<'general' | 'company'>('general');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    companyName: '',
    contactPerson: '',
    companyEmail: '',
    companyPhone: '',
    positionOffered: '',
    companyMessage: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitting(true);
    try {
      const payload = formTab === 'company'
        ? {
          inquiry_type: 'company',
          company_name: formData.companyName,
          contact_person: formData.contactPerson,
          company_email: formData.companyEmail,
          company_phone: formData.companyPhone || null,
          position_offered: formData.positionOffered,
          company_message: formData.companyMessage || null,
          status: 'pending',
          routed_to_osa: false,
          routed_to_hr: false,
        }
        : {
          inquiry_type: 'general',
          name: formData.name,
          email: formData.email,
          message: formData.message,
          status: 'pending',
          routed_to_osa: false,
          routed_to_hr: false,
        };

      const { error } = await supabase.from('contact_inquiries').insert([payload]);
      if (error) throw error;

      showToast({
        type: 'success',
        title: formTab === 'company' ? 'Inquiry Received' : 'Message Sent',
        message: formTab === 'company'
          ? 'Your company inquiry was submitted and is now pending admin review.'
          : 'Your message was sent successfully. We will get back to you soon.',
      });

      setFormData({
        name: '',
        email: '',
        message: '',
        companyName: '',
        contactPerson: '',
        companyEmail: '',
        companyPhone: '',
        positionOffered: '',
        companyMessage: '',
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Submission Failed',
        message: error.message || 'Unable to submit inquiry right now. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const partners = [
    { name: "TESDA", type: "Government", contact: "tesda.gov.ph", email: "info@tesda.gov.ph", phone: "(02) 8887-7777", desc: "Technical Education & Skills Development Authority" },
    { name: "CHED", type: "Government", contact: "ched.gov.ph", email: "info@ched.gov.ph", phone: "(02) 8442-0508", desc: "Commission on Higher Education" },
    { name: "Quezon City Gov't", type: "LGU", contact: "quezoncity.gov.ph", email: "publicinfo@quezoncity.gov.ph", phone: "(02) 8988-4242", desc: "Local Government Unit" },
    { name: "Accenture", type: "Industry Partner", contact: "accenture.com/ph-en", email: "careers@accenture.com", phone: "(02) 8841-5600", desc: "Global Technology & Consulting" },
    { name: "Converge ICT", type: "Industry Partner", contact: "convergeict.com", email: "hr@convergeict.com", phone: "(02) 8667-0850", desc: "Fiber Internet & Telecom" },
    { name: "SM Supermalls", type: "Industry Partner", contact: "smsupermalls.com", email: "careers@smsupermalls.com", phone: "(02) 8862-7200", desc: "Retail & Mall Operations" },
  ];

  return (
    <section id="contact" className="relative py-24 bg-transparent overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20 mb-6">
            <Mail className="w-4 h-4 text-blue-300" />
            <span className="text-sm text-blue-300 font-medium">Get in Touch</span>
          </div>

          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            Connect With
            <span className="bg-gradient-to-r from-blue-400 to-sky-400 bg-clip-text text-transparent">
              {' '}Our Team
            </span>
          </h2>

          <p className="text-lg text-blue-100/70 max-w-2xl mx-auto">
            Whether you're an alumni, a partner company, or an employer looking to hire —
            reach out to us. All inquiries are verified by our admin team.
          </p>
        </div>

        {/* Contact Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-20">
          {/* Contact Form with Tabs */}
          <div className="lg:col-span-2">
            <div className="p-8 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10">
              {/* Form Tabs */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setFormTab('general')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${formTab === 'general' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'bg-white/5 text-blue-200/70 hover:bg-white/10'}`}
                >
                  <Users className="w-4 h-4" /> General Inquiry
                </button>
                <button
                  onClick={() => setFormTab('company')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${formTab === 'company' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'bg-white/5 text-blue-200/70 hover:bg-white/10'}`}
                >
                  <Building2 className="w-4 h-4" /> Company / Employer Inquiry
                </button>
              </div>

              {formTab === 'general' ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-blue-200/80 mb-2">Your Full Name</label>
                      <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Juan Dela Cruz" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-200/80 mb-2">Email Address</label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="juan@example.com" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-200/80 mb-2">Your Message</label>
                    <textarea name="message" value={formData.message} onChange={handleChange} rows={5} placeholder="Tell us what's on your mind..." className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 resize-none" required />
                  </div>
                  <button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transform hover:scale-[1.02] transition-all duration-300 shadow-xl shadow-blue-500/25 disabled:opacity-70 disabled:cursor-not-allowed">
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />} {submitting ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Admin verification badge */}
                  <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <ShieldCheck className="w-8 h-8 text-blue-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-blue-300">Admin-Verified Inquiries</p>
                      <p className="text-xs text-blue-200/70 mt-0.5">All company inquiries are reviewed by our admin team to ensure legitimacy before connecting with alumni.</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-blue-200/80 mb-2">Company Name</label>
                      <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="e.g. Acme Corp" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-200/80 mb-2">Contact Person</label>
                      <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} placeholder="Full Name" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300" required />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-blue-200/80 mb-2">Company Email</label>
                      <input type="email" name="companyEmail" value={formData.companyEmail} onChange={handleChange} placeholder="hr@company.com" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-200/80 mb-2">Phone Number</label>
                      <input type="tel" name="companyPhone" value={formData.companyPhone} onChange={handleChange} placeholder="(02) 1234-5678" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-200/80 mb-2">Position(s) You're Hiring For</label>
                    <input type="text" name="positionOffered" value={formData.positionOffered} onChange={handleChange} placeholder="e.g. Software Engineer, Data Analyst" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-200/80 mb-2">Additional Details</label>
                    <textarea name="companyMessage" value={formData.companyMessage} onChange={handleChange} rows={4} placeholder="Tell us about your company and what you're looking for in candidates..." className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 resize-none" />
                  </div>
                  <button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transform hover:scale-[1.02] transition-all duration-300 shadow-xl shadow-blue-500/25 disabled:opacity-70 disabled:cursor-not-allowed">
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />} {submitting ? 'Submitting...' : 'Submit Company Inquiry'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            {/* Office Info Card */}
            <div className="p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-blue-500/30 transition-all duration-300">
              <h3 className="text-lg font-semibold text-white mb-4">BCP Main Campus</h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Address</p>
                    <p className="text-sm text-blue-200/70">1071 Quirino Highway, Brgy. Kaligayahan,<br />Novaliches, Quezon City</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-sky-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-sky-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Office Hours</p>
                    <p className="text-sm text-blue-200/70">Monday – Saturday, 8:00 AM – 5:00 PM</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Email</p>
                    <p className="text-sm text-blue-200/70">bcp-inquiry@bcp.edu.ph</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Phone</p>
                    <p className="text-sm text-blue-200/70">(02) 8135-8603</p>
                  </div>
                </div>
              </div>
            </div>

            {/* How It Works Card */}
            <div className="p-6 bg-gradient-to-br from-blue-500/10 to-sky-500/10 backdrop-blur-sm rounded-2xl border border-blue-500/20">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" /> For Companies
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-200/70">Submit your inquiry via the Company form</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-200/70">Admin reviews & verifies your company</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-200/70">Job postings go live on the Alumni Job Board</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-200/70">Connect directly with qualified alumni</p>
                </div>
              </div>
            </div>

            {/* Social Links Card */}
            <div className="p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-blue-500/30 transition-all duration-300">
              <h3 className="text-lg font-semibold text-white mb-4">Follow Us</h3>

              <div className="flex gap-3">
                <a href="https://www.facebook.com/lcpofficialpage" target="_blank" rel="noreferrer" className="w-12 h-12 bg-blue-600/20 hover:bg-blue-600/30 rounded-xl flex items-center justify-center transition-all duration-300 group">
                  <Facebook className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform duration-300" />
                </a>
                <a href="#" className="w-12 h-12 bg-sky-600/20 hover:bg-sky-600/30 rounded-xl flex items-center justify-center transition-all duration-300 group">
                  <Twitter className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform duration-300" />
                </a>
                <a href="#" className="w-12 h-12 bg-blue-700/20 hover:bg-blue-700/30 rounded-xl flex items-center justify-center transition-all duration-300 group">
                  <Linkedin className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform duration-300" />
                </a>
              </div>
            </div>

            {/* Map Card */}
            <div className="p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
              <div className="aspect-video bg-dark-600 rounded-xl overflow-hidden relative">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3859.2292398435343!2d121.0423183143216!3d14.700140989736868!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397b0d8a1c5d369%3A0x66c729b760255309!2sBestlink%20College%20of%20the%20Philippines!5e0!3m2!1sen!2sph!4v1675234567890!5m2!1sen!2sph"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="BCP Location - Novaliches, Quezon City"
                  className="grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Partners Section with Contact Info */}
        <div className="border-t border-white/10 pt-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20 mb-4">
              <Briefcase className="w-4 h-4 text-blue-300" />
              <span className="text-sm text-blue-300 font-medium">Industry Partners</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Our Industry Linkages & Partners</h3>
            <p className="text-blue-200/60 text-sm max-w-xl mx-auto">Working together to build better opportunities for our alumni. Contact our partners directly or reach them through the alumni office.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {partners.map((partner, idx) => (
              <div
                key={idx}
                className="group p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-blue-500/30 hover:bg-white/10 transition-all duration-300"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                    {partner.type === 'Government' || partner.type === 'LGU' ? (
                      <Globe className="w-6 h-6 text-blue-400" />
                    ) : (
                      <Building2 className="w-6 h-6 text-sky-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">{partner.name}</h4>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">{partner.type}</p>
                    <p className="text-xs text-blue-200/50 mt-0.5">{partner.desc}</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-blue-200/60">
                    <Mail className="w-3.5 h-3.5 text-blue-400/60 flex-shrink-0" />
                    <span className="truncate">{partner.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-200/60">
                    <Phone className="w-3.5 h-3.5 text-sky-400/60 flex-shrink-0" />
                    <span>{partner.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-200/60">
                    <Globe className="w-3.5 h-3.5 text-blue-400/60 flex-shrink-0" />
                    <span className="truncate">{partner.contact}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;