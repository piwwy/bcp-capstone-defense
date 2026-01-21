import React from 'react';
import { Clock, CheckCircle, Search, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const PendingApproval: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
        
        {/* Animated Icon */}
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
          <Clock className="w-10 h-10 text-blue-600 animate-pulse" />
          <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1.5 border-2 border-white">
            <div className="w-3 h-3 bg-yellow-600 rounded-full animate-ping" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Received</h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          We have received your details. Our Alumni Registrar is currently verifying your information against the <span className="font-semibold text-blue-600">Official Record Book</span>.
        </p>

        {/* Steps */}
        <div className="text-left bg-gray-50 rounded-xl p-5 mb-8 space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-800">Details Submitted</p>
              <p className="text-xs text-gray-500">Your profile is queued for checking.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 opacity-60">
            <Search className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-800">Manual Verification</p>
              <p className="text-xs text-gray-500">Registrar checks Batch Year & Course.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 opacity-40">
            <CheckCircle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-800">Approval</p>
              <p className="text-xs text-gray-500">You will receive an email once approved.</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link 
            to="/" 
            className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Home
          </Link>
        </div>
      </div>
      
      <p className="mt-8 text-xs text-gray-400">
        Questions? Contact us at <a href="mailto:alumni@bestlink.edu.ph" className="text-blue-500 hover:underline">alumni@bestlink.edu.ph</a>
      </p>
    </div>
  );
};

export default PendingApproval;