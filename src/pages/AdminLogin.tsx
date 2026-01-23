import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Added Link
import { supabase } from '../services/supabaseClient';
import { ArrowLeft } from 'lucide-react'; // Added Icon

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Sign In
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      if (!user) throw new Error('No user found');

      // 2. Security Check: Admin Role Only
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!['admin', 'superadmin', 'registrar'].includes(profile?.role)) {
        await supabase.auth.signOut();
        throw new Error('Access Denied: Administrative privileges required.');
      }

      // 3. Success Redirect
      navigate('/admin/dashboard');

    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      await supabase.auth.signOut(); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img 
                src="/images/logosmss.png" 
                alt="Linker College Logo" 
                className="h-24 w-24 object-contain" 
              />
            </div>
            <p className="text-lg font-semibold text-blue-700 mt-1">Alumni Management System</p>
            <p className="text-gray-500 text-sm mt-2 uppercase tracking-wide">Administrator Portal</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 text-sm rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="admin@linker.edu.ph"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
            >
              {loading ? 'Verifying Access...' : 'Sign In'}
            </button>
          </form>

          {/* Footer & Back Link */}
          <div className="mt-8 text-center space-y-4">
            <p className="text-xs text-gray-400 border-b border-gray-100 pb-4">
              Authorized personnel only. <br/> IP address is logged for security purposes.
            </p>
            
            {/* --- BACK TO HOME LINK --- */}
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors font-medium">
               <ArrowLeft className="w-4 h-4" /> Back to Home Page
            </Link>
          </div>
          
        </div>
      </div>
    </div>
  );
}