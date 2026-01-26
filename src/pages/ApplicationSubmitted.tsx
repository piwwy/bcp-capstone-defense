
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock } from 'lucide-react';

const ApplicationSubmitted = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl overflow-hidden text-center relative">
        <div className="bg-green-600 h-24 w-full absolute top-0 left-0"></div>
        
        <div className="relative z-10 px-8 pt-12 pb-8">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg border-4 border-green-50">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Your application has been sent to the Registrar. <br/>
            We will verify your details against our records.
          </p>

          <div className="bg-blue-50 rounded-xl p-5 mb-8 text-left border border-blue-100">
            <h3 className="font-bold text-blue-900 flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4" /> What happens next?
            </h3>
            <ul className="space-y-3 text-sm text-blue-800/80">
              <li className="flex gap-3">
                <span className="bg-blue-200 text-blue-800 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                Admin reviews your academic details (24-48 hrs).
              </li>
              <li className="flex gap-3">
                <span className="bg-blue-200 text-blue-800 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                You will receive an <strong>Email Notification</strong> once approved.
              </li>
              <li className="flex gap-3">
                <span className="bg-blue-200 text-blue-800 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                Log in securely to access the portal.
              </li>
            </ul>
          </div>

          <Link 
            to="/" 
            className="block w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-slate-500/20"
          >
            Return to Home Page
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ApplicationSubmitted;