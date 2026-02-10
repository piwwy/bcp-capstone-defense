import React from 'react';
import { FileText, Download, CreditCard, Tag, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AlumniResources = () => {
   const { user } = useAuth();

  return (
    <div className="grid md:grid-cols-2 gap-8 animate-in fade-in">
       
       {/* Left Column: Docs & Guides */}
       <div className="space-y-8">
          {/* Document Requests */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
             <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><FileText className="w-6 h-6"/></div>
                <h3 className="text-xl font-bold text-gray-900">Document Requests</h3>
             </div>
             <p className="text-sm text-gray-500 mb-6">Need your Transcript (TOR) or Diploma? Request directly from the Registrar.</p>
             <div className="space-y-3">
                {['Transcript of Records', 'Diploma Copy', 'Certificate of Good Moral'].map((doc, idx) => (
                   <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors">
                      <span className="font-medium text-gray-700 text-sm">{doc}</span>
                      <ExternalLink className="w-4 h-4 text-gray-400"/>
                   </div>
                ))}
             </div>
          </div>

          {/* Career Guides */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
             <h3 className="font-bold text-gray-900 mb-4">Career Guides (PDF)</h3>
             <div className="grid grid-cols-2 gap-4">
                {['Resume Writing 101', 'Acing the Interview', 'Freelancing Basics'].map((guide, idx) => (
                   <div key={idx} className="p-4 border border-gray-100 rounded-xl text-center hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer">
                      <FileText className="w-8 h-8 text-red-500 mx-auto mb-2"/>
                      <p className="text-xs font-bold text-gray-700">{guide}</p>
                      <span className="text-[10px] text-gray-400">PDF • 2MB</span>
                   </div>
                ))}
             </div>
          </div>
       </div>

       {/* Right Column: ID & Benefits */}
       <div className="space-y-8">
          
          {/* DIGITAL ID CARD (Visual Highlight) */}
          <div className="bg-gradient-to-br from-blue-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-32 bg-white opacity-5 rounded-full blur-3xl -mr-16 -mt-16"></div>
             
             <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                   <img src="/images/Linker College Of The Philippines.png" alt="Logo" className="w-10 h-10 opacity-80"/>
                   <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border border-white/20">Alumni ID</span>
                </div>
                
                <div className="flex items-end gap-4 mb-6">
                   <div className="w-20 h-20 bg-white/20 rounded-xl overflow-hidden border-2 border-white/30">
                      {/* Avatar Placeholder */}
                      <img src={`https://ui-avatars.com/api/?name=${user?.name || 'Alumni'}`} className="w-full h-full object-cover"/>
                   </div>
                   <div>
                      <h2 className="text-xl font-bold tracking-wide">{user?.name || 'ALUMNI NAME'}</h2>
                      <p className="text-sm text-blue-200">ID: {user?.id?.slice(0,8).toUpperCase() || '2026-0001'}</p>
                      <p className="text-xs text-blue-300 mt-1">Batch 2026 • BS Information Technology</p>
                   </div>
                </div>

                <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                   <p className="text-[10px] text-blue-300">Valid Lifetime Membership</p>
                   <button className="flex items-center gap-2 bg-white text-blue-900 px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-50">
                      <Download className="w-3 h-3"/> Download ID
                   </button>
                </div>
             </div>
          </div>

          {/* Benefits */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
             <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Tag className="w-6 h-6"/></div>
                <h3 className="text-xl font-bold text-gray-900">Alumni Perks</h3>
             </div>
             <div className="space-y-4">
                {[
                   { store: 'Starbucks', offer: '10% Off on drinks' },
                   { store: 'National Bookstore', offer: '5% Off on supplies' },
                   { store: 'Anytime Fitness', offer: 'Waived joining fee' }
                ].map((perk, idx) => (
                   <div key={idx} className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                      <div>
                         <p className="font-bold text-gray-800 text-sm">{perk.store}</p>
                         <p className="text-xs text-green-600 font-bold">{perk.offer}</p>
                      </div>
                      <button className="text-xs border border-gray-300 px-3 py-1 rounded hover:bg-gray-50">Claim</button>
                   </div>
                ))}
             </div>
          </div>

       </div>
    </div>
  );
};

export default AlumniResources;