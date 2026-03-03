import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useModuleCounts } from '../../hooks/useSupabaseQuery';
import {
    DollarSign, Heart, TrendingUp, ArrowRight, Loader2,
    Wallet, Receipt, CreditCard, Banknote, Calendar
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';


const formatMoney = (value: number) =>
    new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: 0
    }).format(Math.max(0, value));

const FinanceManagerDashboard: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [recentDonations, setRecentDonations] = useState<any[]>([]);
    const [totalDonations, setTotalDonations] = useState(0);
    const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);

    const { data: moduleCounts } = useModuleCounts({ activeOnly: true });

    useEffect(() => {
        if (user) {
            fetchFinanceData();
        }
    }, [user]);

    const fetchFinanceData = async () => {
        try {
            setLoading(true);

            // Fetch total verified donations
            const { data: donations } = await supabase
                .from('donations')
                .select('amount, created_at, donor_name')
                .eq('status', 'verified')
                .order('created_at', { ascending: false });

            if (donations) {
                setTotalDonations(donations.reduce((acc, d) => acc + (Number(d.amount) || 0), 0));
                setRecentDonations(donations.slice(0, 5));

                // Process monthly revenue for chart
                const revenueMap: Record<string, number> = {};
                donations.forEach(d => {
                    const month = new Date(d.created_at).toLocaleString('default', { month: 'short' });
                    revenueMap[month] = (revenueMap[month] || 0) + (Number(d.amount) || 0);
                });
                setMonthlyRevenue(Object.entries(revenueMap).map(([name, value]) => ({ name, value })).reverse().slice(0, 6));
            }

        } catch (error) {
            console.error('Error fetching finance dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                    <p className="text-sm text-gray-500 font-medium">Loading Financial Records...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 bg-gray-50/50 min-h-screen animate-in fade-in duration-500">
            {/* Hero Banner */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900 p-12 shadow-2xl">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 right-10 w-72 h-72 bg-emerald-500 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-10 left-10 w-96 h-96 bg-teal-500 rounded-full blur-3xl animate-pulse delay-1000"></div>
                </div>

                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex-1">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm text-white rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-white/20">
                            <DollarSign className="w-3.5 h-3.5" /> Finance Manager Portal
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter mb-3">
                            Financial Assets
                        </h1>
                        <p className="text-emerald-100 text-lg max-w-2xl leading-relaxed">
                            Oversee donations, campaign revenue, and financial collections for the alumni organization with maximum transparency.
                        </p>

                        <div className="flex items-center gap-6 mt-8">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                                    <Banknote className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-white">{formatMoney(totalDonations)}</p>
                                    <p className="text-xs text-emerald-200 font-bold uppercase tracking-wider">Total Verified Revenue</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                                    <Heart className="w-6 h-6 text-pink-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-white">{moduleCounts?.campaigns || 0}</p>
                                    <p className="text-xs text-emerald-200 font-bold uppercase tracking-wider">Active Campaigns</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Overview */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                    <h3 className="font-black text-slate-900 mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-600" /> Revenue Trends
                    </h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyRevenue}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <Tooltip
                                    formatter={(value: any) => formatMoney(Number(value) || 0)}
                                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}
                                />
                                <Bar dataKey="value" fill="#10B981" radius={[10, 10, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Quick Stats Cards */}
                <div className="space-y-4">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl text-white shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <Receipt className="w-5 h-5" />
                            </div>
                            <p className="text-xs font-black uppercase tracking-widest opacity-80">Quick Action</p>
                        </div>
                        <h4 className="text-xl font-black mb-2">Verify Payments</h4>
                        <p className="text-xs text-blue-100 mb-4 opacity-70 leading-relaxed">Check and confirm pending donation proofs from alumni.</p>
                        <Link to="/admin/donations" className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-700 rounded-xl text-[10px] font-black uppercase hover:bg-blue-50 transition-colors">
                            Manage Donations <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 rounded-3xl text-white shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <Wallet className="w-5 h-5" />
                            </div>
                            <p className="text-xs font-black uppercase tracking-widest opacity-80">Quick Action</p>
                        </div>
                        <h4 className="text-xl font-black mb-2">Manage Campaigns</h4>
                        <p className="text-xs text-emerald-100 mb-4 opacity-70 leading-relaxed">Launch or update donation campaigns for projects.</p>
                        <Link to="/admin/donations" className="inline-flex items-center gap-2 px-4 py-2 bg-white text-emerald-700 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-50 transition-colors">
                            Manage Campaigns <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Recent Transactions List */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-black text-slate-900">Verified Transactions</h3>
                    <Link to="/admin/collections" className="text-xs font-black text-emerald-600 uppercase tracking-widest hover:underline">View All Records</Link>
                </div>
                <div className="space-y-4">
                    {recentDonations.map((d, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-200 transition-all">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                <CreditCard className="w-6 h-6 text-slate-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-900 truncate">{d.donor_name || 'Anonymous Donor'}</h4>
                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> {new Date(d.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-emerald-600">{formatMoney(d.amount)}</p>
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Verified</span>
                            </div>
                        </div>
                    ))}
                    {recentDonations.length === 0 && (
                        <div className="text-center py-10">
                            <Wallet className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                            <p className="text-slate-400 text-sm font-medium">No verified donations recorded yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FinanceManagerDashboard;
