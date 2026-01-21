import React, { useState } from 'react';
import { Briefcase, Building, Calendar, DollarSign, Save } from 'lucide-react';

const TracerForm: React.FC = () => {
  const [status, setStatus] = useState('Employed');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      alert("Career profile updated successfully!");
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
          <Briefcase className="w-5 h-5" /> Employment Tracer
        </h2>
        <p className="text-blue-100 text-xs">Keep your career data updated for BCP records.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Employment Status Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
          <div className="grid grid-cols-3 gap-3">
            {['Employed', 'Unemployed', 'Self-Employed'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`py-2 px-3 text-sm rounded-lg border transition-all ${
                  status === s
                    ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold ring-1 ring-blue-500'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {status !== 'Unemployed' && (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company / Business Name</label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input type="text" className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Accenture" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Position / Title</label>
                <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Software Engineer" required />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Salary Range</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <select className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option>Below ₱10,000</option>
                    <option>₱10,000 - ₱20,000</option>
                    <option>₱20,001 - ₱30,000</option>
                    <option>₱30,001 - ₱50,000</option>
                    <option>₱50,001 - ₱100,000</option>
                    <option>Above ₱100,000</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Hired</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input type="date" className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Is this related to your course?</label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input type="radio" name="related" className="text-blue-600 focus:ring-blue-500" defaultChecked />
                  <span className="text-sm text-gray-700">Yes, it's related</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="related" className="text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-gray-700">No, not related</span>
                </label>
              </div>
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
        >
          {loading ? 'Saving...' : <><Save className="w-4 h-4" /> Save Update</>}
        </button>
      </form>
    </div>
  );
};

export default TracerForm;