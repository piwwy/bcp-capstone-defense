import React, { useState, useEffect } from 'react';
import { ShieldCheck, ArrowRight, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Alumni2FA: React.FC = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);

  // Focus management
  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple chars
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate Verification
    setTimeout(() => {
      setLoading(false);
      navigate('/alumni/dashboard'); // Redirect to dashboard after success
    }, 1500);
  };

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      {/* Security Badge */}
      <div className="mb-8 p-4 bg-blue-500/10 rounded-full border border-blue-500/20 animate-pulse">
        <ShieldCheck className="w-12 h-12 text-blue-400" />
      </div>

      <div className="w-full max-w-md bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Two-Factor Authentication</h2>
          <p className="text-slate-400 text-sm">
            For your security, we've sent a 6-digit code to your email ending in <span className="text-blue-400">@gmail.com</span>
          </p>
        </div>

        <form onSubmit={handleVerify}>
          <div className="flex justify-between gap-2 mb-8">
            {code.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 bg-slate-900 border border-slate-600 rounded-lg text-center text-xl font-bold text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || code.some(c => !c)}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="animate-pulse">Verifying...</span>
            ) : (
              <>
                Verify Identity <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            Didn't receive the code?{' '}
            {timer > 0 ? (
              <span className="text-slate-400 font-mono">Resend in 00:{timer < 10 ? `0${timer}` : timer}</span>
            ) : (
              <button 
                onClick={() => setTimer(60)}
                className="text-blue-400 hover:text-blue-300 font-medium hover:underline"
              >
                Resend Code
              </button>
            )}
          </p>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-2 text-slate-500 text-xs">
        <Lock className="w-3 h-3" />
        <span>Secured by Bestlink College IT Department</span>
      </div>
    </div>
  );
};

export default Alumni2FA;