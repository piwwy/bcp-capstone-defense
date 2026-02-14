import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useToast } from '../context/ToastContext'; // 1. IMPORT TOAST
import { ChevronRight } from 'lucide-react'; // Para sa stepper
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Heart, ArrowLeft, CheckCircle, Loader2, 
  CreditCard, Smartphone, Download, Image as ImageIcon 
} from 'lucide-react';

const PublicDonationPage = () => {
  const { showToast } = useToast(); // 2. USE TOAST HOOK
  const { width, height } = useWindowSize();
  const [searchParams] = useSearchParams(); // <--- Basahin ang URL params
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    amount: '', 
    method: 'GCash',
    proof_image_url: '' 
  });

  // STEPPER DATA
  const steps = [
    { id: 1, name: 'Cause' },
    { id: 2, name: 'Payment' },
    { id: 3, name: 'Receipt' }
  ];
  

  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState(1); // 1: Select, 2: Details, 3: Success
  const [refNumber, setRefNumber] = useState('');
 
  const qrCodes: any = {
    GCash: "https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg", 
    Maya: "https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg",
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // 3. I-update ang fetchCampaigns para i-handle ang auto-select
  const fetchCampaigns = async () => {
    const { data } = await supabase.from('donation_campaigns').select('*').eq('status', 'active');
    if (data) {
      setCampaigns(data);
      
      // AUTO-SELECT LOGIC:
      const urlCampId = searchParams.get('campaignId');
      if (urlCampId) {
        const target = data.find(c => c.id === urlCampId);
        if (target) {
          setSelectedCampaign(target);
          setStep(2); // Talon agad sa Payment step
        }
      }
    }
  };

  const generateReference = () => {
    return `TRX-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
  };

  // --- NEW: PROGRESS PREVIEW LOGIC ---
  const calculatePreview = () => {
    const current = selectedCampaign?.current_amount || 0;
    const target = selectedCampaign?.target_amount || 1;
    const input = parseFloat(form.amount) || 0;
    
    const currentPercent = (current / target) * 100;
    const addedPercent = (input / target) * 100;
    
    return {
      current: Math.min(currentPercent, 100),
      added: Math.min(addedPercent, 100 - currentPercent),
      total: Math.min(((current + input) / target) * 100, 100)
    };
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `proofs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('donations')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('donations')
        .getPublicUrl(filePath);

      setForm(prev => ({ ...prev, proof_image_url: publicUrl }));
      showToast({ title: 'Success', message: 'Proof uploaded!', type: 'success' });
   } catch (error: any) {
  console.error('Upload Error:', error.message);
  // PALITAN ANG ALERT NG TOAST
  showToast({ 
    title: 'Upload Error', 
    message: "Failed to upload image. Please check your storage bucket.", 
    type: 'error' 
  });
} finally {
  setIsUploading(false);
}
  };

  const handleDonate = async () => {
    if ((form.method === 'GCash' || form.method === 'Maya') && !form.proof_image_url) {
     showToast({ title: 'Required', message: 'Please upload your screenshot.', type: 'warning' });
      return;
    }

    setIsProcessing(true);
    const generatedRef = generateReference();
    setRefNumber(generatedRef);
    
    try {
      const { error } = await supabase.from('donations').insert([{
        campaign_id: selectedCampaign.id,
        amount: parseFloat(form.amount),
        payment_method: form.method,
        guest_name: form.name,
        guest_email: form.email,
        reference_number: generatedRef,
        proof_image_url: form.proof_image_url, 
        status: 'pending' 
      }]);

      if (error) throw error;
      setStep(3);
    } catch (err: any) {
      alert("Donation failed: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

 if (step === 3) {
  return (
    <div className="fixed inset-0 bg-green-600 z-50 flex items-center justify-center p-4 animate-in fade-in duration-500 overflow-hidden">
      {/* Confetti should be inside the return, properly placed */}
      <Confetti width={width} height={height} recycle={false} numberOfPieces={500} gravity={0.2} />
      
      <div id="receipt-content" className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 text-center relative overflow-hidden z-10">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-green-500 to-yellow-500"></div>
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
        <p className="text-gray-500 mb-6 text-sm">Thank you for supporting <strong>{selectedCampaign?.title}</strong>.</p>
        
        {/* Receipt Details maintained... */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6 text-left relative border-dashed">
           <div className="flex justify-between mb-2">
              <span className="text-xs text-gray-400 uppercase font-bold">Amount Paid</span>
              <span className="font-bold text-xl text-green-600">₱{Number(form.amount).toLocaleString()}</span>
           </div>
           <div className="flex justify-between mb-2">
              <span className="text-xs text-gray-400 uppercase font-bold">Reference No.</span>
              <span className="font-bold text-gray-800 text-sm font-mono tracking-wider">{refNumber}</span>
           </div>
           <div className="flex justify-between">
              <span className="text-xs text-gray-400 uppercase font-bold">Date</span>
              <span className="text-gray-600 text-sm">{new Date().toLocaleDateString()}</span>
           </div>
        </div>

        <div className="flex flex-col gap-3 print:hidden">
           <div className="flex gap-3">
              <button onClick={() => window.print()} className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-50">
                 <Download className="w-4 h-4"/> Receipt
              </button>
              <button onClick={() => window.location.reload()} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg">
                 Done
              </button>
           </div>
           <button onClick={() => { setStep(1); setForm({...form, amount: '', proof_image_url: ''}); }} className="w-full py-3 border-2 border-emerald-100 text-emerald-700 font-bold rounded-xl hover:bg-emerald-50">
              Donate Again
           </button>
        </div>
      </div>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-emerald-500 selection:text-white pb-20">
      <header className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
        <Link to={searchParams.get('email') ? '/alumni/donations' : '/'} className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" /> {searchParams.get('email') ? 'Back to Portal' : 'Back to Home'}
        </Link>

    {/* --- ADD THIS INSIDE YOUR HEADER --- */}
<nav className="hidden md:flex items-center gap-6">
    
  {steps.map((s, i) => (
    <React.Fragment key={s.id}>
      <div className={`flex items-center gap-2 ${step === s.id ? 'text-emerald-400' : step > s.id ? 'text-white' : 'text-gray-600'}`}>
        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${step >= s.id ? 'border-emerald-400 bg-emerald-400/10' : 'border-gray-600'}`}>
          {step > s.id ? <CheckCircle className="w-3 h-3"/> : s.id}
        </span>
        <span className="text-[10px] font-black uppercase tracking-widest">{s.name}</span>
      </div>
      <div 
  onClick={() => i + 1 < step && setStep(i + 1)} // Pwedeng i-click ang past steps para makabalik
  className={`flex items-center gap-2 cursor-pointer transition-all ${step === s.id ? 'text-emerald-400' : i + 1 < step ? 'text-white' : 'text-gray-600'}`}
></div>
      {i < steps.length - 1 && <ChevronRight className="w-3 h-3 text-gray-800" />}
    </React.Fragment>
  ))}
</nav>


        <div className="flex items-center gap-2">
           <img src="/images/Linker College Of The Philippines.png" className="w-8 h-8" alt="Logo" />
           <span className="font-bold tracking-tight">LCP GIVING</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 py-12">
        {step === 1 && (
            
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">Choose a Cause</h1>
            <p className="text-center text-blue-200/60 mb-10 max-w-xl mx-auto">Select a campaign you want to support.</p>
            <div className="grid md:grid-cols-2 gap-6">
                
              {campaigns.map(camp => (
                <div key={camp.id} onClick={() => { setSelectedCampaign(camp); setStep(2); }} className="group cursor-pointer bg-white/5 border border-white/10 hover:border-emerald-500/50 hover:bg-white/10 rounded-2xl p-6 transition-all relative overflow-hidden">
                  <div className="h-44 bg-slate-800 relative overflow-hidden">
      <img 
        src={camp.image_url || 'https://via.placeholder.com/800x400?text=LCP+Giving'} 
        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" 
        alt={camp.title} 
      />
      <span className="absolute top-4 left-4 bg-emerald-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{camp.category}</span>
    </div>
    
     <h3 className="text-xl font-bold mt-3 mb-2">{camp.title}</h3>
        <p className="text-sm text-gray-300 mb-4 line-clamp-2">{camp.description}</p>          
                  <div className="w-full bg-white/10 rounded-full h-1.5 mt-4">
                     <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${(camp.current_amount / camp.target_amount) * 100}%` }}></div>
                  </div>
                  <p className="text-xs text-right mt-1 text-emerald-400">{(camp.current_amount / camp.target_amount * 100).toFixed(0)}% Funded</p>
                </div>
            
              ))}
            </div> 
          </div>
        )}

        {step === 2 && selectedCampaign && (
          <div className="max-w-lg mx-auto bg-slate-800 border border-white/10 rounded-3xl p-8 animate-in zoom-in-95 duration-300 relative shadow-2xl">
            
            
            <button onClick={() => setStep(1)} className="absolute top-6 right-6 text-white/40 hover:text-white">Change</button>
            <div className="mb-6">
               <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Donating to</span>
               <h2 className="text-2xl font-bold text-white mt-1">{selectedCampaign.title}</h2>
            </div>

            {/* --- PROGRESS PREVIEW UI --- */}
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 mb-6">
            {/* HANAPIN ANG STEP 2 PAYMENT PART SA PublicDonationPage.tsx */}
<div className="space-y-5">
  {searchParams.get('name') && searchParams.get('email') ? (
    /* VERSION NA MAY CAMPAIGN IMAGE */
    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-5 flex items-center gap-5 animate-in fade-in zoom-in-95">
      <div className="relative">
        {/* Campaign Image mula sa Database */}
        <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-lg shadow-emerald-500/20 bg-slate-800">
          <img 
            src={selectedCampaign?.image_url || 'https://via.placeholder.com/150?text=LCP+Giving'} 
            className="w-full h-full object-cover opacity-90" 
            alt="Campaign Header" 
          />
        </div>
        {/* Verification Check Badge */}
        <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 border-2 border-slate-800">
          <CheckCircle className="w-4 h-4 text-white" />
        </div>
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
           <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Verified Contributor</p>
        </div>
        <p className="font-black text-lg text-white leading-tight">{form.name}</p>
        <p className="text-xs text-gray-400 font-medium">{form.email}</p>
      </div>
    </div>
  ) : (
    /* REGULAR GUEST INPUTS */
    <div className="grid grid-cols-2 gap-4">
       <input 
         value={form.name} 
         onChange={e => setForm({...form, name: e.target.value})} 
         className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm" 
         placeholder="Your Name"
       />
       <input 
         type="email" 
         value={form.email} 
         onChange={e => setForm({...form, email: e.target.value})} 
         className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm" 
         placeholder="Email Address"
       />
    </div>
  )}
</div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-gray-400">Campaign Impact</span>
                <span className="text-emerald-400 font-bold">
                  {calculatePreview().total.toFixed(1)}% {parseFloat(form.amount) > 0 && '(+ contribution)'}
                </span>
              </div>
              <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-slate-600 transition-all duration-500"
                  style={{ width: `${calculatePreview().current}%` }}
                />
                <div 
                  className="h-full bg-emerald-500 animate-pulse transition-all duration-500"
                  style={{ width: `${calculatePreview().added}%` }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <p className="text-[10px] text-gray-500">Goal: ₱{selectedCampaign.target_amount.toLocaleString()}</p>
                <p className="text-[10px] text-emerald-400 font-bold">Current: ₱{selectedCampaign.current_amount.toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-5">
               <div>
                 <label className="block text-xs font-bold text-blue-200/50 uppercase mb-2">Donation Amount (PHP)</label>
                 <div className="relative">
                    <span className="absolute left-4 top-3.5 text-emerald-400 font-bold">₱</span>
                    <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-lg" placeholder="0.00"/>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm" placeholder="Your Name"/>
                 <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm" placeholder="Email Address"/>
               </div>

               <div>
                 <label className="block text-xs font-bold text-blue-200/50 uppercase mb-2">Select Payment Method</label>
                 <div className="grid grid-cols-3 gap-3">
                    {['GCash', 'Maya', 'Stripe'].map(m => (
                       <button key={m} onClick={() => setForm({...form, method: m})} className={`py-3 rounded-xl text-sm font-bold border flex flex-col items-center gap-1 transition-all ${form.method === m ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-slate-900 border-white/10 text-white/60 hover:bg-slate-700'}`}>
                         {m === 'Stripe' ? <CreditCard className="w-4 h-4"/> : <Smartphone className="w-4 h-4"/>}
                         {m}
                       </button>
                    ))}
                 </div>
               </div>

               {/* UPLOAD SECTION */}
               <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5 mt-4">
                  {(form.method === 'GCash' || form.method === 'Maya') && (
                    <div className="text-center animate-in fade-in">
                        <p className="text-sm text-gray-400 mb-3">Scan this QR Code using your {form.method} App</p>
                        <div className="bg-white p-3 rounded-xl inline-block mb-3">
                           <img src={qrCodes[form.method]} alt="QR Code" className="w-32 h-32 opacity-90" />
                        </div>
                        <p className="text-xs text-gray-500">Account: Linker Alumni Association</p>
                    </div>
                  )}

               {(form.method === 'GCash' || form.method === 'Maya') && (
                 <div className="mt-4 animate-in fade-in duration-300">
                    <label className="block text-xs font-bold text-gray-400 mb-2">Upload Proof of Payment (Screenshot)</label>
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                        }}
                        className="w-full bg-slate-900 border border-dashed border-white/20 rounded-xl p-3 text-xs file:hidden cursor-pointer"
                      />
                      <ImageIcon className="absolute right-3 top-3 w-4 h-4 text-gray-500" />
                    </div>
                    {isUploading && <p className="text-[10px] text-emerald-400 mt-1 animate-pulse italic">Uploading to storage...</p>}
                    {form.proof_image_url && <p className="text-[10px] text-green-400 mt-1 flex items-center gap-1 font-bold"><CheckCircle className="w-3 h-3"/> Image ready for verification!</p>}
                    <p className="text-[10px] text-gray-500 mt-1 italic">*Required for manual verification.</p>
                 </div>
               )}

               

                  {form.method === 'Stripe' && (
                    <div className="space-y-3 animate-in fade-in">
                        <div className="flex gap-2 mb-2">
                           <div className="h-8 w-12 bg-white/10 rounded flex items-center justify-center"><ImageIcon className="w-4 h-4 text-gray-600"/></div>
                           <div className="h-8 w-12 bg-white/10 rounded flex items-center justify-center"><ImageIcon className="w-4 h-4 text-gray-600"/></div>
                        </div>
                        <input className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-sm text-white" placeholder="Card Number (xxxx xxxx xxxx xxxx)" />
                        <div className="grid grid-cols-2 gap-3">
                           <input className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-sm text-white" placeholder="MM / YY" />
                           <input className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-sm text-white" placeholder="CVC" />
                        </div>
                        <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Payments are secured by Stripe</p>
                    </div>
                  )}
               </div>

               <button 
                 onClick={handleDonate}
                 disabled={isProcessing || isUploading || !form.amount || !form.name}
                 className="w-full mt-4 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl font-bold text-white shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-transform flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {isProcessing ? <Loader2 className="w-5 h-5 animate-spin"/> : <>Complete Payment <Heart className="w-4 h-4 fill-white"/></>}
               </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
<style>{`
  @media print {
    body * { visibility: hidden; }
    #receipt-content, #receipt-content * { visibility: visible; }
    #receipt-content { 
      position: absolute; 
      left: 50%; 
      top: 50%; 
      transform: translate(-50%, -50%); 
      width: 100%;
      border: none !important;
      box-shadow: none !important;
    }
  }
`}</style>

export default PublicDonationPage;