import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
// FIX: Lahat ng imports na ito ay gagamitin na natin sa Stats Grid sa baba
import { Award, Briefcase, Calendar, TrendingUp, LogOut, MessageSquare, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TracerForm from '../alumni/TracerForm';

const AlumniDashboard: React.FC = () => {
  const { user, logout } = useAuth(); 
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSurvey, setShowSurvey] = useState(true);

  // FIX: Gagamitin na natin ang logout function dito
  const handleLogout = () => {
    logout(); // Tinatawag na natin ang actual logout mula sa context
    navigate('/login'); 
  };

  // FIX: Binalik natin ang Stats Data para magamit ang Icons (Award, Briefcase, etc.)
  const stats = [
    { label: 'Job Matches', value: '12', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Upcoming Events', value: '3', icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Active Applications', value: '5', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Certifications', value: '2', icon: Award, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  return (
    <div className="space-y-6 relative">
      
      {/* --- LOGOUT CONFIRMATION MODAL --- */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Sign Out?</h3>
            <p className="text-gray-500 mb-6">Are you sure you want to log out of the portal?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition">
                Cancel
              </button>
              <button onClick={handleLogout} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition">
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- FLOATING SURVEY WIDGET --- */}
      {showSurvey && (
        <div className="fixed bottom-8 right-8 z-40 bg-white p-4 rounded-2xl shadow-2xl border border-blue-100 max-w-xs animate-in slide-in-from-right">
          <button onClick={() => setShowSurvey(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-3">
            <div className="bg-yellow-400 p-2 rounded-lg text-white">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-gray-800 text-sm">Help us Improve!</h4>
              <p className="text-xs text-gray-500 mt-1 mb-2">Take a quick 2-minute survey about your alumni experience.</p>
              <button className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition">
                Take Survey
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-800 to-blue-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name || 'Alumni'}! 👋</h1>
            <p className="text-blue-200 max-w-xl">
              Stay connected with BCP. Update your career profile, browse exclusive job opportunities, and register for upcoming homecoming events.
            </p>
          </div>
          {/* Logout Button in Header */}
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition text-white/80 hover:text-white"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           
           {/* FIX: Binabalik natin ang Stats Grid para magamit ang imports */}
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

           <TracerForm />
        </div>
        
        {/* Right Sidebar (Announcements) */}
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
        </div>
      </div>
    </div>
  );
};

export default AlumniDashboard;