import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { 
  Users, Clock, CheckCircle, AlertTriangle, 
  ArrowRight, TrendingUp, Activity 
} from 'lucide-react';

const DashboardAdmin: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0
  });

  // --- FETCH REAL DATA FROM SUPABASE ---
  useEffect(() => {
    fetchStats();
    
    // Optional: Real-time subscription (para gumalaw agad pag may nag-register)
    const subscription = supabase
      .channel('public:profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchStats)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchStats = async () => {
    try {
      // 1. Get Total Alumni
      const { count: total } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'alumni');

      // 2. Get Pending Approvals
      const { count: pending } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_approval');

      // 3. Get Verified
      const { count: verified } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'verified');

      setStats({
        total: total || 0,
        pending: pending || 0,
        verified: verified || 0,
        rejected: 0 // Pwede mo i-add logic nito later
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- REUSABLE STAT CARD COMPONENT ---
  const StatCard = ({ title, count, icon: Icon, color, link, subtext }: any) => (
    <Link 
      to={link}
      className="relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
    >
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
        <Icon className="w-24 h-24 transform rotate-12 translate-x-4 -translate-y-4" />
      </div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-white`}>
             {/* Note: Colors need to be handled via classes or explicit styles */}
             <div className={`p-2 rounded-lg ${color.replace('text-', 'bg-').replace('600', '100')} ${color}`}>
                <Icon className="w-6 h-6" />
             </div>
          </div>
          {count > 0 && title === 'Pending Approvals' && (
             <span className="flex h-3 w-3">
               <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
             </span>
          )}
        </div>
        
        <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">{title}</h3>
        <div className="flex items-baseline gap-2 mt-1">
          <h1 className="text-4xl font-extrabold text-gray-900">
            {loading ? <span className="animate-pulse">...</span> : count}
          </h1>
          <span className="text-xs font-medium text-green-600 flex items-center">
             <TrendingUp className="w-3 h-3 mr-1" /> Live
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-2">{subtext}</p>
      </div>
    </Link>
  );

  return (
    <div className="p-8 space-y-8 bg-gray-50/50 min-h-screen">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm">Overview of alumni system activities.</p>
        </div>
        <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 flex items-center gap-2">
           <Activity className="w-4 h-4 text-green-500" /> System Online
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* 1. PENDING APPROVALS (The Most Important Widget) */}
        <Link 
          to="/admin/alumni/verify" 
          className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group bg-gradient-to-br from-blue-600 to-blue-800 text-white"
        >
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Clock className="w-32 h-32 text-white transform rotate-12 translate-x-8 -translate-y-8" />
           </div>
           
           <div className="p-6 relative z-10 h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                 <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                    <Clock className="w-6 h-6 text-white" />
                 </div>
                 {stats.pending > 0 && (
                   <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                     ACTION NEEDED
                   </span>
                 )}
              </div>
              
              <div className="mt-6">
                 <h3 className="text-blue-100 text-sm font-medium uppercase tracking-wider">Pending Approvals</h3>
                 <h1 className="text-5xl font-extrabold mt-1">{stats.pending}</h1>
                 <div className="mt-4 flex items-center gap-2 text-sm text-blue-100 font-medium group-hover:gap-3 transition-all">
                    Review Applications <ArrowRight className="w-4 h-4" />
                 </div>
              </div>
           </div>
        </Link>

        {/* 2. Total Alumni */}
        <StatCard 
          title="Total Alumni" 
          count={stats.total} 
          icon={Users} 
          color="text-indigo-600" 
          link="/admin/alumni/directory"
          subtext="Registered in the system"
        />

        {/* 3. Verified Accounts */}
        <StatCard 
          title="Verified Alumni" 
          count={stats.verified} 
          icon={CheckCircle} 
          color="text-green-600" 
          link="/admin/alumni/records"
          subtext="Identify confirmed graduates"
        />

        {/* 4. Issues / Rejected */}
        <StatCard 
          title="Flagged / Issues" 
          count={stats.rejected} 
          icon={AlertTriangle} 
          color="text-orange-600" 
          link="/admin/alumni/requests"
          subtext="Requires attention"
        />
      </div>

      {/* --- RECENT ACTIVITY SECTION (Placeholder for now) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-800 mb-4">Analytics Overview</h3>
            <div className="h-64 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 border-2 border-dashed">
               Chart Integration Coming Soon
            </div>
         </div>

         <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-800 mb-4">Recent Registrations</h3>
            <div className="space-y-4">
               {/* Ito ay sample lang, pwede natin lagyan ng map function later */}
               {[1, 2, 3].map((_, i) => (
                 <div key={i} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
                    <div>
                       <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-1"></div>
                       <div className="h-3 w-20 bg-gray-100 rounded animate-pulse"></div>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>

    </div>
  );
};

export default DashboardAdmin;