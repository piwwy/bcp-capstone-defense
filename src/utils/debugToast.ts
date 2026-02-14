import { ToastType } from '../components/ui/Toast';

interface ToastPayload {
  type: ToastType;
  title: string;
  message: string;
  durationMs?: number;
  silent?: boolean;
}

type ShowToastFn = (payload: ToastPayload) => void;

const isDebugToastEnabled = () => {
  const forceVerbose = import.meta.env.VITE_VERBOSE_DEBUG_TOASTS === 'true';
  return import.meta.env.DEV || forceVerbose;
};

export const debugToast = (
  showToast: ShowToastFn,
  title: string,
  message: string,
  options?: Partial<ToastPayload>
) => {
  if (!isDebugToastEnabled()) return;

  showToast({
    type: options?.type || 'info',
    title,
    message,
    durationMs: options?.durationMs ?? 2200,
    silent: options?.silent ?? true,
  });
};

export const getDebugToastModeLabel = () => {
  if (import.meta.env.VITE_VERBOSE_DEBUG_TOASTS === 'true') return 'verbose';
  return import.meta.env.DEV ? 'dev-only' : 'off';
};
