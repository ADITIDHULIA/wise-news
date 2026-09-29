'use client';

import { useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error';
}

let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = `toast-${toastId++}`;
    const newToast: ToastMessage = { id, message, type };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return { toasts, toast };
}

export function Toast({ message, type }: Omit<ToastMessage, 'id'>) {
  return (
    <div
      className={`animate-fadeInUp flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg border ${
        type === 'success'
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-red-50 border-red-200 text-red-800'
      }`}
    >
      {type === 'success' ? (
        <CheckCircle className="h-5 w-5 flex-shrink-0" />
      ) : (
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
      )}
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}

export function ToastContainer({ toasts }: { toasts: ToastMessage[] }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <Toast message={t.message} type={t.type} />
        </div>
      ))}
    </div>
  );
}
