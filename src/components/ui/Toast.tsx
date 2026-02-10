import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  title: string;
  message: string;
  type: ToastType;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ title, message, type, onClose }) => {
  // Auto-close animation logic
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000); // 4 seconds visible
    return () => clearTimeout(timer);
  }, [onClose]);

  const variants = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      border: 'border-emerald-500/50',
      bg: 'bg-emerald-50/95',
      titleColor: 'text-emerald-900'
    },
    error: {
      icon: <XCircle className="w-5 h-5 text-rose-500" />,
      border: 'border-rose-500/50',
      bg: 'bg-rose-50/95',
      titleColor: 'text-rose-900'
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
      border: 'border-amber-500/50',
      bg: 'bg-amber-50/95',
      titleColor: 'text-amber-900'
    },
    info: {
      icon: <Info className="w-5 h-5 text-blue-500" />,
      border: 'border-blue-500/50',
      bg: 'bg-blue-50/95',
      titleColor: 'text-blue-900'
    }
  };

  const config = variants[type];

  return (
    <div className={`fixed top-6 right-6 z-[9999] flex items-start gap-4 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-md animate-in slide-in-from-right duration-500 max-w-sm w-full ${config.bg} ${config.border}`}>
      <div className="mt-0.5 shrink-0 bg-white/80 rounded-full p-1">{config.icon}</div>
      
      <div className="flex-1">
        <h4 className={`text-sm font-bold ${config.titleColor}`}>{title}</h4>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">{message}</p>
      </div>

      <button 
        onClick={onClose}
        className="text-slate-400 hover:text-slate-600 transition-colors p-1"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};