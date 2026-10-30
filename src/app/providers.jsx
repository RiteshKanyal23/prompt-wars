/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { DATA_MODE, IS_LOCAL_MODE } from '@/lib/env';

const ToastContext = createContext(null);
const DataModeContext = createContext({ mode: DATA_MODE, isLocal: IS_LOCAL_MODE });

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (toast) => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { id, tone: 'info', ...toast }]);
      window.setTimeout(() => dismiss(id), toast.duration ?? 4000);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toasts, push, dismiss }), [toasts, push, dismiss]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}

export function useDataMode() {
  return useContext(DataModeContext);
}
