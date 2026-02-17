import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import PageTransition from '../../components/ui/PageTransition';
import { CardGridSkeleton } from '../../components/ui/Skeleton';

import {
  Heart,
  Download, History, LayoutGrid, Loader2,
  Image as ChevronRight, ExternalLink, X, Trophy, Award,
  TrendingUp, Target, Wallet
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
    const timer = setTimeout(() => {
      fetchData();
    }, 100);
    return () => clearTimeout(timer);
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

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

  const totalRaised = campaigns.reduce((s, c) => s + (c.current_amount || 0), 0);
  const myTotal = myHistory.filter(d => d.status === 'verified').reduce((s, d) => s + (d.amount || 0), 0);

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Hero Banner */}
        <div className="relative h-[240px] rounded-[2.5rem] bg-gradient-to-r from-rose-600 via-pink-600 to-orange-500 overflow-hidden shadow-2xl flex items-center px-10">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-1/3 w-56 h-56 bg-white/5 rounded-full -mb-28" />
          <div className="absolute top-1/2 right-24 w-40 h-40 bg-white/5 rounded-full -mt-20" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-white/10 border border-white/20 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Giving Hub</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter mb-2 flex items-center gap-3">
              <Heart className="w-9 h-9 fill-white/20" /> Alumni Giving Hub
            </h1>
            <p className="text-rose-100 text-sm font-medium max-w-lg">Track your impact and support new LCP initiatives. Every contribution makes a difference.</p>
          </div>
          <Heart className="absolute right-12 bottom-6 w-32 h-32 text-white/5" strokeWidth={1} />
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-300">
            <div className="p-3 bg-emerald-100 rounded-xl"><TrendingUp className="w-6 h-6 text-emerald-600" /></div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Raised</p>
              <p className="text-2xl font-black text-slate-900">₱{totalRaised.toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-300">
            <div className="p-3 bg-blue-100 rounded-xl"><Target className="w-6 h-6 text-blue-600" /></div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active Campaigns</p>
              <p className="text-2xl font-black text-slate-900">{campaigns.length}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-300">
            <div className="p-3 bg-purple-100 rounded-xl"><Wallet className="w-6 h-6 text-purple-600" /></div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">My Total Donations</p>
              <p className="text-2xl font-black text-slate-900">₱{myTotal.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Tab Pills */}
        <div className="flex bg-white/80 p-1.5 rounded-2xl border border-slate-100 shadow-sm w-full md:w-auto md:inline-flex">
          <button
            onClick={() => setActiveTab('causes')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'causes' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
          >
            <LayoutGrid className="w-4 h-4" /> Browse Causes
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
          >
            <History className="w-4 h-4" /> My Giving
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* MAIN CONTENT (3 cols) */}
          <div className="lg:col-span-3">
            {loading ? (
              <CardGridSkeleton count={3} cols={3} />
            ) : activeTab === 'causes' ? (
              /* --- CAUSES GRID --- */
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.length === 0 ? (
                  <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                    <Heart className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <p className="font-black text-slate-400 text-lg">No Active Fundraisers</p>
                    <p className="text-sm text-slate-300 mt-1">Check back soon for new campaigns.</p>
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
                      className="group cursor-pointer bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 overflow-hidden flex flex-col"
                    >
                      <div className="h-44 bg-slate-100 relative overflow-hidden">
                        <img src={camp.image_url || `https://picsum.photos/seed/${camp.id}/400/200`} onError={(e) => { (e.target as HTMLImageElement).src = '/images/bcpbackground.jpg'; }} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={camp.title} />
                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black text-blue-600 uppercase border border-blue-100 shadow-sm">{camp.category}</div>
                      </div>
                      <div className="p-6 flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-black text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1 flex-1">{camp.title}</h4>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 mb-6 h-8">{camp.description || 'No description provided.'}</p>
                        <div className="space-y-2 mt-auto">
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                          </div>
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                            <span className="text-emerald-600">₱{camp.current_amount.toLocaleString()}</span>
                            <span className="text-slate-400">{progress.toFixed(0)}% Funded</span>
                          </div>
                        </div>
                        <button className="mt-4 w-full py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95">
                          Donate Now
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* --- MY GIVING HISTORY TAB --- */
              <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-blue-500" />
                    <h3 className="font-black text-slate-800">My Contribution Records</h3>
                  </div>
                  <button onClick={() => window.print()} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                    <Download className="w-5 h-5" />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest">
                      <tr>
                        <th className="p-5">Campaign Name</th>
                        <th className="p-5">Amount</th>
                        <th className="p-5">Date Paid</th>
                        <th className="p-5">Verification Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {myHistory.length === 0 ? (
                        <tr><td colSpan={4} className="p-16 text-center">
                          <Wallet className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                          <p className="font-black text-slate-400">No Donations Yet</p>
                          <p className="text-xs text-slate-300 mt-1">Start by choosing a cause above!</p>
                        </td></tr>
                      ) : myHistory.map(don => (
                        <tr key={don.id} className="hover:bg-blue-50/50 transition-colors duration-200">
                          <td className="p-5 font-bold text-slate-800">{don.donation_campaigns?.title || 'Unknown Campaign'}</td>
                          <td className="p-5 text-emerald-600 font-black">₱{don.amount.toLocaleString()}</td>
                          <td className="p-5 text-slate-500 text-xs">{new Date(don.created_at).toLocaleDateString()}</td>
                          <td className="p-5">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${don.status === 'verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
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
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden sticky top-20">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  <h3 className="font-black text-sm uppercase tracking-wider">Top Donators</h3>
                </div>
                <p className="text-amber-100 text-[10px] mt-1">Our most generous alumni</p>
              </div>
              <div className="p-4 space-y-1">
                {topDonors.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 font-bold">No verified donations yet.</p>
                  </div>
                ) : topDonors.map((donor, idx) => {
                  const medalColors = ['text-amber-500 bg-amber-100', 'text-slate-400 bg-slate-100', 'text-orange-400 bg-orange-100'];
                  const bgColor = idx < 3 ? ['bg-gradient-to-r from-amber-50 to-transparent', 'bg-gradient-to-r from-slate-50 to-transparent', 'bg-gradient-to-r from-orange-50 to-transparent'][idx] : 'hover:bg-slate-50';
                  return (
                    <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${bgColor}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${idx < 3 ? medalColors[idx] : 'bg-slate-100 text-slate-400'}`}>
                        {idx < 3 ? <Award className="w-4 h-4" /> : idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-slate-800 truncate">{donor.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{donor.email ? donor.email.replace(/(.{2}).+(@.+)/, '$1***$2') : ''}</p>
                      </div>
                      <span className="text-xs font-black text-emerald-600 whitespace-nowrap">₱{donor.total.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
              {topDonors.length > 0 && (
                <div className="px-4 pb-4">
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 p-4 text-center">
                    <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Total from Top {topDonors.length}</p>
                    <p className="text-xl font-black text-emerald-600">₱{topDonors.reduce((s, d) => s + d.total, 0).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* --- REDIRECT MODAL --- */}
        {isRedirectModalOpen && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
            <div className="bg-white p-10 rounded-[3rem] w-full max-w-sm shadow-2xl text-center relative animate-in zoom-in-95">
              <button onClick={() => setIsRedirectModalOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 hover:rotate-90 transition-all">
                <X className="w-5 h-5" />
              </button>

              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <ExternalLink className="w-10 h-10" />
              </div>

              <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-2">Donate to this Cause?</h3>
              <p className="text-sm text-slate-500 mb-8 px-4 leading-relaxed">
                You are about to be redirected to our <b>Secure Donation Portal</b> to complete your contribution for {targetCampaign?.title}.
              </p>

              <div className="flex flex-col gap-3">
                <Link
                  to={`/donate?campaignId=${targetCampaign?.id}&name=${encodeURIComponent(user?.name || '')}&email=${user?.email}`}
                  className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-2xl shadow-blue-200 transition-all flex items-center justify-center gap-2 group"
                >
                  Proceed to Portal <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button
                  onClick={() => setIsRedirectModalOpen(false)}
                  className="w-full py-3 text-slate-400 font-bold hover:text-slate-600 transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </PageTransition>
  );
};

export default AlumniDonations;