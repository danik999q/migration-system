import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';

export interface ToastOptions {
  id?: string;
  type?: ToastType;
  message: string;
  duration?: number;
}

export interface ToastDescriptor extends Required<Omit<ToastOptions, 'duration'>> {
  duration: number;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const DEFAULT_DURATION = 3500;

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new ReferenceError('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastDescriptor[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const showToast = useCallback(
    ({ id, message, type = 'info', duration = DEFAULT_DURATION }: ToastOptions) => {
      const toastId = id ?? crypto.randomUUID();
      removeToast(toastId);
      const descriptor: ToastDescriptor = { id: toastId, message, type, duration };

      setToasts((prev) => [...prev, descriptor]);
      timers.current[toastId] = setTimeout(() => removeToast(toastId), duration);
    },
    [removeToast]
  );

  const contextValue = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.type}`}>
            <span>{toast.message}</span>
            <button
              type="button"
              className="toast__close"
              aria-label="Dismiss"
              onClick={() => removeToast(toast.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

