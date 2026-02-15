import React from 'react';
import { FileText, Download, CreditCard, Tag, ExternalLink, BookOpen, GraduationCap, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PageTransition from '../../components/ui/PageTransition';

const AlumniResources = () => {
   const { user } = useAuth();

  return (
    <PageTransition>
    <div className="space-y-8">

       {/* Hero Banner */}
       <div className="relative h-[200px] rounded-[2.5rem] bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 overflow-hidden shadow-2xl flex items-center px-10">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-white/5 rounded-full -mb-24" />
          <div className="absolute top-1/2 right-20 w-32 h-32 bg-white/5 rounded-full -mt-16" />
          <div className="relative z-10">
             <div className="flex items-center gap-2 mb-3">
                <span className="bg-white/10 border border-white/20 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Resources</span>
             </div>
             <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Alumni Resources</h1>
             <p className="text-blue-100 text-sm font-medium max-w-md">Access your digital ID, request documents, download career guides, and claim exclusive alumni perks.</p>
          </div>
          <BookOpen className="absolute right-12 bottom-6 w-28 h-28 text-white/5" strokeWidth={1} />
       </div>

       <div className="grid md:grid-cols-2 gap-8">

       {/* Left Column: Docs & Guides */}
       <div className="space-y-8">
          {/* Document Requests */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500">
             <div className="flex items-center gap-3 mb-5">
                <div className="p-3 bg-orange-100 rounded-xl"><FileText className="w-6 h-6 text-orange-600"/></div>
                <div>
                   <h3 className="text-xl font-black text-slate-900 tracking-tight">Document Requests</h3>
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Registrar Office</p>
                </div>
             </div>
             <p className="text-sm text-slate-500 mb-6">Need your Transcript (TOR) or Diploma? Request directly from the Registrar.</p>
             <div className="space-y-3">
                {['Transcript of Records', 'Diploma Copy', 'Certificate of Good Moral'].map((doc, idx) => (
                   <div key={idx} className="group flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md cursor-pointer transition-all duration-300">
                      <span className="font-medium text-slate-700 text-sm">{doc}</span>
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all"/>
                   </div>
                ))}
             </div>
          </div>

          {/* Career Guides */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500">
             <div className="flex items-center gap-3 mb-5">
                <div className="p-3 bg-red-100 rounded-xl"><GraduationCap className="w-6 h-6 text-red-600"/></div>
                <div>
                   <h3 className="text-xl font-black text-slate-900 tracking-tight">Career Guides</h3>
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Downloadable PDF</p>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                {['Resume Writing 101', 'Acing the Interview', 'Freelancing Basics'].map((guide, idx) => (
                   <div key={idx} className="group p-5 rounded-[1.5rem] border border-slate-100 text-center hover:border-blue-200 hover:shadow-lg transition-all duration-500 cursor-pointer">
                      <FileText className="w-8 h-8 text-red-500 mx-auto mb-3 group-hover:scale-110 transition-transform"/>
                      <p className="text-xs font-black text-slate-700 mb-1">{guide}</p>
                      <span className="px-2 py-0.5 bg-slate-100 rounded-full text-[10px] font-black text-slate-400">PDF • 2MB</span>
                   </div>
                ))}
             </div>
          </div>
       </div>

       {/* Right Column: ID & Benefits */}
       <div className="space-y-8">

          {/* DIGITAL ID CARD (Glassmorphism) */}
          <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden group">
             <div className="absolute inset-0 bg-white/5 rounded-[2rem]" />
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
             <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl -ml-12 -mb-12" />

             <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                   <img src="/images/Linker College Of The Philippines.png" alt="Logo" className="w-12 h-12 opacity-80"/>
                   <span className="bg-white/10 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border border-white/20 backdrop-blur-sm">Alumni ID</span>
                </div>

                <div className="flex items-end gap-5 mb-8">
                   <div className="w-24 h-24 bg-white/20 rounded-2xl overflow-hidden border-4 border-white/20 shadow-lg">
                      <img src={`https://ui-avatars.com/api/?name=${user?.name || 'Alumni'}&background=random`} className="w-full h-full object-cover"/>
                   </div>
                   <div>
                      <h2 className="text-2xl font-black tracking-wide">{user?.name || 'ALUMNI NAME'}</h2>
                      <p className="text-sm text-blue-200 font-medium">ID: {user?.id?.slice(0,8).toUpperCase() || '2026-0001'}</p>
                      <p className="text-xs text-blue-300 mt-1">Batch 2026 • BS Information Technology</p>
                   </div>
                </div>

                <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                   <p className="text-[10px] text-blue-300 font-bold uppercase tracking-widest">Valid Lifetime Membership</p>
                   <button className="flex items-center gap-2 bg-white/90 backdrop-blur text-blue-900 px-5 py-2.5 rounded-2xl text-xs font-black hover:bg-white hover:shadow-lg transition-all">
                      <Download className="w-3.5 h-3.5"/> Download ID
                   </button>
                </div>
             </div>
          </div>

          {/* Alumni Perks */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500">
             <div className="flex items-center gap-3 mb-5">
                <div className="p-3 bg-purple-100 rounded-xl"><Sparkles className="w-6 h-6 text-purple-600"/></div>
                <div>
                   <h3 className="text-xl font-black text-slate-900 tracking-tight">Alumni Perks</h3>
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Exclusive Discounts</p>
                </div>
             </div>
             <div className="space-y-3">
                {[
                   { store: 'Starbucks', offer: '10% Off on drinks', icon: '☕' },
                   { store: 'National Bookstore', offer: '5% Off on supplies', icon: '📚' },
                   { store: 'Anytime Fitness', offer: 'Waived joining fee', icon: '💪' }
                ].map((perk, idx) => (
                   <div key={idx} className="group flex justify-between items-center bg-slate-50 p-4 rounded-2xl hover:bg-blue-50 transition-all duration-300">
                      <div className="flex items-center gap-3">
                         <span className="text-xl">{perk.icon}</span>
                         <div>
                            <p className="font-black text-slate-800 text-sm">{perk.store}</p>
                            <p className="text-xs text-emerald-600 font-bold">{perk.offer}</p>
                         </div>
                      </div>
                      <button className="text-xs font-black uppercase border border-slate-200 px-4 py-2 rounded-xl hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all">Claim</button>
                   </div>
                ))}
             </div>
          </div>

       </div>
       </div>
    </div>
    </PageTransition>
  );
};

export default AlumniResources;