import React, { useState } from 'react';
import { 
  Briefcase, Building, Calendar, DollarSign, Save, 
  CheckCircle2, UserX, UserCheck, GraduationCap
} from 'lucide-react';

const TracerForm: React.FC = () => {
  const [status, setStatus] = useState('Employed');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API Save
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 1500);
  };

  // Status Options with Icons
  const statusOptions = [
    { id: 'Employed', icon: UserCheck, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    { id: 'Unemployed', icon: UserX, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
    { id: 'Self-Employed', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { id: 'Student', icon: GraduationCap, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative">
      
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" /> Career Tracer
          </h2>
          <p className="text-xs text-gray-500 mt-1">Update your employment status for school records.</p>
        </div>
        {success && (
          <span className="text-xs font-bold text-green-600 flex items-center gap-1 bg-green-100 px-3 py-1 rounded-full animate-pulse">
            <CheckCircle2 className="w-3 h-3" /> Saved!
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        
        {/* 1. Status Selector Cards */}
        <div className="mb-8">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Current Status</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {statusOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setStatus(opt.id)}
                className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 h-24 ${
                  status === opt.id 
                    ? `${opt.bg} ${opt.border} ring-2 ring-offset-1 ring-${opt.color.split('-')[1]}-400` 
                    : 'bg-white border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <opt.icon className={`w-6 h-6 ${status === opt.id ? opt.color : 'text-gray-400'}`} />
                <span className={`text-xs font-bold ${status === opt.id ? 'text-gray-900' : 'text-gray-500'}`}>
                  {opt.id}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Employment Details (Animated Show/Hide) */}
        {(status === 'Employed' || status === 'Self-Employed') && (
          <div className="space-y-5 animate-in slide-in-from-top-4 fade-in duration-300">
            
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Company / Organization</label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input type="text" className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" placeholder="e.g. Accenture" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Job Title / Position</label>
                <input type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" placeholder="e.g. Software Engineer" required />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Salary Range</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <select className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none">
                    <option>Below ₱10,000</option>
                    <option>₱10,000 - ₱20,000</option>
                    <option>₱20,001 - ₱30,000</option>
                    <option>₱30,001 - ₱50,000</option>
                    <option>₱50,001 - ₱100,000</option>
                    <option>Above ₱100,000</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Date Hired</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input type="date" className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Is this related to your BCP course?</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors w-full">
                  <input type="radio" name="related" className="w-4 h-4 text-blue-600 focus:ring-blue-500" defaultChecked />
                  <span className="text-sm text-gray-700 font-medium">Yes, it's related</span>
                </label>
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors w-full">
                  <input type="radio" name="related" className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-gray-700 font-medium">No, not related</span>
                </label>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-slate-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving Update...' : <>Save Record <Save className="w-4 h-4" /></>}
          </button>
        </div>

      </form>
    </div>
  );
};

export default TracerForm;