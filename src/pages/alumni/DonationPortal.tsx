import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Heart, CheckCircle, CreditCard, Smartphone, Download, History, LayoutGrid, Loader2, Image as ImageIcon, ArrowLeft, ChevronRight } from 'lucide-react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

const AlumniDonations = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { width, height } = useWindowSize();
  
  const [activeTab, setActiveTab] = useState<'causes' | 'history'>('causes');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [myHistory, setMyHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // States for Donation Steps
  const [step, setStep] = useState(1);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [form, setForm] = useState({ amount: '', method: 'GCash', proof_url: '' });
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [refNumber, setRefNumber] = useState('');

  useEffect(() => { fetchData(); }, [user]);

  const fetchData = async () => {
    const { data: camps } = await supabase.from('donation_campaigns').select('*').eq('status', 'active');
    setCampaigns(camps || []);

    if (user?.email) {
      const { data: history } = await supabase
        .from('donations')
        .select('*, donation_campaigns(title)')
        .eq('guest_email', user.email)
        .order('created_at', { ascending: false });
      setMyHistory(history || []);
    }
    setLoading(false);
  };

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const fileName = `${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('donations').upload(`proofs/${fileName}`, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('donations').getPublicUrl(`proofs/${fileName}`);
      setForm({ ...form, proof_url: publicUrl });
      showToast({ title: 'Success', message: 'Payment proof attached.', type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Error', message: 'Upload failed.', type: 'error' });
    } finally { setIsUploading(false); }
  };

  const handleDonate = async () => {
    setIsProcessing(true);
    const ref = `ALM-${Date.now().toString().slice(-6)}`;
    try {
      const { error } = await supabase.from('donations').insert([{
        campaign_id: selectedCampaign.id,
        amount: parseFloat(form.amount),
        payment_method: form.method,
        guest_name: user?.name || 'Alumni Member',
        guest_email: user?.email,
        reference_number: ref,
        proof_image_url: form.proof_url,
        status: 'pending'
      }]);
      if (error) throw error;
      setRefNumber(ref);
      setStep(3);
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message, type: 'error' });
    } finally { setIsProcessing(false); }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* 1. HEADER & NAVIGATION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Heart className="w-7 h-7 text-rose-500 fill-rose-500"/> Alumni Giving Hub
          </h1>
          <p className="text-gray-500 text-sm italic">Track your impact and support LCP batchelores.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-2xl w-full md:w-auto">
          <button onClick={() => {setActiveTab('causes'); setStep(1);}} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'causes' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>Causes</button>
          <button onClick={() => setActiveTab('history')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>My History</button>
        </div>
      </div>

      {activeTab === 'causes' ? (
        <div className="space-y-8">
           {/* STEP 1: CHOOSE A CAUSE */}
           {step === 1 && (
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4">
               {campaigns.map(camp => {
  const progress = Math.min((camp.current_amount / camp.target_amount) * 100, 100);
  return (
    <div key={camp.id} onClick={() => { setSelectedCampaign(camp); setStep(2); }} className="group cursor-pointer bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col">
       <div className="h-44 bg-slate-100 relative overflow-hidden">
          <img src={camp.image_url || `https://picsum.photos/seed/${camp.id}/400/200`} onError={(e) => { (e.target as HTMLImageElement).src = '/images/bcpbackground.jpg'; }} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={camp.title} />
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black text-blue-600 uppercase border border-blue-100 shadow-sm">{camp.category}</div>
       </div>
       <div className="p-6">
         <div className="flex justify-between items-start mb-2">
           <h4 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-1 flex-1">{camp.title}</h4>
           <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" /> {/* Ginamit ang ChevronRight */}
         </div>
         <p className="text-xs text-gray-500 line-clamp-2 mb-6">{camp.description}</p>
         <div className="space-y-2">
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
               <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
               <span className="text-emerald-600">₱{camp.current_amount.toLocaleString()}</span>
               <span className="text-gray-400">{progress.toFixed(0)}% Funded</span>
            </div>
         </div>
       </div>
    </div>
  );
})}
             </div>
           )}

           {/* STEP 2: PAYMENT */}
           {step === 2 && selectedCampaign && (
             <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-gray-100 shadow-2xl relative animate-in zoom-in-95">
                <button onClick={() => setStep(1)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5"/></button>
                <div className="text-center mb-8">
                   <p className="text-emerald-500 font-bold text-xs uppercase tracking-widest mb-1">Payment for</p>
                   <h2 className="text-xl font-black text-gray-900">{selectedCampaign.title}</h2>
                </div>
                <div className="space-y-4">
                   <div className="relative">
                      <span className="absolute left-4 top-4 font-bold text-gray-400">₱</span>
                      <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full bg-gray-50 border-gray-100 rounded-xl p-4 pl-8 font-bold text-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0.00" />
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setForm({...form, method: 'GCash'})} className={`py-3 rounded-xl font-bold border flex items-center justify-center gap-2 transition-all ${form.method === 'GCash' ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white text-gray-400 border-gray-100'}`}>
                            <Smartphone className="w-4 h-4" /> GCash {/* Ginamit ang Smartphone icon */}
                        </button>
                        <button onClick={() => setForm({...form, method: 'Maya'})} className={`py-3 rounded-xl font-bold border flex items-center justify-center gap-2 transition-all ${form.method === 'Maya' ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white text-gray-400 border-gray-100'}`}>
                            <CreditCard className="w-4 h-4" /> Maya {/* Ginamit ang CreditCard icon */}
                        </button>
                        </div>
                   <div className="border-2 border-dashed border-gray-100 p-6 rounded-2xl text-center bg-slate-50 hover:bg-slate-100 transition-colors relative">
                      <input type="file" accept="image/*" onChange={e => e.target.files && handleFileUpload(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
                      {/* Line 131: Replace with this to use ImageIcon */}
                        {form.proof_url ? (
                        <div className="flex flex-col items-center text-green-600 font-bold text-xs"><CheckCircle className="w-8 h-8 mb-1"/> Receipt Attached</div>
                        ) : (
                        <div className="text-gray-400 text-xs flex flex-col items-center">
                            <ImageIcon className="w-8 h-8 mb-2 text-gray-300"/> {/* Ginamit ang ImageIcon */}
                            Upload Screenshot
                        </div>
                        )}
                   </div>
                   <button onClick={handleDonate} disabled={isProcessing || !form.amount || !form.proof_url} className="w-full py-4 bg-emerald-500 text-white font-black rounded-2xl shadow-xl hover:bg-emerald-600 transition-all disabled:opacity-50 flex justify-center items-center gap-2">
                      {isProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : 'Confirm Contribution'}
                   </button>
                </div>
             </div>
           )}

           {/* STEP 3: SUCCESS */}
           {step === 3 && (
             <div className="fixed inset-0 bg-emerald-600 z-50 flex items-center justify-center p-4">
                <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />
                <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl text-center max-w-sm z-10 animate-in zoom-in-95">
                   <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle className="w-10 h-10 text-emerald-500 animate-bounce" /></div>
                   <h2 className="text-2xl font-black text-gray-900 mb-2">Contribution Sent!</h2>
                   <p className="text-gray-500 text-sm mb-8">Thank you, <b>{user?.name?.split(' ')[0]}</b>! Your support means a lot to the LCP community.</p>
                   <div className="bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-200 mb-8 text-left">
                      <div className="flex justify-between mb-1"><span className="text-[10px] uppercase text-gray-400 font-bold">Reference</span><span className="font-mono text-xs font-bold text-gray-700">{refNumber}</span></div>
                      <div className="flex justify-between"><span className="text-[10px] uppercase text-gray-400 font-bold">Amount</span><span className="text-xs font-black text-emerald-600">₱{parseFloat(form.amount).toLocaleString()}</span></div>
                   </div>
                   <button onClick={() => {setStep(1); setActiveTab('history'); fetchData();}} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold shadow-lg hover:bg-black transition-all">Close & View Records</button>
                </div>
                {/* Sa loob ng Step 3 div, palitan ang Close button block */}
<div className="flex flex-col gap-2">
   <button onClick={() => window.print()} className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all">
      <Download className="w-4 h-4" /> Save as PDF {/* Ginamit ang Download icon */}
   </button>
   <button onClick={() => {setStep(1); setActiveTab('history'); fetchData();}} className="w-full py-3 text-emerald-700 font-bold hover:bg-emerald-50 rounded-xl transition-all">
      View Giving History
   </button>
</div>
             </div>
           )}
        </div>
      ) : (
        /* MY GIVING HISTORY TAB */
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm animate-in slide-in-from-bottom-4">
          <div className="p-6 border-b border-gray-50 flex items-center gap-2 bg-gray-50/30">
            <History className="w-5 h-5 text-gray-400" />
            <h3 className="font-bold text-gray-800">Giving History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                <tr><th className="p-5">Campaign</th><th className="p-5">Amount</th><th className="p-5">Date</th><th className="p-5">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {myHistory.length === 0 ? (
                  <tr><td colSpan={4} className="p-12 text-center italic text-gray-400">No donation records found. Start your first contribution!</td></tr>
                ) : myHistory.map(don => (
                  <tr key={don.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-5 font-bold text-gray-800">{don.donation_campaigns?.title}</td>
                    <td className="p-5 text-emerald-600 font-black">₱{don.amount.toLocaleString()}</td>
                    <td className="p-5 text-gray-500 text-xs">{new Date(don.created_at).toLocaleDateString()}</td>
                    <td className="p-5"><span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${don.status === 'verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : don.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-yellow-50 text-yellow-600 border-yellow-100'}`}>{don.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlumniDonations;