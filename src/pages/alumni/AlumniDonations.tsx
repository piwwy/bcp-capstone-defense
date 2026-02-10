import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';

import {
  Heart,
  Download, History, LayoutGrid, Loader2,
  Image as ChevronRight, ExternalLink, X, Trophy, Award
} from 'lucide-react';

const AlumniDonations = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'causes' | 'history'>('causes');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [myHistory, setMyHistory] = useState<any[]>([]);
  const [topDonors, setTopDonors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // States para sa Redirect Logic
  const [isRedirectModalOpen, setIsRedirectModalOpen] = useState(false);
  const [targetCampaign, setTargetCampaign] = useState<any>(null);

  useEffect(() => {
    // Only fetch if we have user data or after initial auth check
    const timer = setTimeout(() => {
      fetchData();
    }, 100); // Small delay to let auth context settle

    return () => clearTimeout(timer);
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Active Campaigns (always works, no auth needed)
      const { data: camps } = await supabase.from('donation_campaigns').select('*').eq('status', 'active');
      setCampaigns(camps || []);

      // 2. Fetch Personal History base sa email ng logged-in alumni
      if (user?.email) {
        const { data: history } = await supabase
          .from('donations')
          .select('*, donation_campaigns(title)')
          .eq('guest_email', user.email)
          .order('created_at', { ascending: false });
        setMyHistory(history || []);
      }

      // 3. Fetch Top Donators (aggregated by email, verified only)
      const { data: allDonations } = await supabase
        .from('donations')
        .select('guest_name, guest_email, amount, status')
        .eq('status', 'verified');

      if (allDonations && allDonations.length > 0) {
        const aggregated: Record<string, { name: string; email: string; total: number }> = {};
        allDonations.forEach(d => {
          const key = d.guest_email || d.guest_name || 'Anonymous';
          if (!aggregated[key]) aggregated[key] = { name: d.guest_name || 'Anonymous', email: d.guest_email || '', total: 0 };
          aggregated[key].total += d.amount || 0;
        });
        const sorted = Object.values(aggregated).sort((a, b) => b.total - a.total).slice(0, 10);
        setTopDonors(sorted);
      }
    } catch (err) {
      console.error('AlumniDonations fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

      {/* 1. HEADER & NAVIGATION TABS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Heart className="w-7 h-7 text-rose-500 fill-rose-500" /> Alumni Giving Hub
          </h1>
          <p className="text-gray-500 text-sm italic">Track your impact and support new LCP initiatives.</p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-2xl w-full md:w-auto">
          <button
            onClick={() => setActiveTab('causes')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'causes' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
          >
            <LayoutGrid className="w-4 h-4" /> Browse Causes
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
          >
            <History className="w-4 h-4" /> My Giving
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* MAIN CONTENT (3 cols) */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm font-bold uppercase tracking-widest">Loading Records...</p>
            </div>
          ) : activeTab === 'causes' ? (
            /* --- CAUSES GRID: Visual cards katulad ng Landing Page --- */
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
              {campaigns.length === 0 ? (
                <div className="col-span-full py-20 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 text-gray-400 italic">
                  No active fundraisers at the moment.
                </div>
              ) : campaigns.map(camp => {
                const progress = Math.min((camp.current_amount / camp.target_amount) * 100, 100);
                return (
                  <div
                    key={camp.id}
                    onClick={() => {
                      setTargetCampaign(camp);
                      setIsRedirectModalOpen(true);
                    }}
                    className="group cursor-pointer bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col"
                  >
                    <div className="h-44 bg-slate-100 relative overflow-hidden">
                      <img src={camp.image_url || 'https://via.placeholder.com/400x200'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={camp.title} />
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black text-blue-600 uppercase border border-blue-100 shadow-sm">{camp.category}</div>
                    </div>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-1 flex-1">{camp.title}</h4>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-6 h-8">{camp.description || 'No description provided.'}</p>
                      <div className="space-y-2 mt-auto">
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
          ) : (
            /* --- MY GIVING HISTORY TAB --- */
            <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm animate-in slide-in-from-bottom-4">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-500" />
                  <h3 className="font-bold text-gray-800">My Contribution Records</h3>
                </div>
                <button onClick={() => window.print()} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                  <Download className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                    <tr>
                      <th className="p-5">Campaign Name</th>
                      <th className="p-5">Amount</th>
                      <th className="p-5">Date Paid</th>
                      <th className="p-5">Verification Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {myHistory.length === 0 ? (
                      <tr><td colSpan={4} className="p-16 text-center italic text-gray-400">You haven't made any donations yet. Start by choosing a cause above!</td></tr>
                    ) : myHistory.map(don => (
                      <tr key={don.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-5 font-bold text-gray-800">{don.donation_campaigns?.title || 'Unknown Campaign'}</td>
                        <td className="p-5 text-emerald-600 font-black">₱{don.amount.toLocaleString()}</td>
                        <td className="p-5 text-gray-500 text-xs">{new Date(don.created_at).toLocaleDateString()}</td>
                        <td className="p-5">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${don.status === 'verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                              don.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                'bg-yellow-50 text-yellow-600 border-yellow-100'
                            }`}>
                            {don.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR: Top Donators */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-20">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-white">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                <h3 className="font-black text-sm uppercase tracking-wider">Top Donators</h3>
              </div>
              <p className="text-amber-100 text-[10px] mt-1">Our most generous alumni</p>
            </div>
            <div className="p-4 space-y-1">
              {topDonors.length === 0 ? (
                <p className="text-center text-gray-400 text-xs py-6 italic">No verified donations yet.</p>
              ) : topDonors.map((donor, idx) => {
                const medal = idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-orange-400' : 'text-gray-300';
                return (
                  <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${idx < 3 ? 'bg-amber-50/50' : 'hover:bg-gray-50'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${idx < 3 ? 'bg-amber-100' : 'bg-gray-100'} ${medal}`}>
                      {idx < 3 ? <Award className="w-4 h-4" /> : idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800 truncate">{donor.name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{donor.email ? donor.email.replace(/(.{2}).+(@.+)/, '$1***$2') : ''}</p>
                    </div>
                    <span className="text-xs font-black text-emerald-600 whitespace-nowrap">₱{donor.total.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
            {topDonors.length > 0 && (
              <div className="px-4 pb-4">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-gray-400 font-bold">Total from Top {topDonors.length}</p>
                  <p className="text-lg font-black text-emerald-600">₱{topDonors.reduce((s, d) => s + d.total, 0).toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* --- REDIRECT MODAL (Permission Logic) --- */}
      {isRedirectModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-sm shadow-2xl text-center relative animate-in zoom-in-95">
            <button onClick={() => setIsRedirectModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>

            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <ExternalLink className="w-10 h-10" />
            </div>

            <h3 className="text-2xl font-black text-gray-900 mb-2">Donate to this Cause?</h3>
            <p className="text-sm text-gray-500 mb-8 px-4 leading-relaxed">
              You are about to be redirected to our <b>Secure Donation Portal</b> to complete your contribution for {targetCampaign?.title}.
            </p>

            <div className="flex flex-col gap-3">
              <Link
                to={`/donate?campaignId=${targetCampaign?.id}&name=${encodeURIComponent(user?.name || '')}&email=${user?.email}`}
                className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 group"
              >
                Proceed to Portal <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button
                onClick={() => setIsRedirectModalOpen(false)}
                className="w-full py-3 text-gray-400 font-bold hover:text-gray-600 transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AlumniDonations;