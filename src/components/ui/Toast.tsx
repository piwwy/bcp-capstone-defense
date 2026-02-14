import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  title: string;
  message: string;
  type: ToastType;
  durationMs?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ title, message, type, durationMs = 4000, onClose }) => {
  // Auto-close animation logic
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [durationMs, onClose]);

  const variants = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-300" />,
      border: 'border-emerald-400/40',
      glow: 'shadow-emerald-900/40',
      titleColor: 'text-emerald-100'
    },
    error: {
      icon: <XCircle className="w-5 h-5 text-rose-300" />,
      border: 'border-rose-400/40',
      glow: 'shadow-rose-900/40',
      titleColor: 'text-rose-100'
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5 text-amber-300" />,
      border: 'border-amber-400/40',
      glow: 'shadow-amber-900/40',
      titleColor: 'text-amber-100'
    },
    info: {
      icon: <Info className="w-5 h-5 text-sky-300" />,
      border: 'border-sky-400/40',
      glow: 'shadow-sky-900/40',
      titleColor: 'text-sky-100'
    }
  };

  const config = variants[type];

  return (
    <div className={`pointer-events-auto flex items-start gap-4 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl animate-in slide-in-from-right-4 fade-in duration-300 max-w-sm w-full bg-slate-900/80 ${config.border} ${config.glow}`}>
      <div className="mt-0.5 shrink-0 bg-white/10 rounded-full p-1.5 border border-white/15">{config.icon}</div>
      
      <div className="flex-1">
        <h4 className={`text-sm font-bold ${config.titleColor}`}>{title}</h4>
        <p className="text-xs text-slate-200/90 mt-1 leading-relaxed font-medium">{message}</p>
      </div>

      <button 
        onClick={onClose}
        className="text-slate-300/70 hover:text-white transition-colors p-1"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};