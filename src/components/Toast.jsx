import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { useStore } from '../state/store.js';

const ICONS = { success: CheckCircle2, error: XCircle, info: Info };

export default function Toast() {
  const toasts = useStore((s) => s.toasts);
  const removeToast = useStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-stack">
      {toasts.map((t) => {
        const Icon = ICONS[t.type] ?? Info;
        return (
          <div key={t.id} className={`toast toast--${t.type}`}>
            <span className="toast-icon"><Icon size={19} strokeWidth={1.75} /></span>
            <span className="toast-msg">{t.message}</span>
            <button className="toast-close" onClick={() => removeToast(t.id)} aria-label="Dismiss">
              <X size={14} strokeWidth={2} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
