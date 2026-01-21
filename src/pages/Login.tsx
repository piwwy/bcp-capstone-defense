import React, { useState } from 'react';
import { AlertCircle, Eye, EyeOff, Sparkles } from 'lucide-react';
import ApiService from '../services/api';

interface LoginProps {
  onLogin: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await ApiService.login(username, password);
      
      if (response.success) {
        onLogin(response.user);
      } else {
        setError(response.error || 'Login failed');
      }
    } catch (err) {
      setError('Login failed. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = (userType: string) => {
    const credentials = {
      admin: { username: 'admin', password: 'admin123' },
      alumni_head: { username: 'alumni_head', password: 'alumni123' },
      staff: { username: 'staff', password: 'staff123' }
    };
    
    const cred = credentials[userType as keyof typeof credentials];
    setUsername(cred.username);
    setPassword(cred.password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
             <div className="relative flex items-center justify-center">
  <img 
    src="/logosms.png" 
    alt="AMS Logo" 
    className="w-20 h-20 md:w-24 md:h-24 object-contain"
  />
  <Sparkles className="absolute bottom-2 right-2 w-6 h-6 text-yellow-400 animate-pulse" />
</div>

            </div>
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-2">
            Alumni Management
          </h2>
          <p className="text-gray-600 text-lg">Alumni Portal Access</p>
          <div className="mt-4 flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-500">System Online</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-xl animate-shake">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white/50 backdrop-blur-sm"
                  placeholder="Enter your username"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white/50 backdrop-blur-sm"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Quick Login Options */}
          <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-100">
            <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
              <Sparkles className="w-4 h-4 mr-2 text-blue-500" />
              Quick Demo Access
            </p>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => quickLogin('admin')}
                className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-blue-50 transition-colors border border-gray-200 hover:border-blue-300"
              >
                <div className="text-left">
                  <p className="font-medium text-gray-900">Administrator</p>
                  <p className="text-xs text-gray-500">Full system access</p>
                </div>
                <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  admin
                </div>
              </button>
              
              <button
                onClick={() => quickLogin('alumni_head')}
                className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-emerald-50 transition-colors border border-gray-200 hover:border-emerald-300"
              >
                <div className="text-left">
                  <p className="font-medium text-gray-900">Alumni Head</p>
                  <p className="text-xs text-gray-500">Manage alumni & events</p>
                </div>
                <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                  alumni_head
                </div>
              </button>
              
              <button
                onClick={() => quickLogin('staff')}
                className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-purple-50 transition-colors border border-gray-200 hover:border-purple-300"
              >
                <div className="text-left">
                  <p className="font-medium text-gray-900">Registrar Staff</p>
                  <p className="text-xs text-gray-500">Support alumni requests</p>
                </div>
                <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  staff
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Secure • Reliable • Modern Alumni Management
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
