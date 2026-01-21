import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Award, Briefcase, Calendar, TrendingUp } from 'lucide-react';
import TracerForm from '../alumni/TracerForm'; // Ito yung ginawa natin sa Step 2

const AlumniDashboard: React.FC = () => {
  const { user } = useAuth();

  // Dummy Data for Widgets
  const stats = [
    { label: 'Job Matches', value: '12', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Upcoming Events', value: '3', icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Active Applications', value: '5', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Certifications', value: '2', icon: Award, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-800 to-blue-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name || 'Alumni'}! 👋</h1>
          <p className="text-blue-200 max-w-xl">
            Stay connected with BCP. Update your career profile, browse exclusive job opportunities, and register for upcoming homecoming events.
          </p>
        </div>
        {/* Decorative Circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute bottom-0 right-20 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Stats & Tracer (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center mb-3`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Tracer Form Section */}
          <TracerForm />
        </div>

        {/* Right Column: News/Announcements (1/3 width) */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center justify-between">
              Latest Announcements
              <span className="text-xs text-blue-600 cursor-pointer hover:underline">View All</span>
            </h3>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 line-clamp-1">Grand Alumni Homecoming 2026</h4>
                    <p className="text-xs text-gray-500 mt-1">Feb 20, 2026 • BCP Main Gym</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg">
            <h3 className="font-bold mb-2">Need your TOR?</h3>
            <p className="text-sm text-green-50 opacity-90 mb-4">You can now request documents online without visiting the campus.</p>
            <button className="w-full bg-white text-green-600 py-2 rounded-lg text-sm font-bold hover:bg-green-50 transition-colors">
              Request Document
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlumniDashboard;