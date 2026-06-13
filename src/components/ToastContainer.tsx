import { useEffect } from 'react';
import { useAppStore } from '../store';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import './ToastContainer.css';

export function ToastContainer() {
  const toasts = useAppStore(state => state.toasts);
  const removeToast = useAppStore(state => state.removeToast);

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function Toast({ toast, onDismiss }: { toast: any, onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 4000); // auto dismiss after 4s
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const Icon = toast.type === 'success' ? CheckCircle2 :
               toast.type === 'error' ? AlertCircle : Info;

  return (
    <div className={`toast-item toast-${toast.type}`}>
      <Icon size={18} className="toast-icon" />
      <span className="toast-message">{toast.message}</span>
      <button onClick={onDismiss} className="toast-close">
        <X size={14} />
      </button>
    </div>
  );
}
