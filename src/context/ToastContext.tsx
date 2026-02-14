import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Toast, ToastType } from '../components/ui/Toast';

interface ToastOptions {
  title: string;
  message: string;
  type: ToastType;
  durationMs?: number;
  silent?: boolean;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
}

interface ToastItem extends ToastOptions {
  id: string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playToastSound = useCallback((type: ToastType) => {
    try {
      const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }

      const audioContext = audioContextRef.current;
      const now = audioContext.currentTime;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      const toneMap: Record<ToastType, number[]> = {
        success: [660, 880],
        info: [520, 640],
        warning: [420, 360],
        error: [300, 220],
      };

      const tones = toneMap[type];
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(tones[0], now);
      oscillator.frequency.linearRampToValueAtTime(tones[1], now + 0.14);

      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start(now);
      oscillator.stop(now + 0.22);
    } catch (error) {
      console.warn('Toast sound playback skipped:', error);
    }
  }, []);

  const showToast = useCallback((options: ToastOptions) => {
    const toastId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    setToasts((prev) => {
      const next = [...prev, { ...options, id: toastId }];
      return next.slice(-4);
    });

    if (!options.silent) {
      playToastSound(options.type);
    }
  }, [playToastSound]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed top-6 right-6 z-[9999] flex w-full max-w-sm flex-col gap-3 px-3 sm:px-0 pointer-events-none">
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              title={toast.title}
              message={toast.message}
              type={toast.type}
              durationMs={toast.durationMs}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};