import React from 'react';
import { CheckCircle, Download, Share2 } from 'lucide-react';

interface DonationReceiptProps {
  donation: any;
  campaign: any;
}

const DonationReceipt: React.FC<DonationReceiptProps> = ({ donation, campaign }) => {
  return (
    <div className="bg-white w-full max-w-sm rounded-none shadow-2xl overflow-hidden font-mono text-sm relative">
      {/* Receipt Cut Patterns (Visual only) */}
      <div className="absolute top-0 left-0 w-full h-2 bg-[radial-gradient(circle,transparent_50%,#fff_50%)] bg-[length:16px_16px] -mt-2 rotate-180"></div>
      
      <div className="p-8 bg-slate-900 text-slate-200">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-slate-900">
            <CheckCircle className="w-8 h-8" />
          </div>
        </div>
        <h2 className="text-center text-lg font-bold text-white mb-1">PAYMENT SUBMITTED</h2>
        <p className="text-center text-slate-400 text-xs uppercase tracking-widest">Transaction Pending Verification</p>
      </div>

      <div className="p-8 space-y-6 bg-white text-slate-800">
        <div className="flex justify-between items-end border-b border-dashed border-slate-300 pb-4">
          <span className="text-slate-500 text-xs uppercase">Total Amount</span>
          <span className="text-3xl font-bold text-slate-900">₱{donation.amount.toLocaleString()}</span>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-slate-500">Reference ID</span>
            <span className="font-bold">{donation.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Date</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Method</span>
            <span>{donation.payment_method}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Campaign</span>
            <span className="text-right max-w-[150px] truncate">{campaign?.title}</span>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded border border-slate-200 text-xs text-slate-500 text-center leading-relaxed">
          <p>This is a temporary receipt. The Finance Office will verify your proof of payment. Once approved, the official receipt will be sent to your email.</p>
        </div>

        <button className="w-full py-3 bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
          <Download className="w-4 h-4" /> Save Receipt
        </button>
      </div>

      {/* Bottom Jagged Edge */}
      <div className="absolute bottom-0 left-0 w-full h-2 bg-[radial-gradient(circle,transparent_50%,#fff_50%)] bg-[length:16px_16px] -mb-2"></div>
    </div>
  );
};

export default DonationReceipt;